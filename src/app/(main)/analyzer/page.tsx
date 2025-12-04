'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Settings, FileText, Zap, CheckCircle, BarChart3, Home, FileImage, AlertCircle, RefreshCw } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// 🔑 CORRECTED IMPORTS: Importing components directly from '@/components'
import UploadArea from '@/components/UploadArea'
import LoadingSpinner from '@/components/LoadingSpinner'
import AnalyzerResults from '@/components/AnalyzerResults'
import { useAuth } from '@/contexts/AuthContext'

// ✅ CENTRALIZED API CONFIGURATION (Matches CustomersPage logic)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// --- Custom Styles/Component Classes (Based on globals.css) ---
const gradientBgClass = "bg-gradient-to-br from-primary via-primary/90 to-secondary"

interface ConfigState {
    back_width_offset: number;
    top_depth_offset: number;
    shelf_depth_offset: number;
    thickness: number;
    leg_height_deduction: number;
    countertop_deduction: number;
}

// Component that wraps the dashboard and analyzer together
export default function AnalyzerPage() {
    const router = useRouter();
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
            
            // Append configuration parameters
            Object.entries(config).forEach(([key, value]) => {
                formData.append(key, value.toString())
            })

            console.log('Sending request to:', `${BACKEND_URL}/analysis/analyze`)

            const response = await fetch(`${BACKEND_URL}/analysis/analyze`, {
                method: 'POST',
                body: formData,
                // Note: Don't set Content-Type header - browser will set it automatically with boundary
            })

            console.log('Response status:', response.status)
            console.log('Response headers:', response.headers)

            // Check if response is actually JSON
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text()
                console.error('Non-JSON response:', textResponse)
                throw new Error(`Server returned non-JSON response. Status: ${response.status}. The backend may not be running or the endpoint may not exist.`)
            }

            const result = await response.json()

            if (!response.ok || result.error) {
                throw new Error(result.message || result.error || 'Analysis failed due to server error.')
            }

            setAnalysisResults(result)
        } catch (err: any) {
            console.error('Analysis error:', err)
            
            // Provide more helpful error messages
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
        <div className="min-h-screen bg-gray-50">
            <header className={`${gradientBgClass} text-white`}>
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-6">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="link"
                            className="flex items-center space-x-2 text-blue-100 hover:text-white"
                        >
                            <Home className="h-5 w-5" />
                            <span>Back to Dashboard</span>
                        </Button>
                        
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => router.push('/dashboard/sales_pipeline')}
                                variant="outline"
                                className="bg-white/20 text-white hover:bg-white/30"
                            >
                                <BarChart3 className="h-4 w-4 inline mr-2" />
                                Sales Pipeline
                            </Button>
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
                                <span>DXF & CSV Export</span>
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
                        <Button variant="ghost" size="sm" onClick={() => setConfig({ // Reset button for config
                            back_width_offset: 36, top_depth_offset: 30, shelf_depth_offset: 70, 
                            thickness: 18, leg_height_deduction: 100, countertop_deduction: 25
                        })} className="ml-auto text-gray-500 hover:text-primary">
                            <RefreshCw className="h-4 w-4 mr-1"/> Reset
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {(Object.keys(config) as Array<keyof ConfigState>).map((key) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (mm)
                                </label>
                                <input
                                    type="number"
                                    value={config[key]}
                                    onChange={(e) => handleConfigChange(key, e.target.value)}
                                    className="input-field text-sm"
                                    min="0"
                                />
                            </div>
                        ))}
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
                                <Button onClick={resetAnalysis} variant="outline">
                                    Cancel
                                </Button>
                                <Button onClick={handleAnalyze} className="btn-primary flex items-center">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Analyze Drawing
                                </Button>
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
                                <Button onClick={resetAnalysis} variant="outline" className="mt-4">
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Results */}
                {analysisResults && (
                    <div className="space-y-6">
                        <AnalyzerResults results={analysisResults} />
                        <div className="text-center">
                            <Button onClick={resetAnalysis} variant="outline">
                                Analyze Another Drawing
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}