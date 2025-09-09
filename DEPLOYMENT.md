# 🚀 Lethe Complete Deployment Guide

This guide will help you deploy the complete Lethe secure drive wiping utility with both the Rust backend and Node.js frontend server.

## 📋 Prerequisites

- **Rust** (latest stable version)
- **Node.js** 18+ and npm
- **macOS/Linux** (Windows support is experimental)
- **Root/Administrator access** (for device access)

## 🏗️ Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Navigate to project directory
cd /Users/chaitu0608/Desktop/Trial3/sih2025

# Run the automated deployment script
./start-server.sh
```

This script will:
- ✅ Build the Rust lethe binary
- ✅ Install frontend dependencies
- ✅ Build the frontend
- ✅ Start the backend server
- ✅ Open the web interface

### Option 2: Development Mode

```bash
# Run development environment (auto-reload frontend)
./start-dev.sh
```

## 🔧 Manual Deployment Steps

### Step 1: Build Rust Backend

```bash
cd lethe
cargo build --release
```

The binary will be created at: `lethe/target/release/lethe`

### Step 2: Set Up Frontend

```bash
cd frontend
npm install
npm run build
```

### Step 3: Start the Server

```bash
# Set the lethe binary path
export LETHE_BIN="/Users/chaitu0608/Desktop/Trial3/sih2025/lethe/target/release/lethe"

# Start the backend server
npm run backend
```

## 🌐 Access the Application

Once deployed, access the application at:

- **Web Interface**: http://localhost:3001
- **API Endpoints**: http://localhost:3001/api
- **WebSocket**: ws://localhost:3001/ws

## 🔐 Security Considerations

### Permission Requirements

The application needs elevated permissions to access storage devices:

```bash
# On macOS/Linux, run with sudo for device access
sudo ./start-server.sh

# Or run the backend with sudo
sudo node frontend/server/index.js
```

### Network Security

- The server runs on localhost by default
- No authentication is implemented (development only)
- For production, consider:
  - Reverse proxy with authentication
  - VPN access
  - Firewall restrictions

## 🛠️ Configuration

### Environment Variables

```bash
# Lethe binary path
export LETHE_BIN="/path/to/lethe/binary"

# Server port
export PORT=3001

# Node environment
export NODE_ENV=production
```

### Custom Configuration

Edit `frontend/server/index.js` to modify:
- Port numbers
- CORS settings
- WebSocket configuration
- Logging levels

## 📊 Monitoring and Logs

### Log Files

- **Session Logs**: `frontend/server/data/logs/`
- **Certificates**: `frontend/server/data/certificates/`
- **Server Logs**: Console output

### Health Check

```bash
# Check if server is running
curl http://localhost:3001/api/system/check

# Expected response:
{
  "success": true,
  "lethe": {
    "available": true,
    "version": "Lethe 0.8.3-dev"
  },
  "permissions": {
    "isRoot": false
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Lethe Binary Not Found
```bash
# Check if binary exists
ls -la lethe/target/release/lethe

# Rebuild if missing
cd lethe && cargo build --release
```

#### 2. Permission Denied
```bash
# Run with sudo
sudo ./start-server.sh

# Or check current user
whoami
```

#### 3. Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

#### 4. Frontend Build Fails
```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 5. WebSocket Connection Issues
```bash
# Check firewall
sudo ufw status

# Allow ports
sudo ufw allow 3001
```

### Debug Mode

```bash
# Run with debug logging
DEBUG=* node frontend/server/index.js

# Or check lethe binary directly
./lethe/target/release/lethe list
```

## 🔄 Production Deployment

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start frontend/server/index.js --name lethe-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker (Optional)

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

COPY lethe/target/release/lethe /usr/local/bin/lethe
RUN chmod +x /usr/local/bin/lethe

EXPOSE 3001
CMD ["node", "server/index.js"]
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 📱 Usage

1. **Open Web Interface**: Navigate to http://localhost:3001
2. **Select Device**: Choose the storage device to wipe
3. **Configure Wipe**: Select wiping scheme and options
4. **Confirm Operation**: Review warnings and confirm
5. **Monitor Progress**: Watch real-time progress and logs
6. **Download Certificate**: Get wipe completion certificate

## ⚠️ Important Warnings

- **Data Destruction**: This tool permanently destroys data
- **No Recovery**: Data cannot be recovered after wiping
- **Device Selection**: Double-check device selection
- **Backup First**: Always backup important data
- **Test First**: Test on non-critical devices first

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify all prerequisites are installed
4. Ensure proper permissions are set
5. Test the lethe binary independently

## 📄 License

This project follows the Apache 2.0 license. See the original Lethe project for details.

---

**Remember**: This tool is designed for secure data destruction. Use responsibly and always verify you have selected the correct device before proceeding.
