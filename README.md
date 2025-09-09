# 🛡️ Lethe - Secure Drive Wiping Utility

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Rust](https://img.shields.io/badge/rust-1.70+-orange.svg)](https://www.rust-lang.org/)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg)](https://github.com/Kostassoid/lethe)

A secure, free, cross-platform, and open-source drive wiping utility with a modern web interface. Lethe provides government-grade data sanitization for HDDs, SSDs, and flash drives, ensuring complete data destruction that meets military and corporate security standards.

## 🚀 Features

### Core Functionality
- **Cross-Platform Support**: Works on macOS, Linux, and Windows
- **Government-Grade Algorithms**: Implements DoD 5220.22-M, GOST R 50739-95, and other standards
- **Multiple Wiping Schemes**: From fast single-pass to ultra-secure 7-pass methods
- **Real-Time Verification**: Reads back data to ensure successful overwriting
- **Bad Block Handling**: Automatically skips and tracks unreadable sectors
- **Progress Tracking**: Real-time progress monitoring with throughput estimates

### Web Interface
- **Modern React UI**: Clean, responsive web interface
- **Real-Time Updates**: WebSocket-based live progress monitoring
- **Device Management**: Automatic detection and listing of storage devices
- **Configuration Wizard**: Easy-to-use wipe parameter configuration
- **Safety Features**: Multiple confirmation steps and warnings
- **Certificate Generation**: PDF and JSON certificates of completion
- **Terminal Output**: Raw command output for debugging and verification

### Security Features
- **Cryptographic Random**: Uses ChaCha8 PRNG for high-quality random data
- **Direct I/O**: Bypasses OS cache for immediate disk writes
- **Deterministic Verification**: Reproducible verification process
- **Audit Trail**: Comprehensive logging with SHA-256 integrity verification
- **Session Management**: Unique session tracking for each operation

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Wiping Schemes](#wiping-schemes)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🛠️ Installation

### Prerequisites

- **Rust** (latest stable version) - [Install Rust](https://rustup.rs/)
- **Node.js** 18+ and npm - [Install Node.js](https://nodejs.org/)
- **Root/Administrator access** (for device access)

### Automated Installation

```bash
# Clone the repository
git clone <repository-url>
cd sih2025

# Run the automated setup script
./start-server.sh
```

### Manual Installation

#### 1. Build Rust Backend

```bash
cd lethe
cargo build --release
```

The binary will be created at: `lethe/target/release/lethe`

#### 2. Set Up Web Frontend

```bash
cd frontend
npm install
npm run build
```

#### 3. Start the Server

```bash
# Set environment variables
export LETHE_BIN="/path/to/lethe/target/release/lethe"
export PORT=3001

# Start the backend server
npm run backend
```

## 🚀 Quick Start

### Option 1: Production Deployment

```bash
./start-server.sh
```

### Option 2: Development Mode

```bash
./start-dev.sh
```

### Option 3: Manual Start

```bash
cd frontend
export LETHE_BIN="/path/to/lethe/target/release/lethe"
npm run backend
```

## 🌐 Usage

### Web Interface

1. **Access the Application**: Open http://localhost:3001 in your browser
2. **Select Device**: Choose the storage device you want to wipe
3. **Configure Wipe**: Select wiping scheme, verification options, and parameters
4. **Confirm Operation**: Review warnings and confirm the destructive operation
5. **Monitor Progress**: Watch real-time progress and view terminal output
6. **Download Certificate**: Get completion certificate and logs

### Command Line Interface

```bash
# List available devices
./lethe/target/release/lethe list

# Wipe a device with default settings
sudo ./lethe/target/release/lethe wipe /dev/sdX

# Wipe with custom configuration
sudo ./lethe/target/release/lethe wipe /dev/sdX \
  --scheme=random2x \
  --verify=last \
  --blocksize=1m \
  --retries=8
```

## 🔒 Wiping Schemes

| Scheme | Description | Passes | Security Level | Use Case |
|--------|-------------|--------|----------------|----------|
| `zero` | Single zeroes fill | 1 | Low | Fast, non-sensitive data |
| `random` | Single random fill | 1 | Medium | General purpose |
| `random2x` | Double random fill | 2 | High | **Recommended** for most cases |
| `dod` | DoD 5220.22-M | 3 | High | US government standard |
| `gost` | GOST R 50739-95 | 2 | High | Russian government standard |
| `vsitr` | VSITR/RCMP TSSIT OPS-II | 7 | Very High | Maximum security |
| `badblocks` | Badblocks pattern | 4 | Medium | Hardware testing |

### Verification Options

- **No Verification**: Fastest, no read-back verification
- **Last Stage Only**: Verifies only the final pass (recommended)
- **All Stages**: Verifies after each pass (most thorough)

## 📡 API Documentation

### REST Endpoints

#### System Check
```http
GET /api/system/check
```
Returns system status and lethe binary availability.

#### Device List
```http
GET /api/devices
```
Returns list of available storage devices.

#### Start Wipe Operation
```http
POST /api/wipe
Content-Type: application/json

{
  "device": "/dev/sdX",
  "config": {
    "scheme": "random2x",
    "verify": "last",
    "blocksize": "1m",
    "offset": "0",
    "retries": "8"
  }
}
```

#### Stop Wipe Operation
```http
POST /api/wipe/stop
Content-Type: application/json

{
  "device": "/dev/sdX"
}
```

#### Download Session Assets
```http
GET /api/sessions/{id}/log
GET /api/sessions/{id}/certificate.json
GET /api/sessions/{id}/certificate.pdf
```

### WebSocket Events

Connect to `ws://localhost:3001/ws` for real-time updates:

```javascript
// Wipe status updates
{
  "type": "wipe_status",
  "payload": {
    "state": "running",
    "sessionId": "uuid",
    "currentStage": {"current": 1, "total": 2},
    "progress": {"current": 1024, "total": 2048},
    "timing": {"started": "2024-01-01T00:00:00Z"}
  }
}

// Raw output from lethe
{
  "type": "wipe_output",
  "payload": "Stage 1/2: Writing random data..."
}
```

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Interface (React)                    │
│                   http://localhost:3001                     │
│  • Device selection and configuration                       │
│  • Real-time progress monitoring                            │
│  • Certificate download                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│              Node.js Backend Server                         │
│  • REST API endpoints                                       │
│  • WebSocket real-time communication                        │
│  • Process management and monitoring                        │
│  • Certificate generation                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ Spawns processes
┌─────────────────────▼───────────────────────────────────────┐
│              Rust Lethe Binary                              │
│  • Low-level disk access                                    │
│  • Secure wiping algorithms                                 │
│  • Cross-platform storage handling                          │
│  • Bad block detection and handling                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ Direct I/O
┌─────────────────────▼───────────────────────────────────────┐
│              Physical Storage Devices                       │
│  • Hard drives, SSDs, USB drives                           │
│  • Raw device access                                        │
│  • Sector-level operations                                  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Rust (core engine) + Node.js (web server)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Real-time**: WebSocket for live updates
- **Storage**: Direct I/O with platform-specific optimizations
- **Security**: ChaCha8 PRNG, cryptographic verification

## 🔐 Security Considerations

### Data Destruction

- **Permanent**: Data cannot be recovered after wiping
- **Verifiable**: Read-back verification ensures successful overwriting
- **Standards Compliant**: Meets government and military standards
- **Bad Block Handling**: Tracks and reports unreadable sectors

### System Security

- **Local Access Only**: Runs on localhost by default
- **Permission Requirements**: Needs root/administrator access
- **No Authentication**: Web interface has no built-in auth (development)
- **Audit Trail**: Complete logging of all operations

### Production Deployment

For production use, consider:
- Reverse proxy with authentication
- VPN access only
- Firewall restrictions
- Regular security updates

## 🚨 Important Warnings

### ⚠️ Data Safety
- **This tool permanently destroys data**
- **Data recovery is impossible after wiping**
- **Always backup important data before proceeding**
- **Test on non-critical devices first**

### ⚠️ Device Selection
- **Double-check device selection**
- **Never wipe your system drive**
- **Verify device identifiers carefully**
- **Use device labels and sizes for confirmation**

### ⚠️ System Requirements
- **Root/administrator access required**
- **Direct device access needed**
- **May require unmounting volumes**
- **Some devices may be protected by firmware**

## 🔧 Troubleshooting

### Common Issues

#### Lethe Binary Not Found
```bash
# Check if binary exists
ls -la lethe/target/release/lethe

# Rebuild if missing
cd lethe && cargo build --release
```

#### Permission Denied
```bash
# Run with sudo for device access
sudo ./start-server.sh

# Or check current user
whoami
```

#### Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

#### No Devices Detected
```bash
# Run with sudo
sudo ./start-server.sh

# Test lethe directly
sudo ./lethe/target/release/lethe list
```

#### Frontend Build Fails
```bash
# Clear and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Debug Mode

```bash
# Run with debug logging
DEBUG=* node frontend/server/index.js

# Test lethe binary directly
./lethe/target/release/lethe --help
```

### Platform-Specific Issues

#### macOS
- May need to disable System Integrity Protection (SIP)
- Some devices may be protected by firmware
- Use `/dev/rdisk*` for raw device access

#### Linux
- Ensure user is in `disk` group
- Check udev rules for device access
- Some distributions may require additional permissions

#### Windows
- Run as Administrator
- Some devices may be protected by BitLocker
- Use `\\.\PhysicalDrive*` for raw access

## 📊 Performance

### Benchmarks

| Device Type | Size | Scheme | Time | Throughput |
|-------------|------|--------|------|------------|
| USB 3.0 Flash | 64GB | Zero Fill | ~4 min | ~250 MB/s |
| USB 3.0 Flash | 64GB | Random Fill | ~8 min | ~125 MB/s |
| SATA SSD | 500GB | Random2x | ~45 min | ~180 MB/s |
| SATA HDD | 1TB | DoD 5220.22-M | ~3 hours | ~90 MB/s |

*Benchmarks are approximate and vary by hardware*

### Optimization Tips

- Use larger block sizes for better performance
- Disable verification for faster wiping
- Use SSD-optimized schemes for solid-state drives
- Consider parallel operations for multiple devices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd sih2025

# Start development environment
./start-dev.sh
```

### Code Structure

- `lethe/` - Rust backend (core engine)
- `frontend/` - Node.js web server and React UI
- `docs/` - Documentation and guides
- `scripts/` - Deployment and utility scripts

### Testing

```bash
# Test Rust backend
cd lethe
cargo test

# Test frontend
cd frontend
npm test
```

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Original Lethe Project**: [Kostassoid/lethe](https://github.com/Kostassoid/lethe)
- **Rust Community**: For the excellent ecosystem
- **React Team**: For the modern web framework
- **Security Researchers**: For data sanitization standards

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

## ⚖️ Disclaimer

This software is designed for secure data destruction. Use at your own risk. The authors are not responsible for any data loss or system damage. Always verify you have selected the correct device and have proper backups before proceeding.

---

**🛡️ Secure. Reliable. Open Source.**
