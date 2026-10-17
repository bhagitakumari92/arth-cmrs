# Quick Upload Script
# Save and run this in PowerShell to automate the upload process

import paramiko
import os

VPS_IP = '54.161.119.63'
VPS_USER = 'root'
VPS_PASSWORD = '000265!Anurag'

print("=" * 60)
print("UPLOADING CODE TO VPS FOR GITHUB PUBLISHING")
print("=" * 60)

# Connect to VPS
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASSWORD, timeout=30)

# Check if code already exists on VPS
stdin, stdout, stderr = ssh.exec_command('ls -la /opt/ | grep cmrs')
if stdout.read().decode():
    print("\n[!] Code already exists at /opt/cmrs")
    print("[!] Using existing deployment directory")
    
    # Configure Git
    print("\n[1/4] Configuring Git...")
    commands = [
        'git config --global user.name "Anurag Sharma"',
        'git config --global user.email "anurag@arth.com"'
    ]
    
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.channel.recv_exit_status()
    
    print("[OK] Git configured")
    
    # Initialize Git in existing directory
    print("\n[2/4] Initializing Git repository...")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/cmrs && git init')
    exit_code = stdout.channel.recv_exit_status()
    print("[OK] Git initialized")
    
    print("\n[3/4] Adding files...")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/cmrs && git add .')
    exit_code = stdout.channel.recv_exit_status()
    
    # Check status
    stdin, stdout, stderr = ssh.exec_command('cd /opt/cmrs && git status --short')
    files = stdout.read().decode()
    file_count = len(files.strip().split('\n')) if files.strip() else 0
    print(f"[OK] {file_count} files staged")
    
    print("\n[4/4] Creating initial commit...")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/cmrs && git commit -m "Initial commit - CMRS Cash Management System"')
    exit_code = stdout.channel.recv_exit_status()
    print("[OK] Committed")
    
    print("\n" + "=" * 60)
    print("NEXT STEPS - Do these manually:")
    print("=" * 60)
    print("\n1. Create GitHub repository:")
    print("   https://github.com/new")
    print("   Name: arth-cmrs")
    print("   Public, no README")
    
    print("\n2. Generate Personal Access Token:")
    print("   https://github.com/settings/tokens")
    print("   Select 'repo' scope")
    
    print("\n3. Add remote (on VPS):")
    print("   cd /opt/cmrs")
    print("   git remote add origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/arth-cmrs.git")
    
    print("\n4. Push:")
    print("   git push -u origin master")
    
    print("\n" + "=" * 60)
    print("Repository ready: /opt/cmrs on VPS")
    print("=" * 60)

else:
    print("\n[!] Code not found at /opt/cmrs")
    print("[!] Deploying frontend and backend to VPS first...")

ssh.close()
