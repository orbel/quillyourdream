# Docker Deployment Guide - Quill Your Dream

This guide walks you through deploying the Quill Your Dream portfolio website using Docker with automatic MongoDB data seeding.

## Prerequisites

- Docker and Docker Compose installed on your server
- SSH access to your production server
- Project files uploaded to server

## Quick Start

### 1. Create Environment File

The `.env` file **must** be in the same directory as `docker-compose.yml` for Docker Compose to read it automatically.

```bash
# Navigate to project root (where docker-compose.yml is)
cd /path/to/quillyourdream

# Create .env from example
cp .env.example .env

# IMPORTANT: Replace all placeholder passwords with secure values
nano .env
```

### 2. Verify Environment Configuration

Before starting, verify Docker Compose will use your .env values:

```bash
# This shows the final configuration with all variables substituted
docker-compose config | grep -A 5 "environment:"

# Look for your MONGO_USER, MONGO_PASSWORD, and SESSION_SECRET values
```

### 3. Start All Services

```bash
# Start MongoDB and the application
docker-compose up -d

# Watch MongoDB initialization (shows data import progress)
docker logs -f quillyourdream-db

# You should see:
#   ✅ Database initialized successfully
#   ✅ Imported X artworks
#   ✅ Imported artist info
#   ✅ Imported X FAQs
#   ✅ Created admin user
```

### 4. Verify Data Import

```bash
# Replace YOUR_MONGO_PASSWORD with the value from your .env file

# Check artwork count
docker exec quillyourdream-db mongosh quillyourdream \
  -u quilladmin -p 'YOUR_MONGO_PASSWORD' \
  --authenticationDatabase admin \
  --eval "db.artworks.countDocuments()"

# Check admin user exists
docker exec quillyourdream-db mongosh quillyourdream \
  -u quilladmin -p 'YOUR_MONGO_PASSWORD' \
  --authenticationDatabase admin \
  --eval "db.users.findOne({email: 'admin@quillyourdream.com'})"

# View all collections
docker exec quillyourdream-db mongosh quillyourdream \
  -u quilladmin -p 'YOUR_MONGO_PASSWORD' \
  --authenticationDatabase admin \
  --eval "db.getCollectionNames()"
```

### 5. Access the Application

- **Application**: http://YOUR_SERVER_IP:3000
- **Admin Login**: 
  - Email: `admin@quillyourdream.com`
  - Password: Set in `docker/mongo-init.js` (default: change on first login)

## Environment Variables Reference

Your `.env.example` contains these variables - **replace with your own secure values**:

```env
# MongoDB Configuration
MONGO_USER=quilladmin
MONGO_PASSWORD=YOUR_SECURE_PASSWORD_HERE  # Generate with: openssl rand -base64 24
MONGO_DB=quillyourdream
MONGO_PORT=27017

# Application Configuration
APP_PORT=3000
APP_DOMAIN=YOUR_DOMAIN_OR_IP  # e.g., quillyourdream.com or 165.232.58.95

# Session Secret (REQUIRED - generate with: openssl rand -base64 32)
SESSION_SECRET=YOUR_SESSION_SECRET_HERE

# Admin Email Addresses (comma-separated)
ADMIN_EMAILS=admin@quillyourdream.com
```

**Important**: Generate secure passwords before deployment:
```bash
# Generate MongoDB password (URL-safe, no special characters)
openssl rand -base64 24 | tr -d '/+@$%^&*()=' | cut -c1-24

# Generate session secret (can use special characters)
openssl rand -base64 32
```

**Note**: MongoDB passwords should NOT contain special characters like `@`, `$`, `%`, etc. as they break the connection string URL format. Use only letters, numbers, hyphens, and underscores.

## How Docker Compose Reads .env

Docker Compose **automatically** reads `.env` files using this priority order:

1. ✅ Variables defined in your shell environment (highest priority)
2. ✅ Variables defined in `.env` (in same directory as docker-compose.yml)
3. ✅ Fallback defaults in docker-compose.yml (e.g., `${MONGO_USER:-quilladmin}`)

**Important**: 
- The `.env` file must be in the **same directory** as `docker-compose.yml`
- Run `docker-compose` commands from that directory
- No quotes needed around values in `.env`

## Data Auto-Import Details

The MongoDB container automatically imports data on **first startup only** via `docker/mongo-init.js`:

### What Gets Imported:
1. **Artworks** - All artworks from `server/data/artworks.json`
2. **Artist Info** - Artist bio and details from `server/data/artist.json`
3. **FAQs** - Frequently asked questions from `server/data/faqs.json`
4. **Admin User** - Created with bcrypt-hashed password
5. **Database Indexes** - Performance indexes for slug, status, category

### Data Source Files:
- `server/data/artworks.json` - Portfolio artwork data
- `server/data/artist.json` - Artist information
- `server/data/faqs.json` - FAQ content

These files are mounted read-only into the MongoDB container at startup.

## Useful Commands

### View Logs
```bash
# Application logs
docker logs -f quillyourdream-app

# MongoDB logs
docker logs -f quillyourdream-db

# All services
docker-compose logs -f
```

### Restart Services
```bash
# Restart everything
docker-compose restart

# Restart just the app (after code changes)
docker-compose restart app
```

### Stop Services
```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v
```

### Rebuild After Code Changes
```bash
# Rebuild and restart
docker-compose up -d --build

# Force rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Re-import Data (Fresh Start)
```bash
# Stop services
docker-compose down

# Remove MongoDB volume (deletes data!)
docker volume rm quillyourdream_mongodb_data

# Start fresh (triggers auto-import again)
docker-compose up -d

# Watch the import
docker logs -f quillyourdream-db
```

## Nginx Production Setup (Optional)

For production with SSL/TLS, enable the nginx profile:

```bash
# Create SSL certificates directory
mkdir -p nginx/ssl

# Copy your SSL certificates
cp your-cert.crt nginx/ssl/
cp your-key.key nginx/ssl/

# Start with nginx
docker-compose --profile production up -d
```

Access via:
- **HTTP**: http://165.232.58.95 (port 80)
- **HTTPS**: https://165.232.58.95 (port 443)

## Troubleshooting

### .env Not Being Read

**Symptom**: Services use fallback defaults instead of .env values

**Solutions**:
1. Ensure `.env` is in the same directory as `docker-compose.yml`
2. Run docker-compose from that directory: `cd /path/to/project && docker-compose up -d`
3. Verify with: `docker-compose config | grep MONGO_PASSWORD`
4. Don't quote values in .env (use `MONGO_USER=value`, not `MONGO_USER="value"`)

### Data Not Importing

**Symptom**: Empty database after startup

**Solutions**:
1. Check logs: `docker logs quillyourdream-db | grep -i error`
2. Verify JSON files exist: `ls -la server/data/`
3. Check script is mounted: `docker exec quillyourdream-db ls /docker-entrypoint-initdb.d/`
4. Re-import: Stop, remove volume, and restart (see Re-import Data above)

### Can't Connect to MongoDB

**Symptom**: Application can't reach database

**Solutions**:
1. Wait for health check: `docker ps` (should show "healthy")
2. Check network: `docker network ls` (should see quill-network)
3. Verify connection string in app logs: `docker logs quillyourdream-app | grep -i mongo`

### Permission Issues

**Symptom**: Can't write to attached_assets or logs directories

**Solutions**:
```bash
# Fix ownership
sudo chown -R 1000:1000 attached_assets logs

# Fix permissions
chmod -R 755 attached_assets logs
```

## Security Notes

1. **Change default passwords** - Update `MONGO_PASSWORD` and `SESSION_SECRET` in `.env`
2. **Admin credentials** - Change admin password after first login
3. **Firewall** - Only expose necessary ports (3000 for app, 80/443 for nginx)
4. **MongoDB** - Not exposed publicly (only accessible within Docker network)
5. **.env security** - Never commit `.env` to version control

## Migration Notes

This project has been migrated from PostgreSQL/Drizzle ORM to MongoDB/Mongoose:

- ✅ MongoDB 8 with automatic data seeding
- ✅ Mongoose models in `server/models/`
- ✅ All data in MongoDB collections
- ℹ️ Note: `package.json` contains an unused `db:push` script from the previous PostgreSQL setup. This is harmless and can be ignored.

## Domain Setup

To use custom domain:

1. Update `.env`:
   ```env
   APP_DOMAIN=yourdomain.com
   ```

2. Configure DNS A record:
   ```
   @ → YOUR_SERVER_IP
   www → YOUR_SERVER_IP
   ```

3. Restart services:
   ```bash
   docker-compose restart
   ```

## Monitoring

Check service health:
```bash
# All containers status
docker-compose ps

# Resource usage
docker stats

# Health checks
docker inspect quillyourdream-app | grep -A 10 Health
docker inspect quillyourdream-db | grep -A 10 Health
```

---

**Ready to deploy!** 🚀

Start with step 1: Create your `.env` file from `.env.example`, then run `docker-compose up -d`.
