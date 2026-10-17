# Production Deployment Guide

This guide documents the deployment process for CMRS on a VPS.

## Server Requirements

- **OS:** Ubuntu 20.04+ or similar Linux distribution
- **RAM:** Minimum 2GB
- **Storage:** 20GB+
- **Ports:** 8080 (frontend/nginx), 8081 (backend/gunicorn), 5432 (PostgreSQL)

## Architecture Overview

`
Internet → ngrok tunnel → Nginx (8080) → Gunicorn (8081) → Django → PostgreSQL (5432)
                              ↓
                         Static Files (frontend/dist/)
`

## Prerequisites

1. VPS with root access
2. Domain name or ngrok account for public URL
3. PostgreSQL database server
4. Python 3.9+ and Node.js 18+ for building

## Environment Variables

Create .env file with:

`ash
# Django Settings
SECRET_KEY=<your-secret-key>
DEBUG=False
ALLOWED_HOSTS=your-domain.com,localhost,127.0.0.1

# Database
DB_NAME=cmrs
DB_USER=cmrs_user
DB_PASSWORD=<secure-password>
DB_HOST=localhost
DB_PORT=5432

# CORS (if needed)
CORS_ALLOWED_ORIGINS=https://your-frontend-url.com
`

## Deployment Steps

### 1. Database Setup

`ash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE cmrs;
CREATE USER cmrs_user WITH PASSWORD '<secure-password>';
GRANT ALL PRIVILEGES ON DATABASE cmrs TO cmrs_user;
\q
`

### 2. Backend Deployment

`ash
# Clone repository
cd /opt
git clone <repository-url> cmrs
cd cmrs/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Seed demo data (optional)
python manage.py shell < scripts/seed_demo_data.py
`

### 3. Frontend Build

`ash
# On local machine or build server
cd frontend
npm install
npm run build

# Upload dist/ folder to server
scp -r dist/* user@server:/opt/cmrs/frontend/dist/
`

### 4. Gunicorn Setup

Create systemd service: /etc/systemd/system/cmrs-gunicorn.service

`ini
[Unit]
Description=CMRS Gunicorn Daemon
After=network.target

[Service]
Type=notify
User=root
WorkingDirectory=/opt/cmrs/backend
Environment="PATH=/opt/cmrs/backend/venv/bin"
ExecStart=/opt/cmrs/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8081 \
    --timeout 120 \
    --access-logfile /var/log/cmrs/access.log \
    --error-logfile /var/log/cmrs/error.log \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
`

Enable and start:

`ash
sudo mkdir -p /var/log/cmrs
sudo systemctl daemon-reload
sudo systemctl enable cmrs-gunicorn
sudo systemctl start cmrs-gunicorn
sudo systemctl status cmrs-gunicorn
`

### 5. Nginx Configuration

Create: /etc/nginx/sites-available/cmrs

`
ginx
server {
    listen 8080;
    server_name localhost;

    # Frontend static files
    location / {
        root /opt/cmrs/frontend/dist;
        try_files  / /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host System.Management.Automation.Internal.Host.InternalHost;
        proxy_set_header X-Real-IP ;
        proxy_set_header X-Forwarded-For ;
        proxy_set_header X-Forwarded-Proto ;
    }

    # Static files from Django
    location /static/ {
        alias /opt/cmrs/backend/staticfiles/;
    }
}
`

Enable site:

`ash
sudo ln -s /etc/nginx/sites-available/cmrs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
`

### 6. Public URL with ngrok

`ash
# Install ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Authenticate
ngrok config add-authtoken <your-authtoken>

# Start tunnel
ngrok http 8080
`

## Monitoring & Maintenance

### Logs

`ash
# Application logs
tail -f /var/log/cmrs/error.log
tail -f /var/log/cmrs/access.log

# Nginx logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -u cmrs-gunicorn -f
`

### Database Backups

`ash
# Create backup
pg_dump cmrs > cmrs_backup_.sql

# Restore backup
psql cmrs < cmrs_backup_20260117.sql
`

### Service Management

`ash
# Restart services
sudo systemctl restart cmrs-gunicorn
sudo systemctl restart nginx

# Check status
sudo systemctl status cmrs-gunicorn
sudo systemctl status nginx

# View resource usage
htop
`

## Security Considerations

1. **Firewall:** Configure UFW to allow only necessary ports
2. **HTTPS:** Use ngrok's HTTPS or set up Let's Encrypt
3. **Database:** Use strong passwords, limit connections
4. **Updates:** Regularly update system packages
5. **Backups:** Implement automated daily backups

## Troubleshooting

### Common Issues

**502 Bad Gateway:**
- Check if Gunicorn is running: sudo systemctl status cmrs-gunicorn
- Check logs: 	ail -f /var/log/cmrs/error.log

**Database Connection Error:**
- Verify PostgreSQL is running: sudo systemctl status postgresql
- Check credentials in .env file
- Test connection: psql -U cmrs_user -d cmrs -h localhost

**Frontend Not Loading:**
- Check if dist/ files exist: ls -la /opt/cmrs/frontend/dist/
- Clear browser cache
- Verify Nginx config: sudo nginx -t

### Performance Tuning

1. Increase Gunicorn workers for higher traffic
2. Add Redis for caching
3. Configure PostgreSQL connection pooling
4. Enable Gzip compression in Nginx
5. Use CDN for static assets

---

## Quick Reference

| Service | Port | Command |
|---------|------|---------|
| Frontend (Nginx) | 8080 | systemctl restart nginx |
| Backend (Gunicorn) | 8081 | systemctl restart cmrs-gunicorn |
| Database (PostgreSQL) | 5432 | systemctl restart postgresql |
| Tunnel (ngrok) | Dynamic | 
grok http 8080 |

---

**Note:** This deployment is for demonstration purposes. For production, use proper domain, SSL certificate, monitoring, and security hardening.
