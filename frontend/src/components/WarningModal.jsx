import React, { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const WarningModal = ({ device, config, onConfirm, onCancel }) => {
  const [confirmText, setConfirmText] = useState('')
  const [understood, setUnderstood] = useState(false)

  const requiredText = 'WIPE DEVICE'
  const canConfirm = confirmText === requiredText && understood

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">DANGER: Permanent Data Destruction</h2>
                <p className="text-red-700">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Warning Content */}
          <div className="space-y-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <h3 className="font-bold text-red-900 mb-2">⚠️ CRITICAL WARNING ⚠️</h3>
              <ul className="text-red-800 text-sm space-y-1">
                <li>• All data on this device will be permanently destroyed</li>
                <li>• This process cannot be stopped once started</li>
                <li>• Data recovery will be impossible after completion</li>
                <li>• Make sure you have backups of any important data</li>
                <li>• Verify you have selected the correct device</li>
              </ul>
            </div>

            {/* Device Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Device to be wiped:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Device:</span>
                  <span className="font-mono text-red-600">{device.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Size:</span>
                  <span>{formatSize(device.details.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Type:</span>
                  <span>{device.details.storage_type}</span>
                </div>
                {device.details.label && (
                  <div className="flex justify-between">
                    <span className="font-medium">Label:</span>
                    <span>{device.details.label}</span>
                  </div>
                )}
                {device.details.mount_point && (
                  <div className="flex justify-between">
                    <span className="font-medium">Mount Point:</span>
                    <span>{device.details.mount_point}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Wipe configuration:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Scheme:</span>
                  <span>{config.scheme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Verification:</span>
                  <span>{config.verify}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Block Size:</span>
                  <span>{config.blocksize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Retries:</span>
                  <span>{config.retries}</span>
                </div>
              </div>
            </div>

            {/* Confirmation Checkboxes */}
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  I understand that this will permanently destroy all data on the selected device 
                  and that this action cannot be undone.
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "{requiredText}" to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="input-field font-mono"
                  placeholder={requiredText}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={onCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!canConfirm}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  canConfirm
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                WIPE DEVICE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WarningModal