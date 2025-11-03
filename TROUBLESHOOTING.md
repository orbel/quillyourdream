# Troubleshooting Docker Deployment

## Issue: WebSocket Connection Error

If you see errors like:
```
Health check failed: ErrorEvent
wss://mongodb/v2
connect ECONNREFUSED 172.18.0.2:443
```

This indicates a connection problem between containers. Follow these steps:

### Step 1: Check Docker Container Status

```bash
# Check if containers are running
docker-compose ps

# You should see:
# - quillyourdream-db (healthy)
# - quillyourdream-app (running)
```

### Step 2: Check MongoDB Container Logs

```bash
# View MongoDB logs
docker logs quillyourdream-db

# Look for:
# ✅ "Waiting for connections"
# ✅ "Imported X artworks"
# ✅ "Database initialized successfully"
```

### Step 3: Check Application Container Logs

```bash
# View application logs
docker logs quillyourdream-app

# Look for:
# ✅ "Connected to MongoDB"
# ❌ "MongoDB connection error" (this means DATABASE_URL is wrong)
```

### Step 4: Verify Environment Variables

```bash
# Check what environment variables the app container sees
docker exec quillyourdream-app env | grep -E "DATABASE_URL|MONGO"

# Should show:
# DATABASE_URL=mongodb://quilladmin:YOUR_PASSWORD@mongodb:27017/quillyourdream?authSource=admin
```

### Step 5: Test MongoDB Connection from App Container

```bash
# Try to ping MongoDB from the app container
docker exec quillyourdream-app ping -c 2 mongodb

# Try to connect to MongoDB from app container
docker exec quillyourdream-app node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://quilladmin:changeme123@mongodb:27017/quillyourdream?authSource=admin')
  .then(() => { console.log('✅ Connection successful'); process.exit(0); })
  .catch((err) => { console.error('❌ Connection failed:', err.message); process.exit(1); });
"
```

## Common Issues & Solutions

### Issue: Container Can't Reach MongoDB

**Symptoms:**
- `ECONNREFUSED` errors
- `getaddrinfo ENOTFOUND mongodb`

**Solution:**
```bash
# 1. Ensure both containers are on same network
docker network inspect quill-network

# 2. Restart services
docker-compose down
docker-compose up -d

# 3. Check network connectivity
docker exec quillyourdream-app ping mongodb
```

### Issue: Wrong DATABASE_URL

**Symptoms:**
- "MongoDB connection error"
- Invalid connection string errors

**Solution:**

Check your `.env` file has correct format:
```env
MONGO_USER=quilladmin
MONGO_PASSWORD=YOUR_PASSWORD_HERE
MONGO_DB=quillyourdream
```

The app will build this connection string:
```
mongodb://quilladmin:YOUR_PASSWORD@mongodb:27017/quillyourdream?authSource=admin
```

**Verify** the constructed URL:
```bash
docker exec quillyourdream-app env | grep DATABASE_URL
```

### Issue: MongoDB Authentication Failed

**Symptoms:**
- "Authentication failed"
- "Command requires authentication"

**Solution:**

1. Check MongoDB was initialized with correct credentials:
```bash
# Connect to MongoDB with root credentials
docker exec quillyourdream-db mongosh admin \
  -u quilladmin -p 'YOUR_MONGO_PASSWORD' \
  --eval "db.auth('quilladmin', 'YOUR_MONGO_PASSWORD')"
```

2. If authentication fails, you may need to recreate MongoDB:
```bash
# WARNING: This deletes all data
docker-compose down
docker volume rm quillyourdream_mongodb_data
docker-compose up -d
```

### Issue: Port 3000 Not Accessible

**Symptoms:**
- Can't access http://YOUR_SERVER:3000
- Connection refused from browser

**Solutions:**

1. Check app is listening:
```bash
docker logs quillyourdream-app | grep "serving on port"
```

2. Check firewall allows port 3000:
```bash
# On Ubuntu/Debian
sudo ufw status
sudo ufw allow 3000/tcp

# On RHEL/CentOS
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

3. Check port mapping:
```bash
docker ps | grep quillyourdream-app
# Should show: 0.0.0.0:3000->3000/tcp
```

## Complete Fresh Start

If nothing works, start fresh:

```bash
# 1. Stop everything
docker-compose down

# 2. Remove volumes (WARNING: Deletes all data)
docker volume rm quillyourdream_mongodb_data

# 3. Remove containers
docker rm quillyourdream-app quillyourdream-db

# 4. Rebuild images
docker-compose build --no-cache

# 5. Start fresh
docker-compose up -d

# 6. Watch logs
docker-compose logs -f
```

## Verify Successful Deployment

Once running, verify everything works:

```bash
# 1. Check containers are healthy
docker-compose ps
# Both should show "Up" and db should show "(healthy)"

# 2. Check MongoDB has data
docker exec quillyourdream-db mongosh quillyourdream \
  -u quilladmin -p 'YOUR_MONGO_PASSWORD' \
  --authenticationDatabase admin \
  --eval "db.artworks.countDocuments()"
# Should return a number > 0

# 3. Check API responds
curl http://localhost:3000/api/health
# Should return: {"status":"healthy","timestamp":"..."}

# 4. Check artworks endpoint
curl http://localhost:3000/api/artworks
# Should return JSON array of artworks
```

## Get Help

If issues persist, gather these logs:

```bash
# Application logs
docker logs quillyourdream-app > app-logs.txt

# MongoDB logs
docker logs quillyourdream-db > db-logs.txt

# Docker compose config
docker-compose config > compose-config.txt

# Container status
docker-compose ps > container-status.txt

# Environment variables (redact passwords!)
docker exec quillyourdream-app env > app-env.txt
```

Then share these files for debugging.
