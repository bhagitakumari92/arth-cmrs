# Git Configuration for VPS & GitHub Publishing

Since Git is blocked on your local system, we'll configure everything on the VPS and publish from there.

## Prerequisites on VPS

- SSH access to VPS: root@54.161.119.63
- GitHub account (personal)
- Personal access token from GitHub

---

## STEP 1: Generate GitHub Personal Access Token (5 min)

### On your local machine (browser):

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Set:
   - Note: "CMRS Assignment Deployment"
   - Expiration: 7 days (or longer)
   - Select scopes:
     - ✓ repo (full control)
     - ✓ workflow
4. Click "Generate token"
5. **⚠️ COPY TOKEN NOW** - you'll only see it once!

Example token format: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

---

## STEP 2: SSH into VPS and Configure Git (10 min)

### Connect to VPS:

``ash
# On local PowerShell
ssh root@54.161.119.63
# Password: 000265!Anurag
``

### Configure Git:

Once connected to VPS, run these commands:

``ash
# Check if Git is installed
git --version
# If not installed: sudo apt install git -y

# Configure Git user (required for commits)
git config --global user.name "Anurag Sharma"
git config --global user.email "anurag@example.com"

# Verify configuration
git config --list
``

---

## STEP 3: Create GitHub Repository (5 min)

### Option A: Create via GitHub Web UI

1. Go to: https://github.com/new
2. Repository details:
   - Repository name: rth-cmrs
   - Description: "Cash Management & Reconciliation System - Full Stack Django + React"
   - Visibility: Public (for assignment submission)
   - ❌ Don't initialize with README (we have one)
3. Click "Create repository"
4. Note the repository URL: https://github.com/YOUR_USERNAME/arth-cmrs.git

### Option B: Create via GitHub CLI (if installed on VPS)

``ash
# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch= signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/githubcli.list > /dev/null
sudo apt update
sudo apt install gh -y

# Authenticate
gh auth login
# Choose: GitHub.com, HTTPS, Yes (upload SSH key), Login with web browser
# Or use token: gh auth login --with-token

# Create repo
gh repo create arth-cmrs --public --description "Cash Management & Reconciliation System"
``

---

## STEP 4: Upload Code to VPS (Methods)

### Method 1: Clone from Local (if you have a remote Git repo)

If your local code is already in a GitLab/Bitbucket repo:

``ash
# On VPS
cd /opt
git clone https://gitlab.com/your-username/arth-cmrs.git
cd arth-cmrs
``

### Method 2: Upload Files via SCP/SFTP (Recommended)

``powershell
# On local PowerShell - Compress and upload
# Create archive
Compress-Archive -Path C:\Users\anuragS\Desktop\Anurag\Raja\Arth\* 
    -DestinationPath C:\Users\anuragS\AppData\Local\Temp\arth-cmrs.zip 
    -Force

# Upload to VPS
scp C:\Users\anuragS\AppData\Local\Temp\arth-cmrs.zip root@54.161.119.63:/tmp/

# SSH to VPS and extract
ssh root@54.161.119.63
# On VPS:
cd /opt
unzip /tmp/arth-cmrs.zip -d arth-cmrs
cd arth-cmrs
``

---

## STEP 5: Initialize Git Repository on VPS (5 min)

``ash
# Navigate to project
cd /opt/arth-cmrs

# Initialize Git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - CMRS Cash Management & Reconciliation System

Features:
- Django REST Framework backend with PostgreSQL
- React + Vite + Tailwind CSS frontend
- Role-based access control (Admin, Manager, Agent)
- Complete cash lifecycle tracking
- 29 passing tests
- Production deployment on VPS

Public Demo: https://unopened-lend-wriggly.ngrok-free.dev/
Demo Credentials: admin/admin123"
``

---

## STEP 6: Connect to GitHub and Push (5 min)

``ash
# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/arth-cmrs.git

# Push to GitHub (use your GitHub token as password)
git push -u origin master
# Username: YOUR_USERNAME
# Password: ghp_your_token_here

# Alternative: Use token in URL (easier)
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/arth-cmrs.git
git push -u origin master
``

---

## STEP 7: Verify Upload (2 min)

``ash
# Check remote status
git remote -v

# See commit history
git log --oneline

# Check files uploaded
git ls-files | head -20
``

On GitHub web interface:
1. Go to: https://github.com/YOUR_USERNAME/arth-cmrs
2. Verify all files are present
3. Check README.md is displayed

---

## Quick Script for VPS

Save this as setup_git.sh and run on VPS:

``ash
#!/bin/bash

# Variables - UPDATE THESE
GITHUB_USERNAME="your-username"
GITHUB_TOKEN="ghp_your_token_here"
REPO_NAME="arth-cmrs"

echo "=== Configuring Git ==="
git config --global user.name "Anurag Sharma"
git config --global user.email "anurag@example.com"

echo "=== Initializing Repository ==="
cd /opt/arth-cmrs
git init

echo "=== Adding Files ==="
git add .

echo "=== Creating Commit ==="
git commit -m "Initial commit - CMRS

- Django REST Framework backend
- React frontend  
- PostgreSQL database
- Role-based access control
- Production deployment ready

Demo: https://unopened-lend-wriggly.ngrok-free.dev/"

echo "=== Adding Remote ==="
git remote add origin https://@github.com//.git

echo "=== Pushing to GitHub ==="
git push -u origin master

echo "=== Done! ==="
echo "Repository: https://github.com//"
``

---

## Alternative: Paramiko Script (Automated)

If you want to automate from local machine:

``python
# upload_to_github.py (run locally)
import paramiko

VPS_IP = '54.161.119.63'
VPS_USER = 'root'
VPS_PASSWORD = '000265!Anurag'

# Your GitHub credentials
GITHUB_USERNAME = 'your-username'
GITHUB_TOKEN = 'ghp_your_token_here'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASSWORD)

commands = [
    'git config --global user.name "Anurag Sharma"',
    'git config --global user.email "anurag@example.com"',
    'cd /opt/arth-cmrs && git init',
    'cd /opt/arth-cmrs && git add .',
    'cd /opt/arth-cmrs && git commit -m "Initial commit"',
    f'cd /opt/arth-cmrs && git remote add origin https://{GITHUB_TOKEN}@github.com/{GITHUB_USERNAME}/arth-cmrs.git',
    'cd /opt/arth-cmrs && git push -u origin master'
]

for cmd in commands:
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print(f"Error: {err}")

ssh.close()
print("Code pushed to GitHub!")
``

---

## Checklist

Before pushing:
- [ ] All sensitive files in .gitignore
- [ ] .env file NOT included
- [ ] README.md has public URL
- [ ] Demo credentials documented
- [ ] No test scripts in root

After pushing:
- [ ] Verify on GitHub web interface
- [ ] Check README displays correctly
- [ ] Test clone on another machine
- [ ] Add repository URL to assignment submission

---

## Need Help?

Common issues:

**"Repository not found":**
- Create repo on GitHub first (Step 3)
- Check repository name matches exactly

**"Authentication failed":**
- Use Personal Access Token, not password
- Token needs 'repo' scope checked

**"Updates were rejected":**
- Repository has files (you initialized with README)
- Force push: git push -f origin master

**Large files not uploading:**
- GitHub has 100MB file limit
- Check frontend/node_modules not included

---

**Total Time: 30-40 minutes**
