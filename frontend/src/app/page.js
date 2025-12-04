'use client'

import { useState, useCallback } from 'react'
import UploadArea from '../components/UploadArea'
import AnalysisResults from '../components/AnalysisResults'
import LoadingSpinner from '../components/LoadingSpinner'
import ProfessionalDashboard from '../components/ProfessionalDashboard'
import AuthenticationWrapper from '../components/LoginRegister'
import { Upload, Settings, FileText, Zap, CheckCircle, BarChart3, Home, FileImage, AlertCircle } from 'lucide-react'
import { Card } from "../components/ui/card"

// Component that wraps the dashboard and analyzer together
function DashboardWithAnalyzer({ user, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState({
    back_width_offset: 36,
    top_depth_offset: 30,
    shelf_depth_offset: 70,
    thickness: 18,
    leg_height_deduction: 100,
    countertop_deduction: 25
  })

  const handleFileUpload = useCallback((file) => {
    setUploadedFile(file)
    setAnalysisResults(null)
    setError(null)
  }, [])

  const handleAnalyze = async () => {
    if (!uploadedFile) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      
      formData.append('back_width_offset', config.back_width_offset.toString())
      formData.append('top_depth_offset', config.top_depth_offset.toString())
      formData.append('shelf_depth_offset', config.shelf_depth_offset.toString())
      formData.append('thickness', config.thickness.toString())
      formData.append('leg_height_deduction', config.leg_height_deduction.toString())
      formData.append('countertop_deduction', config.countertop_deduction.toString())

      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Analysis failed')
      }

      setAnalysisResults(result)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check if the backend server is running on port 8000.')
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setUploadedFile(null)
    setAnalysisResults(null)
    setError(null)
  }

  const switchToAnalyzer = () => {
    setCurrentView('analyzer')
    resetAnalysis()
  }

  // Show Dashboard
  if (currentView === 'dashboard') {
    return (
      <ProfessionalDashboard 
        user={user} 
        onLogout={onLogout}
        onNewAnalysis={switchToAnalyzer} 
      />
    )
  }

  // Show Analyzer
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-blue-100 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Home className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentView === 'dashboard' 
                    ? 'bg-white/20 text-white' 
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('analyzer')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentView === 'analyzer' 
                    ? 'bg-white/20 text-white' 
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Analyzer
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Kitchen Cabinet Drawing Analyzer
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-6">
              Professional AI-Powered Analysis & Cutting List Generation
            </p>
            <div className="flex justify-center space-x-8 text-sm md:text-base">
              <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                <Zap className="h-4 w-4" />
                <span>Google Cloud Vision OCR</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                <CheckCircle className="h-4 w-4" />
                <span>OpenAI GPT-4 Analysis</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                <FileText className="h-4 w-4" />
                <span>Professional Reports</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Workshop Configuration */}
        <Card className="mb-8 p-6">
          <div className="flex items-center mb-4">
            <Settings className="h-6 w-6 text-primary mr-3" />
            <h3 className="text-lg font-semibold">Workshop Configuration</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Back Width Offset (mm)
              </label>
              <input
                type="number"
                value={config.back_width_offset}
                onChange={(e) => setConfig({...config, back_width_offset: parseInt(e.target.value) || 0})}
                className="input-field text-sm"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Top Depth Offset (mm)
              </label>
              <input
                type="number"
                value={config.top_depth_offset}
                onChange={(e) => setConfig({...config, top_depth_offset: parseInt(e.target.value) || 0})}
                className="input-field text-sm"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shelf Depth Offset (mm)
              </label>
              <input
                type="number"
                value={config.shelf_depth_offset}
                onChange={(e) => setConfig({...config, shelf_depth_offset: parseInt(e.target.value) || 0})}
                className="input-field text-sm"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Board Thickness (mm)
              </label>
              <input
                type="number"
                value={config.thickness}
                onChange={(e) => setConfig({...config, thickness: parseInt(e.target.value) || 0})}
                className="input-field text-sm"
                min="6"
                max="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leg Deduction (mm)
              </label>
              <input
                type="number"
                value={config.leg_height_deduction}
                onChange={(e) => setConfig({...config, leg_height_deduction: parseInt(e.target.value) || 0})}
                className="input-field text-sm"
                min="0"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Countertop (mm)
              </label>
              <input
                type="number"
                value={config.countertop_deduction}
                onChange={(e) => setConfig({...config, countertop_deduction: parseInt(e.target.value) || 0})}
                className="input-field text-sm"
                min="0"
                max="50"
              />
            </div>
          </div>
        </Card>

        {/* Upload and Analysis Section */}
        {!uploadedFile && !isAnalyzing && !analysisResults && (
          <div className="space-y-8">
            <Card className="p-8">
              <UploadArea onFileUpload={handleFileUpload} />
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Upload Drawing</h3>
                <p className="text-sm text-gray-600">
                  Upload your kitchen cabinet technical drawing in any standard image format
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Configure Settings</h3>
                <p className="text-sm text-gray-600">
                  Customize workshop specifications for accurate cutting calculations
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Get Results</h3>
                <p className="text-sm text-gray-600">
                  Download professional cutting lists and DXF layouts instantly
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* File Selected - Ready to Analyze */}
        {uploadedFile && !isAnalyzing && !analysisResults && (
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <FileImage className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="font-semibold text-gray-800">{uploadedFile.name}</h3>
                  <p className="text-sm text-gray-600">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={resetAnalysis} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleAnalyze} className="btn-primary flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Analyze Drawing
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isAnalyzing && <LoadingSpinner />}

        {/* Error State */}
        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Analysis Failed</h3>
                <p className="text-red-700">{error}</p>
                <button onClick={resetAnalysis} className="mt-4 btn-secondary">
                  Try Again
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {analysisResults && (
          <div className="space-y-6">
            <AnalysisResults results={analysisResults} />
            <div className="text-center">
              <button onClick={resetAnalysis} className="btn-secondary">
                Analyze Another Drawing
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Main HomePage component - wraps everything with authentication
export default function HomePage() {
  return <AuthenticationWrapper DashboardComponent={DashboardWithAnalyzer} />
}