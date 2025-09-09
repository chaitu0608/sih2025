import React, { useState, useEffect } from 'react'
import { AlertTriangle, HardDrive, Shield, Terminal, Zap } from 'lucide-react'
import DeviceList from './components/DeviceList'
import WipeConfiguration from './components/WipeConfiguration'
import WipeProgress from './components/WipeProgress'
import WarningModal from './components/WarningModal'
import { useLetheAPI } from './hooks/useLetheAPI'

function App() {
  const [currentStep, setCurrentStep] = useState('devices') // devices, configure, wipe
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [wipeConfig, setWipeConfig] = useState(null)
  const [showWarning, setShowWarning] = useState(false)
  
  const { 
    devices, 
    loading, 
    error, 
    refreshDevices, 
    startWipe, 
    wipeStatus,
    wipeOutput 
  } = useLetheAPI()

  useEffect(() => {
    refreshDevices()
  }, [])

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device)
    setCurrentStep('configure')
  }

  const handleConfigurationComplete = (config) => {
    setWipeConfig(config)
    setShowWarning(true)
  }

  const handleConfirmWipe = () => {
    setShowWarning(false)
    setCurrentStep('wipe')
    startWipe(selectedDevice, wipeConfig)
  }

  const handleBackToDevices = () => {
    setCurrentStep('devices')
    setSelectedDevice(null)
    setWipeConfig(null)
  }

  const handleBackToConfigure = () => {
    setCurrentStep('configure')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-nb-accent border-b-3 border-black shadow-nb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white border-3 border-black shadow-nb">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold drop-shadow-nb-text">Lethe</h1>
                <p className="text-sm">Secure Drive Wiping Utility</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Terminal className="w-4 h-4" />
                <span>Linux System</span>
              </div>
              
              {currentStep !== 'devices' && (
                <button
                  onClick={handleBackToDevices}
                  className="btn-secondary"
                >
                  Back to Devices
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center space-x-2 ${
              currentStep === 'devices' ? 'text-blue-600' : 
              currentStep === 'configure' || currentStep === 'wipe' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 flex items-center justify-center border-3 border-black shadow-nb ${
                currentStep === 'devices' ? 'bg-nb-primary text-white' :
                currentStep === 'configure' || currentStep === 'wipe' ? 'bg-green-500 text-black' : 'bg-white'
              }`}>
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="font-medium">Select Device</span>
            </div>
            
            <div className={`w-16 h-2 border-3 border-black ${
              currentStep === 'configure' || currentStep === 'wipe' ? 'bg-green-500' : 'bg-white'
            }`} />
            
            <div className={`flex items-center space-x-2 ${
              currentStep === 'configure' ? 'text-blue-600' : 
              currentStep === 'wipe' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 flex items-center justify-center border-3 border-black shadow-nb ${
                currentStep === 'configure' ? 'bg-nb-primary text-white' :
                currentStep === 'wipe' ? 'bg-green-500 text-black' : 'bg-white'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="font-medium">Configure</span>
            </div>
            
            <div className={`w-16 h-2 border-3 border-black ${
              currentStep === 'wipe' ? 'bg-green-500' : 'bg-white'
            }`} />
            
            <div className={`flex items-center space-x-2 ${
              currentStep === 'wipe' ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 flex items-center justify-center border-3 border-black shadow-nb ${
                currentStep === 'wipe' ? 'bg-nb-primary text-white' : 'bg-white'
              }`}>
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-medium">Wipe</span>
            </div>
          </div>
        </div>


        {currentStep === 'devices' && (
          <DeviceList
            devices={devices}
            loading={loading}
            error={error}
            onDeviceSelect={handleDeviceSelect}
            onRefresh={refreshDevices}
          />
        )}

        {currentStep === 'configure' && selectedDevice && (
          <WipeConfiguration
            device={selectedDevice}
            onConfigurationComplete={handleConfigurationComplete}
            onBack={handleBackToDevices}
          />
        )}

        {currentStep === 'wipe' && selectedDevice && wipeConfig && (
          <WipeProgress
            device={selectedDevice}
            config={wipeConfig}
            status={wipeStatus}
            output={wipeOutput}
            onBack={handleBackToConfigure}
            onBackToDevices={handleBackToDevices}
          />
        )}
      </main>

      {/* Warning Modal */}
      {showWarning && selectedDevice && wipeConfig && (
        <WarningModal
          device={selectedDevice}
          config={wipeConfig}
          onConfirm={handleConfirmWipe}
          onCancel={() => setShowWarning(false)}
        />
      )}
    </div>
  )
}

export default App