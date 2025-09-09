import { useState, useCallback, useRef, useEffect } from 'react'

export const useLetheAPI = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [wipeStatus, setWipeStatus] = useState(null)
  const [wipeOutput, setWipeOutput] = useState('')
  
  const wsRef = useRef(null)

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws`
      
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'wipe_status':
              setWipeStatus(data.payload)
              break
            case 'wipe_output':
              setWipeOutput(prev => prev + data.payload)
              break
            case 'error':
              setError(data.payload)
              break
            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...')
        setTimeout(connectWebSocket, 3000)
      }
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    }
    
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const refreshDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/devices')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setDevices(data.devices || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching devices:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const startWipe = useCallback(async (device, config) => {
    setWipeStatus({ state: 'starting' })
    setWipeOutput('')
    setError(null)
    
    try {
      const response = await fetch('/api/wipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device: device.id,
          config
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to start wipe operation')
      }
      
      setWipeStatus({ state: 'running' })
    } catch (err) {
      setError(err.message)
      setWipeStatus({ state: 'failed', error: err.message })
      console.error('Error starting wipe:', err)
    }
  }, [])

  return {
    devices,
    loading,
    error,
    refreshDevices,
    startWipe,
    wipeStatus,
    wipeOutput
  }
}