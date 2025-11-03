# Deployment Guide - Quill Your Dream

This guide covers automated deployment to your production server using Docker Compose.

## Overview

The application uses **Docker Compose** for deployment with **NeDB as the default database**.

- **Default**: NeDB (file-based database, no external dependencies)
- **Optional**: MongoDB (for scalability, enabled via profiles)

## Automated Deployment (GitHub Actions)

### Prerequisites

Configure these secrets in your GitHub repository:
- Go to **Settings → Secrets and variables → Actions**
- Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERVER_HOST` | Server IP address | `165.232.58.95` |
| `SERVER_USERNAME` | SSH username | `root` or `deploy` |
| `SERVER_PASSWORD` | SSH password | Your server password |

### Automated Deployment Workflow

**File**: `.github/workflows/production-deploy.yml`

**Triggers**: Automatically deploys on every push to `main` branch

**What it does**:
1. ✅ Connects to server via SSH (password authentication)
2. ✅ Pulls latest code from GitHub
3. ✅ Ensures .env file exists
4. ✅ Creates necessary directories (data/nedb, logs, attached_assets)
5. ✅ Rebuilds Docker image with latest code
6. ✅ Restarts containers with zero downtime
7. ✅ Uses NeDB database service (file-based, data persists in ./data/)

**Deployment URL**: `http://YOUR_SERVER_IP:3000`

**Advantages**:
- ✅ Automatic deployments on git push
- ✅ Zero downtime during updates
- ✅ Containerized for consistency
- ✅ NeDB data persists across restarts
- ✅ No external database required
- ✅ Simple password-based SSH authentication

## Docker Compose Configuration

### Default: NeDB Deployment

Start the application with NeDB (default):

```bash
docker-compose up -d
```

This starts only the `app` service with NeDB database.

**What runs**:
- ✅ Application container (`quillyourdream-app`)
- ✅ NeDB database (file-based at `./data/nedb/`)
- ✅ Port 3000 exposed

### Optional: MongoDB Deployment

To use MongoDB instead of NeDB:

1. **Set environment variable** in `.env`:
   ```bash
   USE_NEDB=false
   MONGODB_URI=mongodb://quilladmin:yourpassword@mongodb:27017/quillyourdream?authSource=admin
   ```

2. **Start with MongoDB profile**:
   ```bash
   docker-compose --profile mongodb up -d
   ```

**What runs**:
- ✅ Application container
- ✅ MongoDB container (`quillyourdream-db`)
- ✅ MongoDB data persists in Docker volume

### Optional: Nginx Reverse Proxy

For production with custom domain and SSL:

```bash
docker-compose --profile production --profile mongodb up -d
```

This adds Nginx for:
- ✅ SSL/TLS termination
- ✅ Custom domain support
- ✅ Static asset caching

## Manual Deployment

### SSH into server and deploy:

```bash
# 1. SSH into server (use your server credentials)
ssh username@your-server-ip

# 2. Navigate to project
cd ~/quillyourdream

# 3. Pull latest code
git pull origin main

# 4. Ensure data directories exist
mkdir -p data/nedb logs attached_assets

# 5. Rebuild and restart
docker-compose build --no-cache
docker-compose down
docker-compose up -d

# 6. Check status
docker-compose ps
docker-compose logs -f app
```

## Initial Server Setup

### 1. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get update
apt-get install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 2. Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/quillyourdream.git
cd quillyourdream
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Required settings**:
```bash
# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-secret-here

# Application URL
APP_DOMAIN=quillyourdream.com,www.quillyourdream.com

# Database (NeDB is default)
# USE_NEDB=true  # Already default, no need to set
# USE_NEDB=false  # Uncomment to use MongoDB instead

# MongoDB settings (only if USE_NEDB=false)
# MONGO_USER=quilladmin
# MONGO_PASSWORD=secure-password-here
# MONGODB_URI=mongodb://quilladmin:secure-password@mongodb:27017/quillyourdream?authSource=admin
```

### 4. Create Required Directories

```bash
mkdir -p data/nedb
mkdir -p logs
mkdir -p attached_assets
```

### 5. Initial Build & Start

```bash
# Build the Docker image
docker-compose build

# Start the application
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## Database Management

### NeDB (Default)

**Location**: `./data/nedb/*.db` files

**Admin Credentials** (NeDB):
- Email: `admin@quillyourdream.com`
- Password: `admin123`

**Advantages**:
- ✅ No external database needed
- ✅ Automatic data persistence
- ✅ Sample data auto-loaded on first run
- ✅ Simple backups (just copy files)

**Backup**:
```bash
# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restore backup
tar -xzf backup-20250101.tar.gz
```

**Access inside container**:
```bash
# View NeDB files
docker-compose exec app ls -lh /app/data/nedb/

# Check database contents
docker-compose exec app cat /app/data/nedb/artworks.db | grep title
```

### MongoDB (Optional)

**Admin Credentials** (MongoDB):
- Email: `admin@quillyourdream.com`
- Password: `BlueGrass20!`

To switch to MongoDB:

1. **Update .env**:
   ```bash
   USE_NEDB=false
   MONGO_PASSWORD=your-secure-password
   ```

2. **Restart with MongoDB**:
   ```bash
   docker-compose --profile mongodb up -d
   ```

**MongoDB Backup**:
```bash
# Backup
docker-compose exec mongodb mongodump --out=/data/backup

# Restore
docker-compose exec mongodb mongorestore /data/backup
```

## Monitoring & Logs

### Docker Compose Commands

```bash
# View all containers
docker-compose ps

# View logs (live)
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app

# Restart application
docker-compose restart app

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Container Shell Access

```bash
# Access application container
docker-compose exec app sh

# View environment variables
docker-compose exec app env

# Check NeDB files
docker-compose exec app ls -lh /app/data/nedb/
```

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check from outside server
curl http://165.232.58.95:3000/api/health
```

## Troubleshooting

### Deployment Fails

**Check GitHub Actions logs**:
- Go to repository → Actions tab
- Click on failed workflow
- Review error messages

**Common issues**:
1. **SSH connection failed**: Verify `SSH_PRIVATE_KEY` secret is correct
2. **Build failed**: Check Dockerfile and dependencies
3. **Permission denied**: Ensure SSH user has Docker permissions

### Container Won't Start

```bash
# Check container logs
docker-compose logs app

# Check all containers
docker-compose ps

# Rebuild image
docker-compose build --no-cache

# Remove all containers and start fresh
docker-compose down
docker-compose up -d
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
echo "APP_PORT=3001" >> .env
docker-compose up -d
```

### Database Issues

```bash
# Check NeDB files exist
ls -lh data/nedb/

# Verify permissions
chmod -R 755 data/

# Reset database (will reload sample data on next start)
rm -rf data/nedb/*.db
docker-compose restart app

# View database files
docker-compose exec app ls -lh /app/data/nedb/
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker images/containers
docker system prune -a

# Remove old images
docker image prune -a
```

## Production Checklist

Before going live:

- [ ] Configure firewall (allow ports 80, 443, 3000)
- [ ] Set up SSL certificate (Let's Encrypt with Certbot)
- [ ] Configure custom domain DNS (A record → 165.232.58.95)
- [ ] Set strong `SESSION_SECRET` in `.env`
- [ ] Configure `ADMIN_EMAILS` in `.env`
- [ ] Set `APP_DOMAIN` with your domain
- [ ] Set up automatic backups (cron job for `data/` folder)
- [ ] Configure Nginx reverse proxy with `--profile production`
- [ ] Test deployment pipeline with a test push

## Nginx Configuration (Optional)

For production with custom domain, create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name quiltyourdream.com www.quiltyourdream.com;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

Then start with:
```bash
docker-compose --profile production up -d
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_NEDB` | `true` | Use NeDB (true) or MongoDB (false) |
| `APP_PORT` | `3000` | Application port |
| `SESSION_SECRET` | (required) | Session encryption secret |
| `APP_DOMAIN` | `localhost:3000` | Your domain name |
| `ADMIN_EMAILS` | `admin@quillyourdream.com` | Admin email addresses |
| `MONGO_USER` | `quilladmin` | MongoDB username (if USE_NEDB=false) |
| `MONGO_PASSWORD` | `changeme123` | MongoDB password (if USE_NEDB=false) |
| `MONGODB_URI` | (auto-generated) | MongoDB connection string |

## Quick Reference

```bash
# Deploy latest changes (automatic via GitHub)
git push origin main

# Manual deploy
ssh root@165.232.58.95
cd ~/quillyourdream
git pull && docker-compose build && docker-compose up -d

# View logs
docker-compose logs -f app

# Restart app
docker-compose restart app

# Stop app
docker-compose down

# Backup data
tar -czf backup.tar.gz data/ attached_assets/

# View app status
docker-compose ps
```

---

**Default Deployment**: NeDB-based Docker deployment automatically triggers on every push to `main` branch! 🚀

**Application URL**: `http://165.232.58.95:3000`
