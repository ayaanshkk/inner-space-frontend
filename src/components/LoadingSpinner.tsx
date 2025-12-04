// components/LoadingSpinner.tsx

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";

export default function LoadingSpinner() {
  return (
    <Card className="p-12 text-center bg-white border-2 border-primary-100">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Drawing...</h3>
        <p className="text-gray-600">
          This may take up to 30 seconds while AI vision processes dimensions and generates the cutting list.
        </p>
        <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="loading-shimmer h-full" style={{ width: '100%' }}></div>
        </div>
        <p className="mt-4 text-xs text-gray-500">Using Google Cloud Vision and GPT-4 for precision analysis.</p>
      </div>
    </Card>
  );
}