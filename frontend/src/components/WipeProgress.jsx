import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Terminal, RotateCcw, ArrowLeft } from 'lucide-react'

const WipeProgress = ({ device, config, status, output, onBack, onBackToDevices }) => {
  const [showTerminal, setShowTerminal] = useState(false)

  const formatSize = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const getStatusIcon = () => {
    switch (status?.state) {
      case 'running':
        return <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600" />
      default:
        return <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusColor = () => {
    switch (status?.state) {
      case 'running': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getProgressPercentage = () => {
    if (!status?.progress || !device?.details?.size) return 0
    return Math.min(100, (status.progress.current / device.details.size) * 100)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wiping in Progress</h2>
          <p className="text-gray-600">Securely wiping {device.id}</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Terminal className="w-4 h-4" />
            <span>{showTerminal ? 'Hide' : 'Show'} Terminal</span>
          </button>
          
          {status?.state === 'completed' || status?.state === 'failed' ? (
            <button onClick={onBackToDevices} className="btn-primary flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Devices</span>
            </button>
          ) : (
            <button onClick={onBack} className="btn-secondary flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          {getStatusIcon()}
          <div>
            <h3 className={`text-lg font-medium ${getStatusColor()}`}>
              {status?.state === 'running' && 'Wiping Device...'}
              {status?.state === 'completed' && 'Wipe Completed Successfully'}
              {status?.state === 'failed' && 'Wipe Failed'}
              {!status?.state && 'Initializing...'}
            </h3>
            <p className="text-gray-600">
              {status?.currentStage && `Stage ${status.currentStage.current}/${status.currentStage.total}: ${status.currentStage.description}`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {status?.progress && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{getProgressPercentage().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="progress-bar h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatSize(status.progress.current)}</span>
              <span>{formatSize(device.details.size)}</span>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Device:</span>
            <p className="text-gray-900 truncate">{device.id}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Size:</span>
            <p className="text-gray-900">{formatSize(device.details.size)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Scheme:</span>
            <p className="text-gray-900">{config.scheme}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Verification:</span>
            <p className="text-gray-900">{config.verify}</p>
          </div>
        </div>

        {/* Time Information */}
        {status?.timing && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {status.timing.started && (
                <div>
                  <span className="font-medium text-gray-700">Started:</span>
                  <p className="text-gray-900">{new Date(status.timing.started).toLocaleTimeString()}</p>
                </div>
              )}
              {status.timing.elapsed && (
                <div>
                  <span className="font-medium text-gray-700">Elapsed:</span>
                  <p className="text-gray-900">{status.timing.elapsed}</p>
                </div>
              )}
              {status.timing.estimated && (
                <div>
                  <span className="font-medium text-gray-700">Estimated:</span>
                  <p className="text-gray-900">{status.timing.estimated}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Terminal Output */}
      {showTerminal && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <Terminal className="w-5 h-5" />
              <span>Terminal Output</span>
            </h3>
            <button
              onClick={() => setShowTerminal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="terminal-output">
            {output || 'Waiting for output...'}
          </div>
        </div>
      )}

      {/* Completion Actions */}
      {status?.state === 'completed' && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">Wipe Completed Successfully</h3>
              <p className="text-green-800 text-sm mt-1">
                The device has been securely wiped. All data has been permanently destroyed.
              </p>
              {status.summary && (
                <div className="mt-3 text-sm text-green-800">
                  <p>Total blocks processed: {status.summary.totalBlocks}</p>
                  <p>Bad blocks skipped: {status.summary.badBlocks}</p>
                  <p>Total time: {status.summary.totalTime}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {status?.state === 'failed' && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Wipe Failed</h3>
              <p className="text-red-800 text-sm mt-1">
                The wiping process encountered an error and could not complete.
              </p>
              {status.error && (
                <div className="mt-3 text-sm text-red-800 font-mono bg-red-100 p-2 rounded">
                  {status.error}
                </div>
              )}
              <div className="mt-4">
                <button onClick={onBack} className="btn-danger flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WipeProgress