import React, { useState } from 'react'
import { AlertTriangle, HardDrive, Settings, Info } from 'lucide-react'

const WipeConfiguration = ({ device, onConfigurationComplete, onBack }) => {
  const [config, setConfig] = useState({
    scheme: 'random2x',
    verify: 'last',
    blocksize: '1m',
    offset: '0',
    retries: '8'
  })

  const schemes = {
    'zero': {
      name: 'Zero Fill',
      description: 'Single zeroes fill - fastest but least secure',
      passes: 1,
      security: 'Low'
    },
    'random': {
      name: 'Random Fill',
      description: 'Single random fill - good balance of speed and security',
      passes: 1,
      security: 'Medium'
    },
    'random2x': {
      name: 'Double Random',
      description: 'Double random fill - recommended for most use cases',
      passes: 2,
      security: 'High'
    },
    'dod': {
      name: 'DoD 5220.22-M',
      description: 'US Department of Defense standard',
      passes: 3,
      security: 'High'
    },
    'gost': {
      name: 'GOST R 50739-95',
      description: 'Russian government standard',
      passes: 2,
      security: 'High'
    },
    'vsitr': {
      name: 'VSITR',
      description: 'Very secure - 7 passes',
      passes: 7,
      security: 'Very High'
    },
    'badblocks': {
      name: 'Badblocks Pattern',
      description: 'Inspired by badblocks tool',
      passes: 4,
      security: 'Medium'
    }
  }

  const verifyOptions = {
    'no': 'No verification - fastest',
    'last': 'Verify last stage only - recommended',
    'all': 'Verify after each stage - most thorough'
  }

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

  const getSecurityColor = (level) => {
    switch (level) {
      case 'Low': return 'text-yellow-600 bg-yellow-100'
      case 'Medium': return 'text-orange-600 bg-orange-100'
      case 'High': return 'text-red-600 bg-red-100'
      case 'Very High': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfigurationComplete(config)
  }

  const estimateTime = () => {
    const scheme = schemes[config.scheme]
    const deviceSize = device.details.size
    const passes = scheme.passes
    
    // Rough estimation: 50MB/s write speed, verification adds 50% time
    const baseTimeSeconds = (deviceSize / (50 * 1024 * 1024)) * passes
    const verificationMultiplier = config.verify === 'no' ? 1 : config.verify === 'last' ? 1.5 : 2
    const totalSeconds = baseTimeSeconds * verificationMultiplier
    
    if (totalSeconds < 60) return `~${Math.ceil(totalSeconds)} seconds`
    if (totalSeconds < 3600) return `~${Math.ceil(totalSeconds / 60)} minutes`
    return `~${Math.ceil(totalSeconds / 3600)} hours`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wipe Configuration</h2>
          <p className="text-gray-600">Configure the wiping parameters for your device</p>
        </div>
      </div>

      {/* Device Info */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
            <HardDrive className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Selected Device</h3>
            <p className="text-sm text-gray-600">{device.id}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Size:</span>
            <p className="text-gray-900">{formatSize(device.details.size)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Type:</span>
            <p className="text-gray-900">{device.details.storage_type}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Block Size:</span>
            <p className="text-gray-900">{device.details.block_size} bytes</p>
          </div>
          {device.details.label && (
            <div>
              <span className="font-medium text-gray-700">Label:</span>
              <p className="text-gray-900">{device.details.label}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wiping Scheme */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Wiping Scheme</span>
          </h3>
          
          <div className="grid gap-4">
            {Object.entries(schemes).map(([key, scheme]) => (
              <label key={key} className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                config.scheme === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="scheme"
                  value={key}
                  checked={config.scheme === key}
                  onChange={(e) => setConfig({...config, scheme: e.target.value})}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-medium text-gray-900">{scheme.name}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSecurityColor(scheme.security)}`}>
                      {scheme.security}
                    </span>
                    <span className="text-sm text-gray-600">{scheme.passes} pass{scheme.passes > 1 ? 'es' : ''}</span>
                  </div>
                  <p className="text-sm text-gray-600">{scheme.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Options</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification
              </label>
              <select
                value={config.verify}
                onChange={(e) => setConfig({...config, verify: e.target.value})}
                className="select-field"
              >
                {Object.entries(verifyOptions).map(([key, description]) => (
                  <option key={key} value={key}>{description}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block Size
              </label>
              <select
                value={config.blocksize}
                onChange={(e) => setConfig({...config, blocksize: e.target.value})}
                className="select-field"
              >
                <option value="64k">64 KB</option>
                <option value="128k">128 KB</option>
                <option value="256k">256 KB</option>
                <option value="512k">512 KB</option>
                <option value="1m">1 MB (recommended)</option>
                <option value="2m">2 MB</option>
                <option value="4m">4 MB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting Offset (bytes)
              </label>
              <input
                type="text"
                value={config.offset}
                onChange={(e) => setConfig({...config, offset: e.target.value})}
                className="input-field"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Retries
              </label>
              <input
                type="number"
                value={config.retries}
                onChange={(e) => setConfig({...config, retries: e.target.value})}
                className="input-field"
                min="0"
                max="20"
              />
            </div>
          </div>
        </div>

        {/* Estimation */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Estimated Time</h3>
              <p className="text-blue-800 text-sm mt-1">
                Based on your configuration, this operation will take approximately <strong>{estimateTime()}</strong>.
                Actual time may vary depending on your hardware and system load.
              </p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="card bg-red-50 border-red-200 warning-glow">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Final Warning</h3>
              <p className="text-red-800 text-sm mt-1">
                This will permanently destroy all data on <strong>{device.id}</strong>. 
                Make sure you have backed up any important data before proceeding.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onBack} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-danger">
            Proceed to Wipe
          </button>
        </div>
      </form>
    </div>
  )
}

export default WipeConfiguration