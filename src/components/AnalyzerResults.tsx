// components/AnalyzerResults.tsx

import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, FileText, Package, BarChart3, FileDown, Eye, Clock, CheckCircle2, Settings, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button" // Assuming Button is a shared UI component
import { Card } from "@/components/ui/card" // Assuming Card is a shared UI component

// Colors for charts (based on old files)
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

interface AnalysisItem {
    part_id: string;
    dimensions: string;
    height: number;
    width: number;
    quantity: number;
    material_type: string;
    notes: string;
}

interface AnalysisCategory {
    items: AnalysisItem[];
    total_pieces: number;
    total_area: number;
    unique_sizes: number;
}

interface AnalysisResults {
    success: boolean;
    summary: {
        total_pieces: number;
        total_area: number;
        categories: number;
    };
    results: Record<string, AnalysisCategory>;
    filename: string;
    timestamp: string;
    dxf_content: string; // Base64 encoded DXF
    configuration: {
        back_width_offset: number;
        top_depth_offset: number;
        shelf_depth_offset: number;
        thickness: number;
        leg_height_deduction: number;
        countertop_deduction: number;
    };
    error?: string;
}

interface Props {
    results: AnalysisResults;
}

export default function AnalyzerResults({ results }: Props) {
  const [activeTab, setActiveTab] = useState('summary')

  if (!results || !results.success || results.error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">Analysis Failed</h3>
            <p className="text-red-700">{results?.error || 'Unable to process the drawing'}</p>
          </div>
        </div>
      </Card>
    )
  }

  const { summary, results: analysisData, filename, timestamp, dxf_content, configuration } = results

  // --- Data & Download Logic ---

  // Prepare chart data
  const categoryData = Object.entries(analysisData).map(([category, data]) => ({
    category: category.replace('T/B & FIX SHELVES', 'T/B Shelves').replace('BACKS', 'Back Panels'),
    pieces: data.total_pieces,
    area: data.total_area,
    color: COLORS[Object.keys(analysisData).indexOf(category) % COLORS.length]
  })).filter(item => item.pieces > 0)

  const pieData = categoryData.map(item => ({
    name: item.category,
    value: item.pieces,
    color: item.color
  }))

  // Create downloadable CSV
  const downloadCSV = () => {
    let csvContent = "Category,Part ID,Dimensions,Height (mm),Width (mm),Quantity,Material,Notes\n"
    
    Object.entries(analysisData).forEach(([category, data]) => {
      data.items.forEach(item => {
        csvContent += `"${category}","${item.part_id}","${item.dimensions}",${item.height},${item.width},${item.quantity},"${item.material_type}","${item.notes.replace(/"/g, '""')}"\n`
      })
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cutting_list_${filename.split('.')[0]}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Download existing DXF (backend-generated)
  const downloadDXF = () => {
    if (!dxf_content) return;
    
    // Decode base64 string to binary array
    const binaryString = atob(dxf_content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'application/dxf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a')
    a.href = url
    a.download = `layout_${filename.split('.')[0]}_${new Date().toISOString().split('T')[0]}.dxf`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'details', label: 'Detailed List', icon: FileText },
    { id: 'charts', label: 'Visualizations', icon: BarChart3 },
    { id: 'config', label: 'Configuration', icon: Settings }
  ]

  return (
    <div className="space-y-6">
      {/* Header with key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center p-6">
          <Package className="h-8 w-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{summary.total_pieces}</div>
          <div className="text-sm text-gray-600">Total Pieces</div>
        </Card>
        
        <Card className="text-center p-6">
          <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{summary.categories}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </Card>
        
        <Card className="text-center p-6">
          <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{summary.total_area} m²</div>
          <div className="text-sm text-gray-600">Total Area</div>
        </Card>
        
        <Card className="text-center p-6">
          <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-lg font-bold text-gray-800">
            {new Date(timestamp).toLocaleTimeString()}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
      </div>

      {/* File info and download actions */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <Eye className="h-6 w-6 text-gray-400" />
            <div>
              <h3 className="font-semibold text-gray-800">{filename}</h3>
              <p className="text-sm text-gray-600">Analyzed on {new Date(timestamp).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadCSV} variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </Button>
            
            {dxf_content && (
              <Button onClick={downloadDXF} variant="outline" className="flex items-center space-x-2">
                <FileDown className="h-4 w-4" />
                <span>Download DXF</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Components Breakdown */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Components Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(analysisData).map(([category, data]) => (
                    data.total_pieces > 0 && (
                      <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-800">
                            {category.replace('T/B & FIX SHELVES', 'T/B Shelves').replace('BACKS', 'Back Panels')}
                          </span>
                          <div className="text-sm text-gray-600">
                            {data.unique_sizes} unique size{data.unique_sizes !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{data.total_pieces} pcs</div>
                          <div className="text-sm text-gray-600">{data.total_area} m²</div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Pie Chart */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Distribution</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} pieces`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {Object.entries(analysisData).map(([category, data]) => (
              data.total_pieces > 0 && (
                <div key={category}>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    {category.replace('T/B & FIX SHELVES', 'T/B Shelves').replace('BACKS', 'Back Panels')} 
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({data.total_pieces} pieces, {data.total_area} m²)
                    </span>
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.part_id}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.dimensions}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.material_type}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.notes}>
                              {item.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Pieces by Category</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pieces" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Area by Category (m²)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="area" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'config' && configuration && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-800">Analysis Configuration</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Back Width Offset</div>
                <div className="text-xl font-bold text-gray-800">{configuration.back_width_offset}mm</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Top Depth Offset</div>
                <div className="text-xl font-bold text-gray-800">{configuration.top_depth_offset}mm</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Shelf Depth Offset</div>
                <div className="text-xl font-bold text-gray-800">{configuration.shelf_depth_offset}mm</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Board Thickness</div>
                <div className="text-xl font-bold text-gray-800">{configuration.thickness}mm</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Leg Height Deduction</div>
                <div className="text-xl font-bold text-gray-800">{configuration.leg_height_deduction}mm</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Countertop Deduction</div>
                <div className="text-xl font-bold text-gray-800">{configuration.countertop_deduction}mm</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-semibold text-blue-800 mb-2">Applied Formula Logic</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Height Adjustment:</strong> Total Height - {configuration.leg_height_deduction}mm - {configuration.countertop_deduction}mm</p>
                <p><strong>T/B Panels:</strong> (Width - {configuration.back_width_offset}mm) × (Depth - {configuration.top_depth_offset}mm)</p>
                <p><strong>S/H Hardware:</strong> (Width - {configuration.back_width_offset}mm) × (Depth - {configuration.shelf_depth_offset}mm)</p>
                <p><strong>Back Panel:</strong> Working Height × (Width - {configuration.back_width_offset}mm)</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}