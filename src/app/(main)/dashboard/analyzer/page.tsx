'use client'

import React, { useState, useCallback } from 'react'
import { Upload, Settings, FileText, Zap, CheckCircle, AlertCircle, RefreshCw, FileImage, Download, Eye, Brain } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UploadArea from '@/components/UploadArea'
import LoadingSpinner from '@/components/LoadingSpinner'
import AnalyzerResults from '@/components/AnalyzerResults'
import EditableCabinetTable from '@/components/EditableCabinetTable'
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

interface Cabinet {
    id: number;
    width: number;
    type: string;
    height: number;
    depth: number;
}

export default function AnalyzerPage() {
    const { user } = useAuth();
    
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isExtracting, setIsExtracting] = useState(false)
    const [analysisResults, setAnalysisResults] = useState<any>(null)
    const [extractedCabinets, setExtractedCabinets] = useState<Cabinet[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [analysisMode, setAnalysisMode] = useState<'quick' | 'smart' | null>(null)
    
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
        setExtractedCabinets(null)
        setError(null)
        setAnalysisMode(null)
    }, [])

    const resetAnalysis = () => {
        setUploadedFile(null)
        setAnalysisResults(null)
        setExtractedCabinets(null)
        setError(null)
        setAnalysisMode(null)
    }

    const handleConfigChange = (key: keyof ConfigState, value: string) => {
        const intValue = parseInt(value) || 0;
        setConfig(prev => ({ ...prev, [key]: intValue }))
    }

    // OLD SYSTEM - Quick single cabinet analysis
    const handleQuickAnalyze = async () => {
        if (!uploadedFile) {
            setError("Please upload a file to begin analysis.");
            return;
        }

        setIsAnalyzing(true)
        setError(null)
        setAnalysisMode('quick')

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
                throw new Error(`Server returned non-JSON response. Status: ${response.status}`)
            }

            const result = await response.json()

            if (!response.ok || result.error) {
                let errorMessage = result.message || result.error || 'Analysis failed'
                throw new Error(errorMessage)
            }

            setAnalysisResults(result)
        } catch (err: any) {
            console.error('Analysis error:', err)
            setError(err.message || 'Analysis failed')
        } finally {
            setIsAnalyzing(false)
        }
    }

    // NEW SYSTEM - Smart layout analysis with editable table
    const handleSmartAnalyze = async () => {
        if (!uploadedFile) {
            setError("Please upload a file to begin analysis.");
            return;
        }

        setIsExtracting(true)
        setError(null)
        setAnalysisMode('smart')

        try {
            const formData = new window.FormData()
            formData.append('file', uploadedFile)

            const response = await fetch(`${BACKEND_URL}/analysis/extract-dimensions`, {
                method: 'POST',
                body: formData,
            })

            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server returned non-JSON response. Status: ${response.status}`)
            }

            const result = await response.json()

            if (!response.ok || result.error) {
                let errorMessage = result.message || result.error || 'Dimension extraction failed'
                throw new Error(errorMessage)
            }

            // Show editable cabinet table
            setExtractedCabinets(result.cabinets)
        } catch (err: any) {
            console.error('Extraction error:', err)
            setError(err.message || 'Failed to extract dimensions')
        } finally {
            setIsExtracting(false)
        }
    }

    // NEW SYSTEM - Calculate from confirmed cabinets
    const handleCalculateCabinets = async (cabinets: Cabinet[]) => {
        setIsAnalyzing(true)
        setError(null)

        try {
            const response = await fetch(`${BACKEND_URL}/analysis/calculate-cabinets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cabinets })
            })

            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server returned non-JSON response. Status: ${response.status}`)
            }

            const result = await response.json()

            if (!response.ok || result.error) {
                let errorMessage = result.message || result.error || 'Calculation failed'
                throw new Error(errorMessage)
            }

            setAnalysisResults(result)
            setExtractedCabinets(null) // Hide table, show results
        } catch (err: any) {
            console.error('Calculation error:', err)
            setError(err.message || 'Failed to calculate components')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleCancelCabinetEdit = () => {
        setExtractedCabinets(null)
        setAnalysisMode(null)
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
                            <span>Claude Sonnet 4</span>
                        </div>
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Google Vision</span>
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
                {!uploadedFile && !isAnalyzing && !isExtracting && !analysisResults && !extractedCabinets && (
                    <div className="space-y-6">
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <div className="p-8">
                                <UploadArea onFileUpload={handleFileUpload} />
                            </div>
                        </Card>

                        {/* Analysis Mode Info Cards */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Zap className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Quick Analyze</h3>
                                            <p className="text-xs text-gray-600">Best for single elevation cabinets</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        <li className="flex items-start">
                                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>Fast analysis (30 seconds)</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>Single cabinet drawings</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>4 component types</span>
                                        </li>
                                    </ul>
                                </div>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Brain className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Smart Analyze</h3>
                                            <p className="text-xs text-gray-600">Best for full kitchen layouts</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        <li className="flex items-start">
                                            <CheckCircle className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>Review & edit dimensions</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>Multiple cabinet layouts</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <span>7 component types (complete)</span>
                                        </li>
                                    </ul>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* File Selected - Choose Analysis Mode */}
                {uploadedFile && !isAnalyzing && !isExtracting && !analysisResults && !extractedCabinets && (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-6">
                            <div className="flex flex-col space-y-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <FileImage className="h-7 w-7 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{uploadedFile.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Choose analysis mode
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-4">Select Analysis Mode:</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* Quick Analyze Button */}
                                        <Button 
                                            onClick={handleQuickAnalyze}
                                            className="h-auto py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white flex-col items-start"
                                        >
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Zap className="h-5 w-5" />
                                                <span className="font-semibold">Quick Analyze</span>
                                            </div>
                                            <span className="text-xs text-blue-100 text-left">
                                                For single elevation cabinet drawings
                                            </span>
                                        </Button>

                                        {/* Smart Analyze Button */}
                                        <Button 
                                            onClick={handleSmartAnalyze}
                                            className="h-auto py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white flex-col items-start"
                                        >
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Brain className="h-5 w-5" />
                                                <span className="font-semibold">Smart Analyze</span>
                                            </div>
                                            <span className="text-xs text-purple-100 text-left">
                                                For full kitchen layout drawings (recommended)
                                            </span>
                                        </Button>
                                    </div>

                                    <div className="mt-4 flex justify-center">
                                        <Button 
                                            onClick={resetAnalysis} 
                                            variant="outline"
                                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Loading State - Extracting */}
                {isExtracting && (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-12">
                            <LoadingSpinner />
                            <p className="text-center text-sm text-gray-600 mt-4">
                                Extracting dimensions from drawing...
                            </p>
                        </div>
                    </Card>
                )}

                {/* Loading State - Analyzing */}
                {isAnalyzing && (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <div className="p-12">
                            <LoadingSpinner />
                            <p className="text-center text-sm text-gray-600 mt-4">
                                {analysisMode === 'quick' ? 'Analyzing drawing...' : 'Calculating components...'}
                            </p>
                        </div>
                    </Card>
                )}

                {/* Editable Cabinet Table (Smart Analyze - Phase 2) */}
                {extractedCabinets && !analysisResults && (
                    <EditableCabinetTable 
                        initialCabinets={extractedCabinets}
                        onCalculate={handleCalculateCabinets}
                        onCancel={handleCancelCabinetEdit}
                        isCalculating={isAnalyzing}
                    />
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
                                                onClick={analysisMode === 'quick' ? handleQuickAnalyze : handleSmartAnalyze}
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
                                            <p className="text-sm text-gray-500">
                                                {analysisMode === 'smart' ? 'Smart Analysis' : 'Quick Analysis'} • Your cutting list is ready
                                            </p>
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