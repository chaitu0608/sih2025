import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import PDFDocument from 'pdfkit'

// Resolve Lethe binary path (env override or fallback to PATH)
const LETHE_BIN = process.env.LETHE_BIN || 'lethe'
const IS_LINUX = process.platform === 'linux'
const IS_MAC = process.platform === 'darwin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../dist')))

// Store active wipe processes and sessions
const activeWipes = new Map()
const sessions = new Map()

// Ensure data directories exist
const DATA_DIR = path.join(__dirname, 'data')
const LOGS_DIR = path.join(DATA_DIR, 'logs')
const CERTS_DIR = path.join(DATA_DIR, 'certificates')
for (const dir of [DATA_DIR, LOGS_DIR, CERTS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

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

// System check: lethe availability and permissions
app.get('/api/system/check', async (req, res) => {
  try {
    const check = spawn(LETHE_BIN, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] })
    let available = false
    let version = null
    let err = ''

    check.stdout.on('data', (d) => {
      available = true
      version = d.toString().trim()
    })
    check.stderr.on('data', (d) => {
      err += d.toString()
    })
    check.on('close', () => {
      // Simple permission heuristic: check if user is root or in linux if can read /dev
      const isRoot = process.getuid && process.getuid() === 0
      const linuxHint = IS_LINUX ? 'For Linux, run server as root or grant udev permissions.' : undefined
      res.json({
        success: true,
        lethe: { available, version, error: available ? null : err || 'lethe not found' },
        permissions: { isRoot, hint: linuxHint }
      })
    })
    check.on('error', (e) => {
      res.json({ success: true, lethe: { available: false, version: null, error: e.message }, permissions: { isRoot: false } })
    })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Get list of storage devices
app.get('/api/devices', async (req, res) => {
  try {
    console.log('Fetching storage devices...')
    // On macOS, prefer fast, permission-light fallback first
    if (IS_MAC) {
      try {
        const macDevices = await getMacDevicesViaDiskutil()
        if (Array.isArray(macDevices) && macDevices.length > 0) {
          return res.json({ success: true, devices: macDevices })
        }
      } catch (e) {
        console.warn('macOS fallback pre-check failed, trying lethe list:', e.message)
      }
    }
    
    // Execute lethe list command
    const lethe = spawn(LETHE_BIN, ['list'], {
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
    
    lethe.on('close', async (code) => {
      if (code !== 0) {
        console.error('Lethe list command failed:', stderr)
        if (IS_LINUX) {
          try {
            const linuxDevices = await getLinuxDevicesViaLsblk()
            return res.json({ success: true, devices: linuxDevices })
          } catch (e) {
            return res.status(500).json({ success: false, error: `Failed to list devices: ${stderr}\nLinux fallback error: ${e.message}` })
          }
        } else if (IS_MAC) {
          try {
            const macDevices = await getMacDevicesViaDiskutil()
            return res.json({ success: true, devices: macDevices })
          } catch (e) {
            return res.status(500).json({ success: false, error: `Failed to list devices: ${stderr}\nmacOS fallback error: ${e.message}` })
          }
        } else {
          return res.status(500).json({ success: false, error: `Failed to list devices: ${stderr}` })
        }
      }
      
      try {
        // Parse the output to extract device information
        let devices = []
        try {
          devices = parseDeviceList(stdout)
        } catch (e) {
          console.warn('Primary device parser failed, attempting fallback:', e.message)
        }

        if (!devices || devices.length === 0) {
          devices = fallbackParseDeviceIds(stdout)
          if ((!devices || devices.length === 0) && IS_LINUX) {
            devices = await getLinuxDevicesViaLsblk()
          } else if ((!devices || devices.length === 0) && IS_MAC) {
            devices = await getMacDevicesViaDiskutil()
          }
        }
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
    
    // Sanitize and build lethe wipe command arguments
    const sanitized = {
      scheme: String(config.scheme || ''),
      verify: String(config.verify ?? ''),
      blocksize: Number.isFinite(Number(config.blocksize)) ? String(Number(config.blocksize)) : '4096',
      offset: Number.isFinite(Number(config.offset)) ? String(Math.max(0, Number(config.offset))) : '0',
      retries: Number.isFinite(Number(config.retries)) ? String(Math.max(0, Number(config.retries))) : '0'
    }

    const args = [
      'wipe',
      String(device),
      '--scheme', sanitized.scheme,
      '--verify', sanitized.verify,
      '--blocksize', sanitized.blocksize,
      '--offset', sanitized.offset,
      '--retries', sanitized.retries,
      '--yes'
    ]
    
    console.log('Executing command:', LETHE_BIN, args.join(' '))
    
    // Create session
    const sessionId = uuidv4()
    const startTime = Date.now()
    const logPath = path.join(LOGS_DIR, `${sessionId}.log`)
    const logStream = fs.createWriteStream(logPath, { flags: 'a' })
    const sha256 = crypto.createHash('sha256')

    sessions.set(sessionId, { device, config, startTime, logPath, sha256: null, jsonPath: null, pdfPath: null })

    // Spawn the lethe wipe process
    const lethe = spawn(LETHE_BIN, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    // Store the process
    activeWipes.set(device, lethe)
    
    let currentStage = { current: 1, total: 1, description: 'Initializing' }
    let progress = { current: 0, total: 0 }
    // initial progress vars
    
    // Broadcast initial status
    broadcast({
      type: 'wipe_status',
      payload: {
        state: 'running',
        sessionId,
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
      logStream.write(output)
      sha256.update(output)
      
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
        const stats = computeStats(progress, startTime)
        broadcast({
          type: 'wipe_status',
          payload: {
            state: 'running',
            sessionId,
            currentStage,
            progress,
            timing: { ...statusUpdate.timing, eta: stats.eta, throughputMBps: stats.throughputMBps }
          }
        })
      }
    })
    
    lethe.stderr.on('data', (data) => {
      const output = data.toString()
      console.error('Lethe stderr:', output)
      logStream.write(output)
      sha256.update(output)
      
      broadcast({
        type: 'wipe_output',
        payload: output
      })
    })
    
    lethe.on('close', (code) => {
      activeWipes.delete(device)
      logStream.end()
      const digest = sha256.digest('hex')
      const session = sessions.get(sessionId)
      if (session) session.sha256 = digest
      
      if (code === 0) {
        console.log('Wipe completed successfully')
        // Generate certificate files
        const summary = {
          device,
          config,
          sessionId,
          started: new Date(startTime).toISOString(),
          completed: new Date().toISOString(),
          elapsed: formatDuration(Date.now() - startTime),
          logSha256: digest
        }
        const jsonPath = path.join(CERTS_DIR, `${sessionId}.json`)
        fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2))
        const pdfPath = path.join(CERTS_DIR, `${sessionId}.pdf`)
        generatePdfCertificate(pdfPath, summary)
        const sess = sessions.get(sessionId)
        if (sess) { sess.jsonPath = jsonPath; sess.pdfPath = pdfPath }
        broadcast({
          type: 'wipe_status',
          payload: {
            state: 'completed',
            sessionId,
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
            sessionId,
            error: `Process exited with code ${code}`
          }
        })
      }
    })
    
    lethe.on('error', (error) => {
      console.error('Lethe process error:', error)
      activeWipes.delete(device)
      try { logStream.end() } catch {}
      
      broadcast({
        type: 'wipe_status',
        payload: {
          state: 'failed',
          sessionId,
          error: error.message
        }
      })
    })
    
    res.json({ success: true, message: 'Wipe operation started', sessionId })
    
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

// Session assets download endpoints
app.get('/api/sessions/:id/log', (req, res) => {
  const { id } = req.params
  const session = sessions.get(id)
  if (!session || !session.logPath || !fs.existsSync(session.logPath)) {
    return res.status(404).json({ success: false, error: 'Log not found' })
  }
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Content-Disposition', `attachment; filename="${id}.log"`)
  fs.createReadStream(session.logPath).pipe(res)
})

app.get('/api/sessions/:id/certificate.json', (req, res) => {
  const { id } = req.params
  const session = sessions.get(id)
  if (!session || !session.jsonPath || !fs.existsSync(session.jsonPath)) {
    return res.status(404).json({ success: false, error: 'Certificate JSON not found' })
  }
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="${id}.json"`)
  fs.createReadStream(session.jsonPath).pipe(res)
})

app.get('/api/sessions/:id/certificate.pdf', (req, res) => {
  const { id } = req.params
  const session = sessions.get(id)
  if (!session || !session.pdfPath || !fs.existsSync(session.pdfPath)) {
    return res.status(404).json({ success: false, error: 'Certificate PDF not found' })
  }
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${id}.pdf"`)
  fs.createReadStream(session.pdfPath).pipe(res)
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

// Fallback: extract device IDs by regex when table parsing fails
function fallbackParseDeviceIds(output) {
  const devices = []
  const idSet = new Set()
  const lines = output.split('\n')
  const idRegexes = [
    /\b\/dev\/\S+/g,   // macOS/Linux style paths
    /PhysicalDrive\d+/g  // Windows style
  ]

  for (const line of lines) {
    for (const re of idRegexes) {
      const matches = line.match(re)
      if (matches) {
        for (const m of matches) {
          if (!idSet.has(m)) {
            idSet.add(m)
            devices.push({ id: m, details: { size: 0, block_size: 512, storage_type: 'Unknown', mount_point: null, label: null }, children: [] })
          }
        }
      }
    }
  }

  return devices
}

// Linux-only: use lsblk JSON to enumerate devices if Lethe is unavailable
function getLinuxDevicesViaLsblk() {
  return new Promise((resolve, reject) => {
    if (!IS_LINUX) return resolve([])

    const proc = spawn('lsblk', ['-J', '-O', '-b'])
    let out = ''
    let err = ''
    proc.stdout.on('data', d => out += d.toString())
    proc.stderr.on('data', d => err += d.toString())
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(err || `lsblk exited with ${code}`))
      try {
        const j = JSON.parse(out)
        const devices = []
        const pushDevice = (node, level = 0) => {
          if (!node) return
          const id = node.path || (node.name ? `/dev/${node.name}` : null)
          if (id) {
            devices.push({
              id,
              details: {
                size: Number(node.size || 0),
                block_size: Number(node['phy-sec'] || node['log-sec'] || 512),
                storage_type: node.rota === 0 ? 'SSD' : 'HDD',
                mount_point: node.mountpoint || null,
                label: node.label || node.partlabel || null
              },
              children: []
            })
          }
          if (Array.isArray(node.children)) node.children.forEach(c => pushDevice(c, level + 1))
        }
        if (j && Array.isArray(j.blockdevices)) j.blockdevices.forEach(n => pushDevice(n))
        resolve(devices)
      } catch (e) {
        reject(e)
      }
    })
    proc.on('error', (e) => reject(e))
  })
}

// macOS-only: use `diskutil` to enumerate devices with sizes in bytes
function getMacDevicesViaDiskutil() {
  return new Promise((resolve, reject) => {
    if (!IS_MAC) return resolve([])

    const proc = spawn('bash', ['-lc', 'diskutil list -plist && diskutil info -all -plist'])
    let out = ''
    let err = ''
    proc.stdout.on('data', d => out += d.toString())
    proc.stderr.on('data', d => err += d.toString())
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(err || `diskutil exited with ${code}`))
      try {
        // `diskutil ... -plist` can output multiple XML plists concatenated; split crudely.
        const parts = out.split('<?xml').filter(Boolean).map(p => '<?xml' + p)
        const devices = []
        // Fallback lightweight parse: when plist parsing is complex, use `diskutil list` text
        // Try a simpler text parse instead for robustness
        const textProc = spawn('bash', ['-lc', 'diskutil list'])
        let text = ''
        let textErr = ''
        textProc.stdout.on('data', d => text += d.toString())
        textProc.stderr.on('data', d => textErr += d.toString())
        textProc.on('close', () => {
          const lines = text.split('\n')
          const seen = new Set()
          for (const line of lines) {
            const match = line.match(/^(\/dev\/disk\d+)(s\d+)?/)
            if (match) {
              const id = match[1]
              if (!seen.has(id)) {
                seen.add(id)
                devices.push({
                  id,
                  details: { size: 0, block_size: 512, storage_type: 'Unknown', mount_point: null, label: null },
                  children: []
                })
              }
            }
          }
          resolve(devices)
        })
      } catch (e) {
        reject(e)
      }
    })
    proc.on('error', (e) => reject(e))
  })
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

function computeStats(progress, startTime) {
  const elapsedMs = Date.now() - startTime
  if (!progress || !progress.current || !progress.total || elapsedMs <= 0) {
    return { throughputMBps: null, eta: null }
  }
  const throughputBytesPerSec = progress.current / (elapsedMs / 1000)
  const throughputMBps = (throughputBytesPerSec / (1024 * 1024)).toFixed(2)
  const remaining = Math.max(progress.total - progress.current, 0)
  const etaSec = throughputBytesPerSec > 0 ? Math.ceil(remaining / throughputBytesPerSec) : null
  const eta = etaSec != null ? formatDuration(etaSec * 1000) : null
  return { throughputMBps, eta }
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

function generatePdfCertificate(pdfPath, summary) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const stream = fs.createWriteStream(pdfPath)
  doc.pipe(stream)

  doc.fontSize(20).text('Lethe – Certificate of Sanitization', { align: 'center' })
  doc.moveDown(1)

  doc.fontSize(12).text(`Session ID: ${summary.sessionId}`)
  doc.text(`Device: ${summary.device}`)
  doc.text(`Scheme: ${summary.config.scheme}`)
  doc.text(`Verify: ${summary.config.verify}`)
  doc.text(`Block Size: ${summary.config.blocksize}`)
  doc.text(`Offset: ${summary.config.offset}`)
  doc.text(`Retries: ${summary.config.retries}`)
  doc.moveDown(0.5)
  doc.text(`Started: ${summary.started}`)
  doc.text(`Completed: ${summary.completed}`)
  doc.text(`Elapsed: ${summary.elapsed}`)
  doc.moveDown(0.5)
  doc.text(`Log SHA-256: ${summary.logSha256}`)

  doc.moveDown(2)
  doc.fontSize(10).fillColor('#666').text('This document certifies that the above device was sanitized using the Lethe utility.', { align: 'center' })

  doc.end()
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