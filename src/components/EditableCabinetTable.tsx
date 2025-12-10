/**
 * EditableCabinetTable Component
 * Shows extracted cabinets with editable fields
 * User can modify dimensions, types before calculating
 */

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, Calculator, AlertCircle } from 'lucide-react'

interface Cabinet {
    id: number;
    width: number;
    type: string;
    height: number;
    depth: number;
}

interface Props {
    initialCabinets: Cabinet[];
    onCalculate: (cabinets: Cabinet[]) => void;
    onCancel: () => void;
    isCalculating?: boolean;
}

const CABINET_TYPES = {
    'standard_base': 'Standard Base',
    'sink_base': 'Sink Base',
    'drawer_base': 'Drawer Base',
    'narrow': 'Narrow Cabinet',
    'wide_base': 'Wide Base',
    'filler': 'Filler Panel',
    'corner_l': 'L-Corner'
}

export default function EditableCabinetTable({ 
    initialCabinets, 
    onCalculate, 
    onCancel,
    isCalculating = false 
}: Props) {
    const [cabinets, setCabinets] = useState<Cabinet[]>(initialCabinets)
    
    const updateCabinet = (index: number, field: keyof Cabinet, value: number | string) => {
        const updated = [...cabinets]
        updated[index] = { ...updated[index], [field]: value }
        setCabinets(updated)
    }
    
    const addCabinet = () => {
        const newId = Math.max(...cabinets.map(c => c.id), 0) + 1
        setCabinets([...cabinets, {
            id: newId,
            width: 600,
            type: 'standard_base',
            height: 720,
            depth: 560
        }])
    }
    
    const removeCabinet = (index: number) => {
        if (cabinets.length > 1) {
            setCabinets(cabinets.filter((_, i) => i !== index))
        }
    }
    
    const totalWidth = cabinets.reduce((sum, cab) => sum + cab.width, 0)
    
    return (
        <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Review & Edit Cabinets
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {cabinets.length} cabinet{cabinets.length !== 1 ? 's' : ''} detected • 
                            Total width: {totalWidth}mm
                        </p>
                    </div>
                    <Button
                        onClick={addCabinet}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Cabinet
                    </Button>
                </div>
                
                {/* Info Banner */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <strong>Review carefully:</strong> AI has extracted dimensions from your drawing. 
                        Please verify and adjust as needed before generating the cutting list.
                    </div>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Width (mm)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Height (mm)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Depth (mm)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {cabinets.map((cabinet, index) => (
                                <tr key={cabinet.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={cabinet.type}
                                            onChange={(e) => updateCabinet(index, 'type', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        >
                                            {Object.entries(CABINET_TYPES).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={cabinet.width}
                                            onChange={(e) => updateCabinet(index, 'width', parseInt(e.target.value) || 0)}
                                            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            min="1"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={cabinet.height}
                                            onChange={(e) => updateCabinet(index, 'height', parseInt(e.target.value) || 0)}
                                            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            min="1"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={cabinet.depth}
                                            onChange={(e) => updateCabinet(index, 'depth', parseInt(e.target.value) || 0)}
                                            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            min="1"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {cabinets.length > 1 && (
                                            <Button
                                                onClick={() => removeCabinet(index)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Actions */}
                <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        <strong>Total:</strong> {cabinets.length} cabinet{cabinets.length !== 1 ? 's' : ''} • {totalWidth}mm width
                    </div>
                    <div className="flex space-x-3">
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="border-gray-300 text-gray-700"
                            disabled={isCalculating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => onCalculate(cabinets)}
                            className="bg-gray-900 text-white hover:bg-gray-800"
                            disabled={isCalculating || cabinets.length === 0}
                        >
                            {isCalculating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Calculating...
                                </>
                            ) : (
                                <>
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Generate Cutting List
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}