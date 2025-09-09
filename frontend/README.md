# Lethe Web Frontend

A modern, Linux-based web frontend for the Lethe secure drive wiping utility.

## Features

- **Device Discovery**: Automatically scans and lists available storage devices
- **Interactive Configuration**: Easy-to-use interface for configuring wipe parameters
- **Real-time Progress**: Live progress tracking with WebSocket updates
- **Safety Features**: Multiple confirmation steps and warnings to prevent accidental data loss
- **Terminal Output**: View raw command output for debugging and verification
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+ 
- Lethe binary installed and accessible in PATH
- Linux system with appropriate permissions for storage device access

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the frontend:
```bash
npm run build
```

3. Start the backend server:
```bash
npm run backend
```

4. For development, run both frontend and backend:
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend dev server
npm run dev
```

## Usage

1. **Access the Interface**: Open your browser to `http://localhost:3000`

2. **Select Device**: Choose the storage device you want to wipe from the list

3. **Configure Wipe**: Select wiping scheme, verification options, and other parameters

4. **Confirm Operation**: Review the warning and confirm the destructive operation

5. **Monitor Progress**: Watch real-time progress and view terminal output

## Security Considerations

- **Root Access**: The backend needs to run with appropriate permissions to access storage devices
- **Network Security**: Consider running on localhost only or behind a reverse proxy with authentication
- **Data Destruction**: This tool permanently destroys data - use with extreme caution

## Wiping Schemes

- **Zero Fill**: Single pass with zeros (fastest, least secure)
- **Random Fill**: Single pass with random data
- **Double Random**: Two passes with random data (recommended)
- **DoD 5220.22-M**: US Department of Defense standard
- **GOST R 50739-95**: Russian government standard
- **VSITR**: Very secure 7-pass method
- **Badblocks Pattern**: 4-pass pattern testing

## API Endpoints

- `GET /api/devices` - List available storage devices
- `POST /api/wipe` - Start wipe operation
- `POST /api/wipe/stop` - Stop active wipe operation
- `WebSocket /ws` - Real-time status updates

## Development

The frontend is built with:
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Express** - Backend server
- **WebSocket** - Real-time communication

## Troubleshooting

### Permission Issues
```bash
# Run with sudo if needed
sudo npm run backend
```

### Lethe Not Found
```bash
# Make sure lethe is in PATH
which lethe

# Or specify full path in server/index.js
```

### WebSocket Connection Issues
- Check firewall settings
- Ensure port 3001 is available
- Verify WebSocket support in browser

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially with non-critical devices)
5. Submit a pull request

## License

This frontend follows the same Apache 2.0 license as the Lethe project.

## Disclaimer

This software permanently destroys data. Use at your own risk. Always verify you have selected the correct device and have proper backups before proceeding.