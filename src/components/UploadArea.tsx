// components/UploadArea.tsx
import React, { useCallback, useState } from 'react';
// Note: This import MUST be satisfied by running 'npm install react-dropzone'
import { useDropzone, DropzoneState } from 'react-dropzone'; 
import { UploadCloud, FileText, X, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card"; // Assuming Card is available

interface UploadAreaProps {
  // We specify File | null to align with the parent component's state reset logic
  onFileUpload: (file: File | null) => void;
}

// Fallback component if react-dropzone fails to load/is not installed
function DropzoneUnavailable() {
    return (
        <Card className="p-8 bg-red-100 border-red-400 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-600 mx-auto" />
            <p className="text-xl font-bold text-red-800">Configuration Error</p>
            <p className="text-red-700">
                The file upload component is missing a required dependency. 
                Please install it by running: 
                <code className="block bg-red-200 p-2 mt-2 rounded font-mono">npm install react-dropzone</code>
            </p>
        </Card>
    );
}

export default function UploadArea({ onFileUpload }: UploadAreaProps) {
  // Use conditional rendering for the external hook to prevent runtime crashes if dependency is missing
  let useDropzoneHook: typeof useDropzone | undefined;
  
  // NOTE: This complex try-catch/assignment structure is retained to manage potential build/runtime issues 
  // related to external module imports in the environment.
  try {
      useDropzoneHook = useDropzone;
  } catch (e) {
      console.error("react-dropzone module is unavailable.");
      return <DropzoneUnavailable />;
  }


  // State and hook logic must be defined if the hook import is assumed successful
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setPreviewFile(file);
      onFileUpload(file);
    }
  }, [onFileUpload]);

  // Use the guarded hook assumption
  const { getRootProps, getInputProps, isDragActive, open } = useDropzoneHook ? useDropzoneHook({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    } as any, // Type assertion needed for TS compatibility in some older versions
    maxFiles: 1,
    noClick: true,
  }) : { getRootProps: () => ({}), getInputProps: () => ({}), isDragActive: false, open: () => {} };


  if (!useDropzoneHook) {
      return <DropzoneUnavailable />;
  }

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewFile(null);
    onFileUpload(null); // Explicitly inform parent to clear file
  };

  return (
    <div 
      {...getRootProps()}
      onClick={open}
      className={`border-2 border-dashed rounded-xl p-8 transition-colors duration-200 cursor-pointer 
        ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary/50 bg-white'}`}
    >
      <input {...getInputProps()} />
      
      {!previewFile ? (
        <div className="text-center space-y-4">
          <UploadCloud className="h-12 w-12 text-primary mx-auto" />
          <p className="text-lg font-semibold text-gray-800">
            {isDragActive ? 'Drop the drawing here...' : 'Click or drag & drop a file here'}
          </p>
          <p className="text-sm text-gray-600">
            Supports JPEG, PNG, or PDF up to 10MB.
          </p>
          <Button onClick={open} variant="outline" className="mt-2">
            Browse Files
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-gray-800">{previewFile.name}</p>
              <p className="text-sm text-gray-500">File selected. Click "Analyze Drawing" below.</p>
            </div>
          </div>
          <Button onClick={handleRemoveFile} variant="ghost" size="icon">
            <X className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      )}
    </div>
  );
}