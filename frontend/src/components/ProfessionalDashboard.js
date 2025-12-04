'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  Download,
  Eye,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  User,
  Users,
  Building2,
  ArrowUpRight,
  Activity,
  LayoutDashboard,
  Upload,
  History,
  Settings,
  BarChart3,
  FolderOpen,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Archive,
  DollarSign,
  Target,
  TrendingDown,
  Zap,
  Database,
  Cpu,
  HardDrive,
  Calculator,
  Briefcase,
  Calendar
} from 'lucide-react'
import CustomersPage from './Customers'
import PriceGenerator from './PriceGenerator'
import SalesPipeline from './SalesPipeline'
import Jobs from './Jobs'
import JobScheduling from './JobScheduling'
 

// Mock data
const mockAnalysisHistory = [
  { id: 'A-2024-001', fileName: 'kitchen_cabinet_1200x780.jpg', analyzedAt: '2024-01-15T10:30:00', status: 'completed', pieces: 6, area: 2.45, clientName: 'Johnson Kitchen', project: 'Residential Remodel', duration: '18s' },
  { id: 'A-2024-002', fileName: 'cabinet_drawing_1350x720.png', analyzedAt: '2024-01-15T11:15:00', status: 'completed', pieces: 8, area: 3.12, clientName: 'Smith Home', project: 'New Construction', duration: '22s' },
  { id: 'A-2024-003', fileName: 'cabinet_specs_900x650.jpg', analyzedAt: '2024-01-15T14:22:00', status: 'completed', pieces: 4, area: 1.88, clientName: 'Davis Renovation', project: 'Kitchen Update', duration: '15s' },
  { id: 'A-2024-004', fileName: 'technical_drawing_1500x800.png', analyzedAt: '2024-01-15T15:45:00', status: 'failed', pieces: 0, area: 0, clientName: 'Wilson Project', project: 'Commercial Build', duration: '8s' },
  { id: 'A-2024-005', fileName: 'cabinet_layout_1100x750.jpg', analyzedAt: '2024-01-15T16:10:00', status: 'completed', pieces: 5, area: 2.67, clientName: 'Brown Kitchen Co', project: 'Apartment Complex', duration: '20s' }
]

const monthlyData = [
  { month: 'Jul', analyses: 45, success: 42, failed: 3 },
  { month: 'Aug', analyses: 52, success: 49, failed: 3 },
  { month: 'Sep', analyses: 48, success: 45, failed: 3 },
  { month: 'Oct', analyses: 61, success: 58, failed: 3 },
  { month: 'Nov', analyses: 67, success: 63, failed: 4 },
  { month: 'Dec', analyses: 72, success: 68, failed: 4 }
]

const cabinetTypeDistribution = [
  { type: 'Base Cabinets', count: 145, color: '#3B82F6' },
  { type: 'Wall Cabinets', count: 89, color: '#10B981' },
  { type: 'Tall Cabinets', count: 34, color: '#F59E0B' },
  { type: 'Custom Units', count: 28, color: '#EF4444' }
]

const performanceData = [
  { time: '00:00', cpu: 45, memory: 62, processing: 12 },
  { time: '04:00', cpu: 38, memory: 58, processing: 8 },
  { time: '08:00', cpu: 72, memory: 85, processing: 24 },
  { time: '12:00', cpu: 89, memory: 78, processing: 31 },
  { time: '16:00', cpu: 65, memory: 71, processing: 18 },
  { time: '20:00', cpu: 52, memory: 64, processing: 15 }
]

const projects = [
  { id: 'P-001', name: 'Luxury Apartments', client: 'Johnson Kitchen', status: 'active', analyses: 12, lastUpdate: '2024-01-15', budget: 45000 },
  { id: 'P-002', name: 'Commercial Complex', client: 'Smith Development', status: 'active', analyses: 8, lastUpdate: '2024-01-14', budget: 78000 },
  { id: 'P-003', name: 'Residential Remodel', client: 'Davis Renovation', status: 'completed', analyses: 15, lastUpdate: '2024-01-10', budget: 32000 },
  { id: 'P-004', name: 'Hotel Kitchen Fit-out', client: 'Wilson Hotels', status: 'on-hold', analyses: 3, lastUpdate: '2024-01-08', budget: 125000 }
]

const recentMetrics = {
  totalAnalyses: 345,
  successRate: 94.2,
  avgProcessingTime: 18.5,
  activeClients: 28,
  thisMonth: { growth: 12.5 }
}

const sidebarMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { id: 'customers', label: 'Customers', icon: Users, roles: ['admin'] },
  { id: 'salesPipeline', label: 'Sales Pipeline', icon: DollarSign, roles: ['admin'] },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, roles: ['admin'] },
  { id: 'schedule', label: 'Schedule', icon: Calendar, roles: ['admin', 'staff'] },
  { id: 'upload', label: 'New Analysis', icon: Upload, roles: ['admin', 'staff'] },
  { id: 'priceGenerator', label: 'Price Generator', icon: Calculator, roles: ['admin'] },
  { id: 'history', label: 'Analysis History', icon: History, roles: ['admin', 'staff'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
]

const bottomMenuItems = [
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
  { id: 'logout', label: 'Sign Out', icon: LogOut },
]

// Simple Badge component
function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${className}`}>
      {children}
    </span>
  )
}

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

// Sidebar Component
function Sidebar({ activeMenuItem, setActiveMenuItem, sidebarCollapsed, setSidebarCollapsed, userRole, onLogout }) {
  const handleMenuClick = (menuId) => {
    setActiveMenuItem(menuId)
  }

  const filteredMenuItems = sidebarMenuItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Inner Space</h1>
                  <p className="text-xs text-gray-500">Analysis Platform</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 h-8 w-8"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => { 
              const Icon = item.icon
              const isActive = activeMenuItem === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-gray-200">
          <ul className="space-y-2">
            {bottomMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (item.id === 'logout') {
                        onLogout();  // Call the onLogout prop
                      } else {
                        handleMenuClick(item.id);
                      }
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-gray-400" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

// Dashboard Content
function DashboardContent({ userRole }) {
  const [searchQuery, setSearchQuery] = useState('')
  const isStaff = userRole === 'staff'

  const filteredHistory = mockAnalysisHistory.filter(item => 
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.project.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      )
    }
    if (status === 'failed') {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">
        <Clock className="h-3 w-3 mr-1" />
        Processing
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* View-Only Banner for Staff */}
      {isStaff && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">View Only Mode - You have read-only access to this dashboard</span>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Analyses</h3>
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{recentMetrics.totalAnalyses}</div>
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-600 font-medium">+{recentMetrics.thisMonth.growth}%</span>
            <span className="ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{recentMetrics.successRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${recentMetrics.successRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Avg Processing</h3>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{recentMetrics.avgProcessingTime}s</div>
          <p className="text-xs text-gray-500 flex items-center mt-2">
            <Clock className="h-3 w-3 mr-1" />
            Per analysis
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Active Clients</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{recentMetrics.activeClients}</div>
          <p className="text-xs text-gray-500 flex items-center mt-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            This month
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Analysis Trend</h3>
              <p className="text-sm text-gray-500">Monthly analysis volume</p>
            </div>
            <Badge className="bg-gray-100 text-gray-600">6 months</Badge>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="analyses" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorAnalyses)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cabinet Types</h3>
            <p className="text-sm text-gray-500">Distribution of analyzed cabinet types</p>
          </div>
          <div className="flex items-center justify-center mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={cabinetTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {cabinetTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {cabinetTypeDistribution.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm text-gray-600">{type.type}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{type.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Analysis Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Analysis</h3>
            <p className="text-sm text-gray-500">Latest processed cabinet drawings</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search analyses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Analysis ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">File Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Client</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Pieces</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Area (m²)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-medium text-sm text-gray-900">{item.id}</div>
                    <div className="text-xs text-gray-500">{item.project}</div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">{item.fileName}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">{item.clientName}</td>
                  <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                  <td className="py-4 px-4 text-sm font-mono text-gray-900">{item.pieces}</td>
                  <td className="py-4 px-4 text-sm font-mono text-gray-900">{item.area}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(item.analyzedAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm" title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={isStaff}
                        title={isStaff ? "Download restricted for staff" : "Download"}
                        className={isStaff ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            Showing {filteredHistory.length} of {mockAnalysisHistory.length} analyses
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Upload Content with full analysis workflow
function UploadContent() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState({
    back_width_offset: 36,
    top_depth_offset: 30,
    shelf_depth_offset: 70,
    thickness: 18,
    leg_height_deduction: 100,
    countertop_deduction: 25
  })

  const handleFileUpload = (file) => {
    setUploadedFile(file)
    setAnalysisResults(null)
    setError(null)
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!uploadedFile) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      
      // Append each config value as a separate form field
      formData.append('back_width_offset', config.back_width_offset.toString())
      formData.append('top_depth_offset', config.top_depth_offset.toString())
      formData.append('shelf_depth_offset', config.shelf_depth_offset.toString())
      formData.append('thickness', config.thickness.toString())
      formData.append('leg_height_deduction', config.leg_height_deduction.toString())
      formData.append('countertop_deduction', config.countertop_deduction.toString())

      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Analysis failed')
      }

      setAnalysisResults(result)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check if the backend server is running on port 8000.')
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setUploadedFile(null)
    setAnalysisResults(null)
    setError(null)
  }

  return (
    <div className="p-6 space-y-8">
      {/* Workshop Configuration */}
      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Workshop Configuration
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Back Width Offset (mm)</label>
            <Input 
              type="number" 
              value={config.back_width_offset}
              onChange={(e) => setConfig({...config, back_width_offset: parseInt(e.target.value) || 0})}
              className="text-center"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Top Depth Offset (mm)</label>
            <Input 
              type="number" 
              value={config.top_depth_offset}
              onChange={(e) => setConfig({...config, top_depth_offset: parseInt(e.target.value) || 0})}
              className="text-center"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Depth Offset (mm)</label>
            <Input 
              type="number" 
              value={config.shelf_depth_offset}
              onChange={(e) => setConfig({...config, shelf_depth_offset: parseInt(e.target.value) || 0})}
              className="text-center"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Board Thickness (mm)</label>
            <Input 
              type="number" 
              value={config.thickness}
              onChange={(e) => setConfig({...config, thickness: parseInt(e.target.value) || 0})}
              className="text-center"
              min="6"
              max="25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leg Deduction (mm)</label>
            <Input 
              type="number" 
              value={config.leg_height_deduction}
              onChange={(e) => setConfig({...config, leg_height_deduction: parseInt(e.target.value) || 0})}
              className="text-center"
              min="0"
              max="200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Countertop (mm)</label>
            <Input 
              type="number" 
              value={config.countertop_deduction}
              onChange={(e) => setConfig({...config, countertop_deduction: parseInt(e.target.value) || 0})}
              className="text-center"
              min="0"
              max="50"
            />
          </div>
        </div>
      </div>

      {/* Upload Section - Only show if no file uploaded and not analyzing */}
      {!uploadedFile && !isAnalyzing && !analysisResults && (
        <div className="bg-white rounded-xl border p-6">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Upload Kitchen Cabinet Drawing</h3>
            <p className="text-sm text-gray-500">Drag and drop your technical drawing here, or click to browse</p>
          </div>

          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Upload Kitchen Cabinet Drawing</p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop your technical drawing here, or click to browse
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Supported: PNG, JPG, JPEG, GIF, WEBP • Max size: 10MB
            </p>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              id="file-upload-input"
            />
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </div>
      )}

      {/* File Selected - Ready to Analyze */}
      {uploadedFile && !isAnalyzing && !analysisResults && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <FileText className="h-12 w-12 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-800">{uploadedFile.name}</h3>
                <p className="text-sm text-gray-600">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={resetAnalysis}>
                Cancel
              </Button>
              <Button onClick={handleAnalyze} className="bg-blue-600 hover:bg-blue-700">
                <Zap className="h-4 w-4 mr-2" />
                Analyze Drawing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Drawing</h3>
          <p className="text-gray-600">Processing with AI-powered analysis...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Analysis Failed</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button variant="outline" onClick={resetAnalysis}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results - Use the full AnalysisResults component */}
      {analysisResults && (
        <div className="space-y-6">
          <AnalysisResultsDisplay results={analysisResults} />
          {/* <AnalysisResultsComponent results={analysisResults} /> */}
          <div className="text-center">
            <Button variant="outline" onClick={resetAnalysis}>
              Analyze Another Drawing
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisResultsDisplay({ results }) {
  const [activeTab, setActiveTab] = useState('summary')
  const [editingCell, setEditingCell] = useState(null)

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  // Check if results exist and have the expected structure
  if (!results) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Results</h3>
          <p className="text-gray-600">No analysis results available</p>
        </div>
      </div>
    )
  }

  // Handle different response formats
  const { summary, results: analysisData, filename, timestamp, dxf_content, configuration } = results
  
  if (!analysisData || !summary) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Analysis Failed</h3>
          <p className="text-gray-600">{results.message || results.error || 'Unable to process the drawing'}</p>
        </div>
      </div>
    )
  }

  const [editedData, setEditedData] = useState(analysisData)

  useEffect(() => {
    setEditedData(analysisData)
  }, [analysisData])

  const handleCellEdit = (category, itemIndex, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        items: prev[category].items.map((item, index) => 
          index === itemIndex 
            ? { 
                ...item, 
                [field]: field === 'width' || field === 'height' ? parseInt(value) || 0 : value,
                dimensions: field === 'width' || field === 'height' 
                  ? `${field === 'width' ? (parseInt(value) || 0) : item.width} x ${field === 'height' ? (parseInt(value) || 0) : item.height}`
                  : item.dimensions
              }
            : item
        )
      }
    }))
  }

  const handleCellClick = (category, itemIndex, field) => {
    setEditingCell(`${category}-${itemIndex}-${field}`)
  }

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setEditingCell(null)
    }
  }

  // Prepare chart data
  const categoryData = Object.entries(analysisData).map(([category, data]) => ({
    category: category.replace('T/B & FIX SHELVES', 'T/B Shelves').replace('BACKS', 'Back Panels'),
    pieces: data.total_pieces,
    area: data.total_area,
    color: COLORS[Object.keys(analysisData).indexOf(category)]
  })).filter(item => item.pieces > 0)

  const pieData = categoryData.map(item => ({
    name: item.category,
    value: item.pieces,
    color: item.color
  }))

  // Create downloadable CSV
  const downloadCSV = () => {
    let csvContent = "Category,Part ID,Dimensions,Height (mm),Width (mm),Quantity,Material,Notes\n"
    
    Object.entries(editedData).forEach(([category, data]) => {
      data.items.forEach(item => {
        csvContent += `"${category}","${item.part_id}","${item.dimensions}",${item.height},${item.width},${item.quantity},"${item.material_type}","${item.notes}"\n`
      })
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cutting_list_${filename ? filename.split('.')[0] : 'analysis'}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Generate DXF layout
  const generateLayoutDXF = () => {
    if (!editedData) return;
    
    let dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
ENTITIES
`;

    let currentX = 0;
    let currentY = 0;
    const spacing = 50;
    let maxRowHeight = 0;
    const maxWidth = 2440;

    Object.entries(editedData).forEach(([category, data]) => {
      data.items.forEach((item) => {
        const width = item.width;
        const height = item.height;
        
        if (currentX + width > maxWidth) {
          currentY += maxRowHeight + spacing;
          currentX = 0;
          maxRowHeight = 0;
        }
        
        dxfContent += `0
POLYLINE
8
${category.replace(/[^A-Za-z0-9]/g, '_')}
66
1
10
0.0
20
0.0
30
0.0
0
VERTEX
8
${category.replace(/[^A-Za-z0-9]/g, '_')}
10
${currentX}
20
${currentY}
30
0.0
0
VERTEX
8
${category.replace(/[^A-Za-z0-9]/g, '_')}
10
${currentX + width}
20
${currentY}
30
0.0
0
VERTEX
8
${category.replace(/[^A-Za-z0-9]/g, '_')}
10
${currentX + width}
20
${currentY + height}
30
0.0
0
VERTEX
8
${category.replace(/[^A-Za-z0-9]/g, '_')}
10
${currentX}
20
${currentY + height}
30
0.0
0
VERTEX
8
${category.replace(/[^A-Za-z0-9]/g, '_')}
10
${currentX}
20
${currentY}
30
0.0
0
SEQEND
8
${category.replace(/[^A-Za-z0-9]/g, '_')}
0
TEXT
8
${category.replace(/[^A-Za-z0-9]/g, '_')}_TEXT
10
${currentX + width/2}
20
${currentY + height/2}
30
0.0
40
8.0
1
${item.part_id}
`;

        currentX += width + spacing;
        maxRowHeight = Math.max(maxRowHeight, height);
      });
    });

    dxfContent += `0
ENDSEC
0
EOF`;

    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cutting_layout_${filename ? filename.split('.')[0] : 'analysis'}_${new Date().toISOString().split('T')[0]}.dxf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Download existing DXF if available
  const downloadDXF = () => {
    if (!dxf_content) return;
    
    const blob = new Blob([dxf_content], { type: 'application/dxf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${filename ? filename.split('.')[0] : 'drawing'}_${new Date().toISOString().split('T')[0]}.dxf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="h-8 w-8 text-blue-600 mx-auto mb-2">📦</div>
          <div className="text-2xl font-bold text-gray-800">{summary.total_pieces}</div>
          <div className="text-sm text-gray-600">Total Pieces</div>
        </div>
        
        <div className="bg-white rounded-lg border p-6 text-center">
          <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{summary.categories}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
        
        <div className="bg-white rounded-lg border p-6 text-center">
          <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{summary.total_area} m²</div>
          <div className="text-sm text-gray-600">Total Area</div>
        </div>
        
        <div className="bg-white rounded-lg border p-6 text-center">
          <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-lg font-bold text-gray-800">
            {timestamp ? new Date(timestamp).toLocaleTimeString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* File info and download actions */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <Eye className="h-6 w-6 text-gray-400" />
            <div>
              <h3 className="font-semibold text-gray-800">{filename || 'Analysis Results'}</h3>
              <p className="text-sm text-gray-600">
                {timestamp ? `Analyzed on ${new Date(timestamp).toLocaleDateString()}` : 'No date available'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            
            <Button variant="outline" onClick={generateLayoutDXF}>
              <Download className="h-4 w-4 mr-2" />
              Generate Layout DXF
            </Button>
            
            {dxf_content && (
              <Button variant="outline" onClick={downloadDXF}>
                <Download className="h-4 w-4 mr-2" />
                Download DXF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
                          <div className="font-bold text-blue-600">{data.total_pieces} pcs</div>
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
                        {editedData[category].items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.part_id}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                              {editingCell === `${category}-${index}-dimensions` ? (
                                <input
                                  type="text"
                                  value={item.dimensions}
                                  onChange={(e) => handleCellEdit(category, index, 'dimensions', e.target.value)}
                                  onBlur={handleCellBlur}
                                  onKeyPress={handleKeyPress}
                                  className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  autoFocus
                                />
                              ) : (
                                <span 
                                  onClick={() => handleCellClick(category, index, 'dimensions')}
                                  className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                                  title="Click to edit"
                                >
                                  {item.dimensions}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {editingCell === `${category}-${index}-quantity` ? (
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleCellEdit(category, index, 'quantity', e.target.value)}
                                  onBlur={handleCellBlur}
                                  onKeyPress={handleKeyPress}
                                  className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  autoFocus
                                />
                              ) : (
                                <span 
                                  onClick={() => handleCellClick(category, index, 'quantity')}
                                  className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                                  title="Click to edit"
                                >
                                  {item.quantity}
                                </span>
                              )}
                            </td>
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
                  <Bar dataKey="pieces" fill="#3B82F6" />
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
                  <Bar dataKey="area" fill="#10B981" />
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
      </div>
    </div>
  )
}

// Analysis History Content
function AnalysisHistoryContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredHistory = mockAnalysisHistory.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.project.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>
    }
    if (status === 'failed') {
      return <Badge className="bg-red-100 text-red-800 border-0"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-0"><Clock className="h-3 w-3 mr-1" />Processing</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{mockAnalysisHistory.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{mockAnalysisHistory.filter(a => a.status === 'completed').length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{mockAnalysisHistory.filter(a => a.status === 'failed').length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">18.2s</p>
            </div>
            <Clock className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by filename, client, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('failed')}
            >
              Failed
            </Button>
          </div>
        </div>

        {/* Analysis Table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Analysis Details</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Client & Project</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Results</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-sm text-gray-900">{item.id}</div>
                    <div className="text-sm text-gray-600">{item.fileName}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-sm text-gray-900">{item.clientName}</div>
                    <div className="text-sm text-gray-600">{item.project}</div>
                  </td>
                  <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <span className="font-medium">{item.pieces}</span> pieces
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{item.area}</span> m²
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-mono">{item.duration}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(item.analyzedAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm"><Archive className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            Showing {filteredHistory.length} of {mockAnalysisHistory.length} analyses
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Page
function SettingsContent() {
  const [notifications, setNotifications] = useState(true)
  const [autoArchive, setAutoArchive] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="p-6 space-y-6">
      {/* Profile Settings */}
      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
          <p className="text-sm text-gray-500">Manage your account information</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <Input defaultValue="John Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input defaultValue="john@innerspace.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <Input defaultValue="+1 (555) 123-4567" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <Input defaultValue="Inner Space Design" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <Input defaultValue="Senior Cabinet Analyst" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <Input defaultValue="San Francisco, CA" />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button>Save Profile</Button>
        </div>
      </div>

      {/* Analysis Settings */}
      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Configuration</h3>
          <p className="text-sm text-gray-500">Configure default analysis parameters</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Back Width Offset (mm)</label>
              <Input type="number" defaultValue="36" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Top Depth Offset (mm)</label>
              <Input type="number" defaultValue="30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Depth Offset (mm)</label>
              <Input type="number" defaultValue="70" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Board Thickness (mm)</label>
              <Input type="number" defaultValue="18" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leg Height Deduction (mm)</label>
              <Input type="number" defaultValue="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Countertop Deduction (mm)</label>
              <Input type="number" defaultValue="25" />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button>Save Configuration</Button>
        </div>
      </div>

      {/* Notifications & Preferences */}
      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Notifications & Preferences</h3>
          <p className="text-sm text-gray-500">Customize your experience</p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive email updates about analysis completion</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifications} 
              onChange={(e) => setNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto Archive</h4>
              <p className="text-sm text-gray-500">Automatically archive analyses older than 90 days</p>
            </div>
            <input 
              type="checkbox" 
              checked={autoArchive} 
              onChange={(e) => setAutoArchive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Dark Mode</h4>
              <p className="text-sm text-gray-500">Use dark theme for the interface</p>
            </div>
            <input 
              type="checkbox" 
              checked={darkMode} 
              onChange={(e) => setDarkMode(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* API Settings */}
      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
          <p className="text-sm text-gray-500">Manage your API keys and integrations</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
            <Input type="password" defaultValue="sk-proj-************************" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Google Cloud Credentials</label>
            <textarea 
              rows={3} 
              placeholder="Paste your Google Cloud service account JSON..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 space-x-3">
          <Button variant="outline">Test Connection</Button>
          <Button>Save API Settings</Button>
        </div>
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function ProfessionalDashboard({ onNewAnalysis, user, onLogout = () => {} }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard')

  const userRole = user?.role || 'staff'
  const userId = user?.id || '1'

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard Overview',
      customers: 'Customers',
      salesPipeline: 'Sales Pipeline',
      jobs: 'Jobs',
      jobScheduling: 'Job Scheduling',
      upload: 'New Analysis',
      history: 'Analysis History',
      settings: 'Settings & Configuration'
    }
    return titles[activeMenuItem] || 'Dashboard'
  }

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'dashboard':
        return <DashboardContent userRole={userRole} />
      case 'customers':
        return userRole === 'admin' ? <CustomersPage /> : <DashboardContent userRole={userRole} />
      case 'salesPipeline':
        return <SalesPipeline userRole={userRole} />
      case 'jobs':
        return userRole === 'admin' ? <Jobs /> : <DashboardContent userRole={userRole} />
      case 'schedule':
        return <JobScheduling userRole={userRole} user={user} />
      case 'priceGenerator':
        return userRole === 'admin' ? <PriceGenerator /> : <DashboardContent userRole={userRole} />
      case 'upload':
        return <UploadContent />
      case 'history':
        return <AnalysisHistoryContent userRole={userRole} />
      case 'settings':
        return userRole === 'admin' ? <SettingsContent /> : <DashboardContent userRole={userRole} />
      default:
        return <DashboardContent userRole={userRole} />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        userRole={userRole}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="text-sm text-gray-500">
                  {activeMenuItem === 'dashboard' && 'Monitor your cabinet analysis operations'}
                  {activeMenuItem === 'customers' && 'View and Manage all your customers'}
                  {activeMenuItem === 'salesPipeline' && 'View your sales pipeline'}
                  {activeMenuItem === 'jobs' && 'View and manage all your jobs'}
                  {activeMenuItem === 'priceGenerator' && 'generate prices'}
                  {activeMenuItem === 'schedule' && 'Schedule jobs'}
                  {activeMenuItem === 'upload' && 'Upload and analyze your kitchen cabinet drawings'}
                  {activeMenuItem === 'history' && 'View and manage all your analysis records'}
                  {activeMenuItem === 'settings' && 'Configure your account and system preferences'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}