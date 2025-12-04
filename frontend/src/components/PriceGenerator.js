'use client'

import { useState } from 'react'
import { Calculator, DollarSign, Package, Ruler, Download, RefreshCw, Edit2, Save } from 'lucide-react'

// Simple Button component
function Button({ children, variant = "default", size = "default", className = "", onClick, ...props }) {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500"
  }
  
  const sizeClasses = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-3 text-base"
  }
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Simple Input component
function Input({ className = "", ...props }) {
  return (
    <input
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    />
  )
}

export default function PriceGenerator() {
  const [dimensions, setDimensions] = useState({
    height: '',
    width: '',
    depth: ''
  })

  const [results, setResults] = useState(null)
  const [pricePerSqM, setPricePerSqM] = useState(50)
  const [editingCell, setEditingCell] = useState(null)
  const [editedComponents, setEditedComponents] = useState(null)

  const calculateDimensions = () => {
    const H = parseFloat(dimensions.height) || 0
    const W = parseFloat(dimensions.width) || 0
    const D = parseFloat(dimensions.depth) || 0

    if (H <= 0 || W <= 0 || D <= 0) {
      alert('Please enter valid positive numbers for all dimensions')
      return
    }

    const components = {
      gable: {
        name: 'Gable',
        formula: 'H × W',
        height: H,
        width: W,
        area: (H * W) / 1000000,
        price: ((H * W) / 1000000) * pricePerSqM
      },
      base: {
        name: 'Base',
        formula: '(W-36) × (D-70)',
        height: W - 36,
        width: D - 70,
        area: ((W - 36) * (D - 70)) / 1000000,
        price: (((W - 36) * (D - 70)) / 1000000) * pricePerSqM
      },
      topRail: {
        name: 'Top Rail',
        formula: '(W-36) × (D-30)',
        height: W - 36,
        width: D - 30,
        area: ((W - 36) * (D - 30)) / 1000000,
        price: (((W - 36) * (D - 30)) / 1000000) * pricePerSqM
      },
      back: {
        name: 'Back',
        formula: 'H × (W-36)',
        height: H,
        width: W - 36,
        area: (H * (W - 36)) / 1000000,
        price: ((H * (W - 36)) / 1000000) * pricePerSqM
      },
      shelf: {
        name: 'Shelf',
        formula: '(W-36) × (D-140)',
        height: W - 36,
        width: D - 140,
        area: ((W - 36) * (D - 140)) / 1000000,
        price: (((W - 36) * (D - 140)) / 1000000) * pricePerSqM
      }
    }

    const totalArea = Object.values(components).reduce((sum, comp) => sum + comp.area, 0)
    const totalPrice = Object.values(components).reduce((sum, comp) => sum + comp.price, 0)

    setResults({
      components,
      totalArea,
      totalPrice
    })
    setEditedComponents(JSON.parse(JSON.stringify(components))) // Deep clone for editing
  }

  const handleCellEdit = (componentKey, field, value) => {
    const newComponents = { ...editedComponents }
    const parsedValue = parseFloat(value) || 0
    
    newComponents[componentKey][field] = parsedValue

    // Recalculate area and price based on edited dimensions
    if (field === 'height' || field === 'width') {
      const height = newComponents[componentKey].height
      const width = newComponents[componentKey].width
      newComponents[componentKey].area = (height * width) / 1000000
      newComponents[componentKey].price = newComponents[componentKey].area * pricePerSqM
    } else if (field === 'area') {
      newComponents[componentKey].price = parsedValue * pricePerSqM
    }

    setEditedComponents(newComponents)

    // Recalculate totals
    const totalArea = Object.values(newComponents).reduce((sum, comp) => sum + comp.area, 0)
    const totalPrice = Object.values(newComponents).reduce((sum, comp) => sum + comp.price, 0)
    
    setResults({
      components: newComponents,
      totalArea,
      totalPrice
    })
  }

  const handleCellClick = (componentKey, field) => {
    setEditingCell(`${componentKey}-${field}`)
  }

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setEditingCell(null)
    }
  }

  const resetCalculator = () => {
    setDimensions({ height: '', width: '', depth: '' })
    setResults(null)
    setEditedComponents(null)
    setEditingCell(null)
  }

  const downloadCSV = () => {
    if (!results) return

    const componentsToExport = editedComponents || results.components
    let csvContent = "Component,Formula,Height (mm),Width (mm),Area (m²),Price (£)\n"
    
    Object.values(componentsToExport).forEach(comp => {
      csvContent += `"${comp.name}","${comp.formula}",${comp.height.toFixed(2)},${comp.width.toFixed(2)},${comp.area.toFixed(4)},${comp.price.toFixed(2)}\n`
    })

    csvContent += `\nTotal,,,,${results.totalArea.toFixed(4)},${results.totalPrice.toFixed(2)}`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `price_calculation_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const displayComponents = editedComponents || results?.components

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Calculator className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Price Generator</h1>
            <p className="text-blue-100">Calculate cabinet component dimensions and pricing</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Ruler className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Input Dimensions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (H) - mm
            </label>
            <Input
              type="number"
              placeholder="e.g., 2100"
              value={dimensions.height}
              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
              className="text-center font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width (W) - mm
            </label>
            <Input
              type="number"
              placeholder="e.g., 600"
              value={dimensions.width}
              onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
              className="text-center font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depth (D) - mm
            </label>
            <Input
              type="number"
              placeholder="e.g., 560"
              value={dimensions.depth}
              onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value })}
              className="text-center font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per m² (£)
            </label>
            <Input
              type="number"
              placeholder="e.g., 50"
              value={pricePerSqM}
              onChange={(e) => setPricePerSqM(parseFloat(e.target.value) || 0)}
              className="text-center font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={resetCalculator}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={calculateDimensions}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate
          </Button>
        </div>
      </div>

      {/* Formulas Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Formula Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <span className="font-medium text-gray-900">Gable:</span>
            <span className="text-gray-600 ml-2">H × W</span>
          </div>
          <div className="bg-white rounded-lg p-3">
            <span className="font-medium text-gray-900">Base:</span>
            <span className="text-gray-600 ml-2">(W-36) × (D-70)</span>
          </div>
          <div className="bg-white rounded-lg p-3">
            <span className="font-medium text-gray-900">Top Rail:</span>
            <span className="text-gray-600 ml-2">(W-36) × (D-30)</span>
          </div>
          <div className="bg-white rounded-lg p-3">
            <span className="font-medium text-gray-900">Back:</span>
            <span className="text-gray-600 ml-2">H × (W-36)</span>
          </div>
          <div className="bg-white rounded-lg p-3">
            <span className="font-medium text-gray-900">Shelf:</span>
            <span className="text-gray-600 ml-2">(W-36) × (D-140)</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Components</span>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {Object.keys(displayComponents).length}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Area</span>
                <Ruler className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {results.totalArea.toFixed(4)} m²
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Price</span>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                £{results.totalPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Detailed Results Table with Editable Fields */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Component Breakdown</h3>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Edit2 className="h-3 w-3 mr-1" />
                  Click on any value to edit
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Component</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Formula</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Height (mm)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Width (mm)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Area (m²)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Price (£)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(displayComponents).map(([key, component]) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{component.name}</td>
                      <td className="py-4 px-4 text-sm text-gray-600 font-mono">{component.formula}</td>
                      
                      {/* Editable Height */}
                      <td className="py-4 px-4">
                        {editingCell === `${key}-height` ? (
                          <input
                            type="number"
                            value={component.height}
                            onChange={(e) => handleCellEdit(key, 'height', e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyPress={handleKeyPress}
                            className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                            autoFocus
                            step="0.01"
                          />
                        ) : (
                          <span
                            onClick={() => handleCellClick(key, 'height')}
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded font-mono text-sm block"
                            title="Click to edit"
                          >
                            {component.height.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Editable Width */}
                      <td className="py-4 px-4">
                        {editingCell === `${key}-width` ? (
                          <input
                            type="number"
                            value={component.width}
                            onChange={(e) => handleCellEdit(key, 'width', e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyPress={handleKeyPress}
                            className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                            autoFocus
                            step="0.01"
                          />
                        ) : (
                          <span
                            onClick={() => handleCellClick(key, 'width')}
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded font-mono text-sm block"
                            title="Click to edit"
                          >
                            {component.width.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Editable Area */}
                      <td className="py-4 px-4">
                        {editingCell === `${key}-area` ? (
                          <input
                            type="number"
                            value={component.area}
                            onChange={(e) => handleCellEdit(key, 'area', e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyPress={handleKeyPress}
                            className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                            autoFocus
                            step="0.0001"
                          />
                        ) : (
                          <span
                            onClick={() => handleCellClick(key, 'area')}
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded font-mono text-sm block"
                            title="Click to edit"
                          >
                            {component.area.toFixed(4)}
                          </span>
                        )}
                      </td>

                      {/* Price (auto-calculated, not editable) */}
                      <td className="py-4 px-4 text-sm font-mono text-green-600 font-medium">
                        £{component.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan="4" className="py-4 px-4 text-right text-gray-900">
                      TOTAL:
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-gray-900">
                      {results.totalArea.toFixed(4)}
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-green-600">
                      £{results.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}