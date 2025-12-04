'use client'

import React, { useState, useCallback } from 'react'
import { Upload, Settings, FileText, Zap, CheckCircle, AlertCircle, RefreshCw, FileImage, Download, Eye } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UploadArea from '@/components/UploadArea'
import LoadingSpinner from '@/components/LoadingSpinner'
import AnalyzerResults from '@/components/AnalyzerResults'
import { useAuth } from '@/contexts/AuthContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface ConfigState {
    back_width_offset: number;
    top_depth_offset: number;
    shelf_depth_offset: number;
    thickness: number;
    leg_height_deduction: number;
    countertop_deduction: number;
}

export default function AnalyzerPage() {
    const { user } = useAuth();
    
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResults, setAnalysisResults] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    
    const [config, setConfig] = useState<ConfigState>({
        back_width_offset: 36,
        top_depth_offset: 30,
        shelf_depth_offset: 70,
        thickness: 18,
        leg_height_deduction: 100,
        countertop_deduction: 25
    })

    const handleFileUpload = useCallback((file: File | null) => {
        setUploadedFile(file)
        setAnalysisResults(null)
        setError(null)
    }, [])

    const resetAnalysis = () => {
        setUploadedFile(null)
        setAnalysisResults(null)
        setError(null)
    }

    const handleConfigChange = (key: keyof ConfigState, value: string) => {
        const intValue = parseInt(value) || 0;
        setConfig(prev => ({ ...prev, [key]: intValue }))
    }

    const handleAnalyze = async () => {
        if (!uploadedFile) {
            setError("Please upload a file to begin analysis.");
            return;
        }

        setIsAnalyzing(true)
        setError(null)

        try {
            const formData = new window.FormData()
            formData.append('file', uploadedFile)
            
            Object.entries(config).forEach(([key, value]) => {
                formData.append(key, value.toString())
            })

            const response = await fetch(`${BACKEND_URL}/analysis/analyze`, {
                method: 'POST',
                body: formData,
            })

            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text()
                throw new Error(`Server returned non-JSON response. Status: ${response.status}. The backend may not be running or the endpoint may not exist.`)
            }

            const result = await response.json()

            if (!response.ok || result.error) {
                // Provide more specific error messages based on the error type
                let errorMessage = result.message || result.error || 'Analysis failed due to server error.'
                
                // Check for specific error patterns and provide helpful guidance
                if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
                    errorMessage = 'Analysis timed out. The AI service took too long to respond. Please try again with a clearer image or check your internet connection.'
                } else if (errorMessage.includes('API key') || errorMessage.includes('not configured')) {
                    errorMessage = 'API keys are not configured properly. Please contact the administrator to set up Google Cloud Vision and OpenAI API keys.'
                } else if (errorMessage.includes('no valid cutting list') || errorMessage.includes('failed to extract')) {
                    errorMessage = 'Unable to extract measurements from the drawing. Please ensure the image is clear, contains visible dimensions, and is a technical drawing of a kitchen cabinet.'
                } else if (errorMessage.includes('DrawingAnalyzer not initialized')) {
                    errorMessage = 'Analysis service is not properly initialized. Please contact the administrator to check server dependencies.'
                }
                
                throw new Error(errorMessage)
            }

            setAnalysisResults(result)
        } catch (err: any) {
            console.error('Analysis error:', err)
            
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                setError('Cannot connect to backend server. Please ensure the Flask server is running at ' + BACKEND_URL)
            } else if (err.message.includes('non-JSON response')) {
                setError(err.message)
            } else {
                setError(err.message || 'Analysis failed. Please check the backend server and API keys.')
            }
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="p-6">
            {/* Header Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Drawing Analyzer</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            AI-powered kitchen cabinet drawing analysis and cutting list generation
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                            <Zap className="h-3.5 w-3.5" />
                            <span>Google Cloud Vision</span>
                        </div>
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>GPT-4 Analysis</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Workshop Configuration Card */}
                <Card className="mb-6 bg-white border border-gray-200 shadow-sm">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Settings className="h-5 w-5 text-gray-700" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Workshop Configuration</h2>
                                    <p className="text-sm text-gray-500">Customize specifications for accurate calculations</p>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setConfig({
                                    back_width_offset: 36, top_depth_offset: 30, shelf_depth_offset: 70, 
                                    thickness: 18, leg_height_deduction: 100, countertop_deduction: 25
                                })}
                                className="text-gray-600 hover:text-gray-900 border-gray-300"
                            >
                                <RefreshCw className="h-4 w-4 mr-2"/>
                                Reset to Default
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {(Object.keys(config) as Array<keyof ConfigState>).map((key) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={config[key]}
                                            onChange={(e) => handleConfigChange(key, e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            min="0"
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-gray-400">mm</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Upload Section - No file uploaded yet */}
                {!uploadedFile && !isAnalyzing && !analysisResults && (
                    <div className="space-y-6">
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <div className="p-8">
                                <UploadArea onFileUpload={handleFileUpload} />
                            </div>
                        </Card>

                        {/* Best Practices Card */}
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                            <div className="p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                    <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                                    Best Practices for Accurate Analysis
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-800">✓ Good Quality Images</h4>
                                        <ul className="space-y-1 text-xs text-gray-600">
                                            <li>• Clear, high-resolution scans or photos</li>
                                            <li>• All dimensions clearly visible</li>
                                            <li>• Good lighting without shadows</li>
                                            <li>• Straight orientation (not tilted)</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-800">✓ Technical Drawing Requirements</h4>
                                        <ul className="space-y-1 text-xs text-gray-600">
                                            <li>• Standard technical drawing format</li>
                                            <li>• Measurements in mm or consistent units</li>
                                            <li>• Cabinet views with dimensions labeled</li>
                                            <li>• Legible text and numbers</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Feature Cards */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                        <Upload className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Upload Drawing</h3>
                                    <p className="text-sm text-gray-500">
                                        Upload your kitchen cabinet technical drawing in any standard image format
                                    </p>
                                </div>
                            </Card>

                            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                                        <Settings className="h-6 w-6 text-green-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Configure Settings</h3>
                                    <p className="text-sm text-gray-500">
                                        Customize workshop specifications for accurate cutting calculations
                                    </p>
                                </div>
                            </Card>

                            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                                        <FileText className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Get Results</h3>
                                    <p className="text-sm text-gray-500">
                                        Download professional cutting lists and DXF layouts instantly
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* File Selected - Ready to Analyze */}
                {uploadedFile && !isAnalyzing && !analysisResults && (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <FileImage className="h-7 w-7 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{uploadedFile.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <Button 
                                        onClick={resetAnalysis} 
                                        variant="outline"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleAnalyze} 
                                        className="bg-gray-900 text-white hover:bg-gray-800"
                                    >
                                        <Zap className="h-4 w-4 mr-2" />
                                        Analyze Drawing
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Loading State */}
                {isAnalyzing && (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-12">
                            <LoadingSpinner />
                        </div>
                    </Card>
                )}

                {/* Error State */}
                {error && (
                    <div className="space-y-4">
                        <Card className="bg-red-50 border border-red-200 shadow-sm">
                            <div className="p-6">
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-red-900 mb-1">Analysis Failed</h3>
                                        <p className="text-sm text-red-700 mb-4">{error}</p>
                                        <div className="flex space-x-3">
                                            <Button 
                                                onClick={handleAnalyze} 
                                                className="bg-red-600 text-white hover:bg-red-700"
                                            >
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Retry Analysis
                                            </Button>
                                            <Button 
                                                onClick={resetAnalysis} 
                                                variant="outline" 
                                                className="border-red-300 text-red-700 hover:bg-red-50"
                                            >
                                                Upload Different Image
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Troubleshooting Tips Card */}
                        <Card className="bg-blue-50 border border-blue-200 shadow-sm">
                            <div className="p-6">
                                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                                    <AlertCircle className="h-5 w-5 mr-2" />
                                    Troubleshooting Tips
                                </h3>
                                <ul className="space-y-2 text-sm text-blue-800">
                                    <li className="flex items-start">
                                        <span className="text-blue-600 mr-2">•</span>
                                        <span>Ensure the drawing is clear and well-lit with visible dimensions</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-600 mr-2">•</span>
                                        <span>Check that all measurements and labels are legible</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-600 mr-2">•</span>
                                        <span>Verify your internet connection is stable</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-600 mr-2">•</span>
                                        <span>Try uploading the image again or use a higher quality scan</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-600 mr-2">•</span>
                                        <span>If the problem persists, contact support with the error message above</span>
                                    </li>
                                </ul>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Results */}
                {analysisResults && (
                    <div className="space-y-6">
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900">Analysis Complete</h2>
                                            <p className="text-sm text-gray-500">Your cutting list is ready</p>
                                        </div>
                                    </div>
                                </div>
                                <AnalyzerResults results={analysisResults} />
                            </div>
                        </Card>
                        
                        <div className="flex justify-center">
                            <Button 
                                onClick={resetAnalysis} 
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Analyze Another Drawing
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}