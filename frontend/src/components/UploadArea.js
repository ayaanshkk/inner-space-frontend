'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileImage, AlertCircle } from 'lucide-react'

export default function UploadArea({ onFileUpload }) {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      console.error('File rejected:', rejectedFiles[0].errors)
      return
    }

    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0])
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive && !isDragReject
            ? 'border-primary-500 bg-primary-50 scale-105' 
            : isDragReject
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-primary-25'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isDragReject ? (
            <AlertCircle className="h-16 w-16 text-red-400 animate-bounce-gentle" />
          ) : isDragActive ? (
            <Upload className="h-16 w-16 text-primary-500 animate-bounce-gentle" />
          ) : (
            <FileImage className="h-16 w-16 text-gray-400" />
          )}
          
          <div>
            <h3 className={`text-xl font-semibold mb-2 ${
              isDragReject ? 'text-red-600' : isDragActive ? 'text-primary-600' : 'text-gray-700'
            }`}>
              {isDragReject 
                ? 'Invalid File Type' 
                : isDragActive 
                ? 'Drop Your Drawing Here' 
                : 'Upload Kitchen Cabinet Drawing'
              }
            </h3>
            
            <p className={`text-sm ${
              isDragReject ? 'text-red-500' : 'text-gray-500'
            }`}>
              {isDragReject 
                ? 'Please upload a valid image file (PNG, JPG, JPEG, GIF, WEBP)'
                : 'Drag and drop your technical drawing here, or click to browse'
              }
            </p>
          </div>
          
          {!isDragReject && (
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-gray-400">
              <span>Supported: PNG, JPG, JPEG, GIF, WEBP</span>
              <span className="hidden sm:inline">•</span>
              <span>Max size: 10MB</span>
            </div>
          )}
        </div>
        
        {/* Animated background effect */}
        {isDragActive && !isDragReject && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 rounded-xl animate-pulse" />
        )}
      </div>
    </div>
  )
}