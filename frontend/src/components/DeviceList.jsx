import React from 'react'
import { HardDrive, RefreshCw, AlertCircle, Usb, Database } from 'lucide-react'

const DeviceList = ({ devices, loading, error, onDeviceSelect, onRefresh }) => {
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'Removable':
        return <Usb className="w-5 h-5" />
      case 'Fixed':
        return <HardDrive className="w-5 h-5" />
      case 'Partition':
        return <Database className="w-5 h-5" />
      default:
        return <HardDrive className="w-5 h-5" />
    }
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

  const getDeviceTypeColor = (type) => {
    switch (type) {
      case 'Removable':
        return 'bg-blue-100 text-blue-800'
      case 'Fixed':
        return 'bg-gray-100 text-gray-800'
      case 'Partition':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg text-gray-600">Scanning for storage devices...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Error scanning devices</h3>
            <p className="text-red-600">{error}</p>
            <button onClick={onRefresh} className="btn-primary mt-4">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Storage Devices</h2>
          <p className="text-gray-600 mt-1">Select a device to securely wipe</p>
        </div>
        <button onClick={onRefresh} className="btn-secondary flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Warning</h3>
            <p className="text-red-700 text-sm mt-1">
              Wiping a storage device will permanently destroy all data. This action cannot be undone.
              Make sure you have backups of any important data before proceeding.
            </p>
          </div>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
            <p className="text-gray-600 mb-4">
              Make sure you're running with appropriate permissions to access storage devices.
            </p>
            <button onClick={onRefresh} className="btn-primary">
              Refresh Devices
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => (
            <div key={device.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                    {getDeviceIcon(device.details.storage_type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{device.id}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDeviceTypeColor(device.details.storage_type)}`}>
                        {device.details.storage_type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Size:</span> {formatSize(device.details.size)}
                      </div>
                      <div>
                        <span className="font-medium">Block Size:</span> {device.details.block_size} bytes
                      </div>
                      {device.details.label && (
                        <div>
                          <span className="font-medium">Label:</span> {device.details.label}
                        </div>
                      )}
                      {device.details.mount_point && (
                        <div>
                          <span className="font-medium">Mount:</span> {device.details.mount_point}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onDeviceSelect(device)}
                  className="btn-danger flex items-center space-x-2"
                >
                  <span>Select for Wiping</span>
                </button>
              </div>
              
              {/* Child devices/partitions */}
              {device.children && device.children.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Partitions:</h4>
                  <div className="space-y-2">
                    {device.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {getDeviceIcon(child.details.storage_type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{child.id}</div>
                            <div className="text-xs text-gray-600">
                              {formatSize(child.details.size)}
                              {child.details.label && ` • ${child.details.label}`}
                              {child.details.mount_point && ` • ${child.details.mount_point}`}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeviceSelect(child)}
                          className="text-xs btn-danger"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DeviceList