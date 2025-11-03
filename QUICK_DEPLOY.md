# Quick Deploy Reference

## Automated Deployment (GitHub Actions)

Every push to `main` branch automatically deploys to production.

```bash
git add .
git commit -m "Your changes"
git push origin main
```

**What happens**:
1. GitHub Actions triggers
2. SSH into server (password authentication)
3. Pull latest code
4. Build Docker image
5. Restart containers
6. Application live at `http://YOUR_SERVER_IP:3000`

## Manual Deployment

SSH into server and run:

```bash
ssh username@your-server-ip
cd ~/quillyourdream
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

## Quick Commands

### View Status
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f app
```

### Restart App
```bash
docker-compose restart app
```

### Stop App
```bash
docker-compose down
```

### Backup Data
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz data/ attached_assets/
```

## Database

**Default**: NeDB (file-based)
- Location: `./data/nedb/*.db`
- No external database needed
- Auto-loads sample data on first run

**Switch to MongoDB** (optional):
```bash
# 1. Edit .env
USE_NEDB=false

# 2. Start with MongoDB
docker-compose --profile mongodb up -d
```

## Troubleshooting

### View Logs
```bash
docker-compose logs -f app
```

### Rebuild Everything
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Reset Database
```bash
rm -rf data/nedb/*.db
docker-compose restart app
```

## Environment

Edit `.env` file on server for:
- `SESSION_SECRET` - Session encryption key
- `APP_DOMAIN` - Your domain name
- `ADMIN_EMAILS` - Admin email addresses

## GitHub Secrets Required

Configure in GitHub Settings → Secrets and variables → Actions:
- `SERVER_HOST`: Your server IP address
- `SERVER_USERNAME`: Your SSH username
- `SERVER_PASSWORD`: Your SSH password

---

**Application URL**: `http://YOUR_SERVER_IP:3000`
