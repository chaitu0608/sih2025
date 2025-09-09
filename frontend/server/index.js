import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../dist')))

// Store active wipe processes
const activeWipes = new Map()

// WebSocket server
const server = app.listen(PORT, () => {
  console.log(`Lethe backend server running on port ${PORT}`)
})

const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  console.log('WebSocket client connected')
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected')
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

// Broadcast to all connected WebSocket clients
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data))
    }
  })
}

// API Routes

// Get list of storage devices
app.get('/api/devices', async (req, res) => {
  try {
    console.log('Fetching storage devices...')
    
    // Execute lethe list command
    const lethe = spawn('lethe', ['list'], {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stdout = ''
    let stderr = ''
    
    lethe.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    lethe.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    lethe.on('close', (code) => {
      if (code !== 0) {
        console.error('Lethe list command failed:', stderr)
        return res.status(500).json({
          success: false,
          error: `Failed to list devices: ${stderr}`
        })
      }
      
      try {
        // Parse the output to extract device information
        const devices = parseDeviceList(stdout)
        res.json({
          success: true,
          devices
        })
      } catch (parseError) {
        console.error('Error parsing device list:', parseError)
        res.status(500).json({
          success: false,
          error: 'Failed to parse device list'
        })
      }
    })
    
    lethe.on('error', (error) => {
      console.error('Error spawning lethe process:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to execute lethe command. Make sure lethe is installed and accessible.'
      })
    })
    
  } catch (error) {
    console.error('Error in /api/devices:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Start wipe operation
app.post('/api/wipe', async (req, res) => {
  try {
    const { device, config } = req.body
    
    if (!device || !config) {
      return res.status(400).json({
        success: false,
        error: 'Device and config are required'
      })
    }
    
    console.log(`Starting wipe operation for device: ${device}`)
    console.log('Config:', config)
    
    // Build lethe wipe command arguments
    const args = [
      'wipe',
      device,
      '--scheme', config.scheme,
      '--verify', config.verify,
      '--blocksize', config.blocksize,
      '--offset', config.offset,
      '--retries', config.retries,
      '--yes' // Auto-confirm
    ]
    
    console.log('Executing command:', 'lethe', args.join(' '))
    
    // Spawn the lethe wipe process
    const lethe = spawn('lethe', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    // Store the process
    activeWipes.set(device, lethe)
    
    let currentStage = { current: 1, total: 1, description: 'Initializing' }
    let progress = { current: 0, total: 0 }
    const startTime = Date.now()
    
    // Broadcast initial status
    broadcast({
      type: 'wipe_status',
      payload: {
        state: 'running',
        currentStage,
        progress,
        timing: {
          started: new Date(startTime).toISOString()
        }
      }
    })
    
    lethe.stdout.on('data', (data) => {
      const output = data.toString()
      console.log('Lethe stdout:', output)
      
      // Broadcast raw output
      broadcast({
        type: 'wipe_output',
        payload: output
      })
      
      // Parse output for progress information
      const statusUpdate = parseWipeOutput(output, currentStage, progress, startTime)
      if (statusUpdate) {
        currentStage = statusUpdate.currentStage || currentStage
        progress = statusUpdate.progress || progress
        
        broadcast({
          type: 'wipe_status',
          payload: {
            state: 'running',
            currentStage,
            progress,
            timing: statusUpdate.timing
          }
        })
      }
    })
    
    lethe.stderr.on('data', (data) => {
      const output = data.toString()
      console.error('Lethe stderr:', output)
      
      broadcast({
        type: 'wipe_output',
        payload: output
      })
    })
    
    lethe.on('close', (code) => {
      activeWipes.delete(device)
      
      if (code === 0) {
        console.log('Wipe completed successfully')
        broadcast({
          type: 'wipe_status',
          payload: {
            state: 'completed',
            timing: {
              started: new Date(startTime).toISOString(),
              completed: new Date().toISOString(),
              elapsed: formatDuration(Date.now() - startTime)
            }
          }
        })
      } else {
        console.error('Wipe failed with code:', code)
        broadcast({
          type: 'wipe_status',
          payload: {
            state: 'failed',
            error: `Process exited with code ${code}`
          }
        })
      }
    })
    
    lethe.on('error', (error) => {
      console.error('Lethe process error:', error)
      activeWipes.delete(device)
      
      broadcast({
        type: 'wipe_status',
        payload: {
          state: 'failed',
          error: error.message
        }
      })
    })
    
    res.json({
      success: true,
      message: 'Wipe operation started'
    })
    
  } catch (error) {
    console.error('Error in /api/wipe:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Stop wipe operation
app.post('/api/wipe/stop', (req, res) => {
  try {
    const { device } = req.body
    
    const process = activeWipes.get(device)
    if (process) {
      process.kill('SIGTERM')
      activeWipes.delete(device)
      
      broadcast({
        type: 'wipe_status',
        payload: {
          state: 'stopped'
        }
      })
      
      res.json({
        success: true,
        message: 'Wipe operation stopped'
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'No active wipe operation found for this device'
      })
    }
  } catch (error) {
    console.error('Error stopping wipe:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Serve the frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// Utility functions

function parseDeviceList(output) {
  const devices = []
  const lines = output.split('\n').filter(line => line.trim())
  
  // Skip header lines and parse device information
  let inDeviceSection = false
  
  for (const line of lines) {
    if (line.includes('Device ID') || line.includes('---')) {
      inDeviceSection = true
      continue
    }
    
    if (!inDeviceSection || !line.trim()) continue
    
    // Parse device line - this is a simplified parser
    // In a real implementation, you'd want more robust parsing
    const parts = line.trim().split(/\s+/)
    if (parts.length >= 3) {
      const device = {
        id: parts[0],
        details: {
          size: parseSize(parts[2]) || 0,
          block_size: 512, // Default
          storage_type: parts[3] || 'Unknown',
          mount_point: parts[5] || null,
          label: parts[4] || null
        },
        children: []
      }
      
      devices.push(device)
    }
  }
  
  return devices
}

function parseSize(sizeStr) {
  if (!sizeStr) return 0
  
  const match = sizeStr.match(/^([\d.]+)\s*([KMGT]?B?)$/i)
  if (!match) return 0
  
  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  
  const multipliers = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  }
  
  return value * (multipliers[unit] || 1)
}

function parseWipeOutput(output, currentStage, progress, startTime) {
  // This is a simplified parser for lethe output
  // You would need to implement proper parsing based on lethe's actual output format
  
  let updates = {}
  
  // Look for stage information
  if (output.includes('Stage')) {
    const stageMatch = output.match(/Stage (\d+)\/(\d+)/)
    if (stageMatch) {
      updates.currentStage = {
        current: parseInt(stageMatch[1]),
        total: parseInt(stageMatch[2]),
        description: output.includes('Writing') ? 'Writing' : 'Verifying'
      }
    }
  }
  
  // Look for progress information
  const progressMatch = output.match(/(\d+)\/(\d+)/)
  if (progressMatch) {
    updates.progress = {
      current: parseInt(progressMatch[1]),
      total: parseInt(progressMatch[2])
    }
  }
  
  // Add timing information
  updates.timing = {
    started: new Date(startTime).toISOString(),
    elapsed: formatDuration(Date.now() - startTime)
  }
  
  return Object.keys(updates).length > 0 ? updates : null
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...')
  
  // Kill all active wipe processes
  for (const [device, process] of activeWipes) {
    console.log(`Terminating wipe process for ${device}`)
    process.kill('SIGTERM')
  }
  
  server.close(() => {
    console.log('Server shut down')
    process.exit(0)
  })
})