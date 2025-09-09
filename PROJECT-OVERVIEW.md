# 📋 Lethe Project Overview

## 🎯 Project Summary

**Lethe** is a comprehensive, secure drive wiping utility that combines a powerful Rust backend with a modern web interface. It provides government-grade data sanitization capabilities for HDDs, SSDs, and flash drives, ensuring complete data destruction that meets military and corporate security standards.

## 🏗️ Project Structure

```
sih2025/
├── lethe/                          # Rust Backend (Core Engine)
│   ├── src/
│   │   ├── main.rs                 # CLI entry point
│   │   ├── actions/                # Wipe operations and state management
│   │   ├── sanitization/           # Data sanitization algorithms
│   │   ├── storage/                # Cross-platform storage handling
│   │   └── ui/                     # CLI interface and user interactions
│   ├── Cargo.toml                  # Rust dependencies and configuration
│   └── target/release/lethe        # Compiled binary
├── frontend/                       # Web Interface
│   ├── src/
│   │   ├── App.jsx                 # Main React application
│   │   ├── components/             # React components
│   │   ├── hooks/                  # Custom React hooks
│   │   └── index.css               # Tailwind CSS styles
│   ├── server/
│   │   └── index.js                # Node.js backend server
│   ├── dist/                       # Built frontend assets
│   ├── package.json                # Node.js dependencies
│   └── vite.config.js              # Build configuration
├── start-server.sh                 # Production deployment script
├── start-dev.sh                    # Development environment script
├── README.md                       # Main project documentation
├── CONTRIBUTING.md                 # Contribution guidelines
├── DEPLOYMENT.md                   # Deployment guide
└── LICENSE                         # Apache 2.0 license
```

## 🔧 Technical Architecture

### Backend Components

#### 1. Rust Core Engine (`lethe/`)
- **Language**: Rust (for performance and memory safety)
- **Purpose**: Low-level disk operations and secure wiping
- **Key Features**:
  - Direct I/O operations
  - Cryptographic random number generation
  - Bad block detection and handling
  - Cross-platform storage abstraction
  - Government-grade wiping algorithms

#### 2. Node.js Web Server (`frontend/server/`)
- **Language**: JavaScript/Node.js
- **Purpose**: Web API and process management
- **Key Features**:
  - REST API endpoints
  - WebSocket real-time communication
  - Process spawning and monitoring
  - Certificate generation
  - Session management

### Frontend Components

#### 1. React Web Interface (`frontend/src/`)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Purpose**: User interface and interaction
- **Key Features**:
  - Device selection and configuration
  - Real-time progress monitoring
  - Safety warnings and confirmations
  - Certificate download
  - Responsive design

## 🚀 Key Features

### Security & Compliance
- **Government Standards**: DoD 5220.22-M, GOST R 50739-95, VSITR
- **Cryptographic Security**: ChaCha8 PRNG for random data
- **Verification**: Read-back verification ensures successful overwriting
- **Audit Trail**: Complete logging with SHA-256 integrity verification

### Performance & Reliability
- **Cross-Platform**: macOS, Linux, Windows support
- **Direct I/O**: Bypasses OS cache for immediate disk writes
- **Bad Block Handling**: Automatically skips unreadable sectors
- **Progress Tracking**: Real-time monitoring with throughput estimates

### User Experience
- **Modern Web UI**: Clean, responsive interface
- **Real-Time Updates**: WebSocket-based live progress
- **Safety Features**: Multiple confirmation steps
- **Certificate Generation**: PDF and JSON completion certificates

## 📊 Wiping Schemes

| Scheme | Passes | Security | Use Case |
|--------|--------|----------|----------|
| Zero Fill | 1 | Low | Fast, non-sensitive data |
| Random Fill | 1 | Medium | General purpose |
| Double Random | 2 | High | **Recommended** |
| DoD 5220.22-M | 3 | High | US government standard |
| GOST R 50739-95 | 2 | High | Russian government standard |
| VSITR | 7 | Very High | Maximum security |
| Badblocks | 4 | Medium | Hardware testing |

## 🔄 Data Flow

```
User Interface → Web Server → Rust Engine → Storage Device
     ↓              ↓            ↓            ↓
  React UI    →  Node.js   →  Lethe    →  Physical Disk
  (Browser)      (API)        (Binary)     (Raw I/O)
```

### Process Flow
1. **Device Discovery**: System scans for available storage devices
2. **Configuration**: User selects device and wiping parameters
3. **Verification**: Multiple confirmation steps prevent accidents
4. **Execution**: Rust engine performs low-level disk operations
5. **Monitoring**: Real-time progress updates via WebSocket
6. **Completion**: Certificate generation and audit trail

## 🛡️ Security Considerations

### Data Protection
- **Permanent Destruction**: Data cannot be recovered after wiping
- **Standards Compliance**: Meets government and military requirements
- **Verification**: Ensures successful overwriting
- **Audit Trail**: Complete operation logging

### System Security
- **Local Access**: Runs on localhost by default
- **Permission Requirements**: Needs root/administrator access
- **No Authentication**: Web interface has no built-in auth (development)
- **Process Isolation**: Wipe operations run in separate processes

## 🚨 Important Warnings

### Data Safety
- ⚠️ **Permanent Data Destruction**: Cannot be undone
- ⚠️ **No Recovery**: Data recovery is impossible
- ⚠️ **Backup First**: Always backup important data
- ⚠️ **Test First**: Use non-critical devices for testing

### Device Selection
- ⚠️ **Double-Check**: Verify device selection carefully
- ⚠️ **System Drives**: Never wipe your operating system drive
- ⚠️ **Partitions**: Be aware of partition vs. whole disk
- ⚠️ **Labels**: Use device labels and sizes for confirmation

## 📈 Performance Metrics

### Typical Performance
- **USB 3.0 Flash (64GB)**: ~4-8 minutes (depending on scheme)
- **SATA SSD (500GB)**: ~45 minutes (Random2x)
- **SATA HDD (1TB)**: ~3 hours (DoD 5220.22-M)

### Optimization Factors
- **Block Size**: Larger blocks = better performance
- **Verification**: Disable for faster wiping
- **Device Type**: SSDs generally faster than HDDs
- **System Load**: Background processes affect performance

## 🔧 Development & Deployment

### Development Environment
```bash
# Start development mode
./start-dev.sh

# Access points:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Production Deployment
```bash
# Start production server
./start-server.sh

# Access point:
# Web Interface: http://localhost:3001
```

### Build Process
1. **Rust Backend**: `cargo build --release`
2. **Frontend**: `npm run build`
3. **Server**: `npm run backend`

## 📚 Documentation

- **README.md**: Main project documentation
- **CONTRIBUTING.md**: Contribution guidelines
- **DEPLOYMENT.md**: Detailed deployment guide
- **PROJECT-OVERVIEW.md**: This overview document

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Areas for Contribution
- **Security improvements**
- **Performance optimizations**
- **Cross-platform compatibility**
- **UI/UX enhancements**
- **Documentation improvements**
- **Testing and quality assurance**

## 📄 License

This project is licensed under the Apache License 2.0 - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Original Lethe Project**: [Kostassoid/lethe](https://github.com/Kostassoid/lethe)
- **Rust Community**: For the excellent ecosystem
- **React Team**: For the modern web framework
- **Security Researchers**: For data sanitization standards

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

---

**🛡️ Secure. Reliable. Open Source.**
