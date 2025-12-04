'use client'

import { Brain, Eye, Cog } from 'lucide-react'

export default function LoadingSpinner() {
  return (
    <div className="card text-center py-12 animate-fade-in-up">
      <div className="flex justify-center space-x-8 mb-8">
        {/* Google Vision Icon */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Eye className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <div className="absolute -inset-1">
              <div className="w-18 h-18 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700">Vision OCR</p>
          <p className="text-xs text-gray-500">Extracting text</p>
        </div>

        {/* Processing Arrow */}
        <div className="flex items-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>

        {/* OpenAI Icon */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Brain className="h-8 w-8 text-green-600 animate-pulse" />
            </div>
            <div className="absolute -inset-1">
              <div className="w-18 h-18 border-4 border-green-300 border-t-green-600 rounded-full animate-spin" style={{animationDelay: '0.5s'}}></div>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700">GPT-4 Analysis</p>
          <p className="text-xs text-gray-500">Understanding drawing</p>
        </div>

        {/* Processing Arrow */}
        <div className="flex items-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '1.1s'}}></div>
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '1.2s'}}></div>
          </div>
        </div>

        {/* Results Icon */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <Cog className="h-8 w-8 text-purple-600 animate-pulse" />
            </div>
            <div className="absolute -inset-1">
              <div className="w-18 h-18 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700">Processing</p>
          <p className="text-xs text-gray-500">Generating list</p>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Your Kitchen Cabinet Drawing</h3>
      <p className="text-gray-600 mb-6">This usually takes 15-30 seconds. Please wait while our AI processes your drawing.</p>
      
      <div className="flex justify-center">
        <div className="w-64 bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500 space-y-1">
        <p>🔍 Step 1: Extracting dimensions with Google Cloud Vision</p>
        <p>🧠 Step 2: Analyzing cabinet structure with OpenAI GPT-4</p>
        <p>📋 Step 3: Generating professional cutting list</p>
      </div>
    </div>
  )
}