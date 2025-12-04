'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, X, AlertCircle, Save, Calendar, DollarSign, MapPin, Users } from 'lucide-react'

// Simple components
function Button({ children, variant = "default", size = "default", className = "", onClick, disabled = false, type = "button" }) {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  }
  
  const sizeClasses = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-3 text-base"
  }
  
  return (
    <button 
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    />
  )
}

function Label({ children, htmlFor, className = "" }) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-2 ${className}`}>
      {children}
    </label>
  )
}

function Select({ children, value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    >
      {children}
    </select>
  )
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    />
  )
}

function Checkbox({ checked, onChange, id }) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
  )
}

const JOB_TYPES = ["Kitchen", "Bedroom", "Wardrobe", "Remedial", "Other"]
const JOB_STAGES = ["Lead", "Survey", "Quote", "Consultation", "Accepted", "Production", "Delivery", "Complete"]
const PRIORITIES = ["Low", "Medium", "High", "Urgent"]

export default function JobsPage() {
  const [view, setView] = useState('list') // 'list' or 'create'
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [quotes, setQuotes] = useState([])
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    job_reference: generateJobReference(),
    job_type: "",
    job_name: "",
    customer_id: "",
    salesperson: "",
    measure_date: "",
    delivery_date: "",
    completion_date: "",
    stage: "Survey",
    quote_id: "",
    quote_price: "",
    agreed_price: "",
    deposit_amount: "",
    deposit_due_date: "",
    installation_address: "",
    assigned_team: "",
    primary_fitter: "",
    priority: "Medium",
    tags: "",
    notes: "",
    create_counting_sheet: false,
    create_schedule: false,
    generate_invoice: false,
  })

  // Mock data for salespeople and fitters
  const salespeople = [
    { id: 1, name: "John Smith" },
    { id: 2, name: "Sarah Johnson" },
    { id: 3, name: "Mike Wilson" },
  ]

  const fitters = [
    { id: 1, name: "Team A - Kitchen Specialists" },
    { id: 2, name: "Team B - Bedroom Fitters" },
    { id: 3, name: "Dave Matthews" },
    { id: 4, name: "Tom Harris" },
  ]

  function generateJobReference() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
    return `JOB-${year}-${month}${day}-${time}`
  }

  // Load jobs list
  useEffect(() => {
    if (view === 'list') {
      loadJobs()
    }
  }, [view])

  // Load initial data for create form
  useEffect(() => {
    if (view === 'create') {
      loadCustomers()
    }
  }, [view])

  const loadJobs = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      setJobs([
        {
          id: 1,
          job_reference: 'JOB-2025-0101-1200',
          job_name: 'Kitchen Renovation',
          job_type: 'Kitchen',
          customer_name: 'John Doe',
          stage: 'Production',
          priority: 'High',
          agreed_price: 15000,
          delivery_date: '2025-01-15'
        },
        {
          id: 2,
          job_reference: 'JOB-2025-0102-1430',
          job_name: 'Bedroom Wardrobe',
          job_type: 'Wardrobe',
          customer_name: 'Jane Smith',
          stage: 'Quote',
          priority: 'Medium',
          agreed_price: 8500,
          delivery_date: '2025-01-20'
        }
      ])
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      // Mock data - replace with actual API call
      setCustomers([
        { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', address: '123 Main St' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', address: '456 Oak Ave' }
      ])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const handleCustomerChange = (customerId) => {
    handleInputChange("customer_id", customerId)
    
    const customer = customers.find(c => c.id === parseInt(customerId))
    if (customer) {
      handleInputChange("installation_address", customer.address || "")
    }
  }

  const handleQuoteChange = (quoteId) => {
    handleInputChange("quote_id", quoteId)
    
    const selectedQuote = quotes.find(q => q.id === parseInt(quoteId))
    if (selectedQuote) {
      handleInputChange("quote_price", selectedQuote.total.toString())
      handleInputChange("agreed_price", selectedQuote.total.toString())
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.job_reference.trim()) {
      newErrors.job_reference = "Job reference is required"
    }
    if (!formData.job_type) {
      newErrors.job_type = "Job type is required"
    }
    if (!formData.customer_id) {
      newErrors.customer_id = "Customer is required"
    }
    if (!formData.installation_address.trim()) {
      newErrors.installation_address = "Installation address is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Mock submission - replace with actual API call
      console.log('Submitting job:', formData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset form and go back to list
      setFormData({
        job_reference: generateJobReference(),
        job_type: "",
        job_name: "",
        customer_id: "",
        salesperson: "",
        measure_date: "",
        delivery_date: "",
        completion_date: "",
        stage: "Survey",
        quote_id: "",
        quote_price: "",
        agreed_price: "",
        deposit_amount: "",
        deposit_due_date: "",
        installation_address: "",
        assigned_team: "",
        primary_fitter: "",
        priority: "Medium",
        tags: "",
        notes: "",
        create_counting_sheet: false,
        create_schedule: false,
        generate_invoice: false,
      })
      
      setView('list')
    } catch (error) {
      console.error("Error creating job:", error)
      setErrors({ submit: "Failed to create job. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const selectedCustomer = customers.find(c => c.id === parseInt(formData.customer_id))

  const getStageColor = (stage) => {
    const colors = {
      'Lead': 'bg-gray-100 text-gray-800',
      'Survey': 'bg-blue-100 text-blue-800',
      'Quote': 'bg-yellow-100 text-yellow-800',
      'Accepted': 'bg-green-100 text-green-800',
      'Production': 'bg-purple-100 text-purple-800',
      'Delivery': 'bg-orange-100 text-orange-800',
      'Complete': 'bg-green-200 text-green-900'
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  // Jobs List View
  if (view === 'list') {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <p className="text-gray-600 mt-1">Manage all your cabinet installation jobs</p>
          </div>
          <Button onClick={() => setView('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">No jobs found</p>
              <Button onClick={() => setView('create')}>Create Your First Job</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Job Reference</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Job Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Stage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Delivery Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">{job.job_reference}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{job.job_name}</td>
                      <td className="py-4 px-4 text-gray-600">{job.job_type}</td>
                      <td className="py-4 px-4 text-gray-900">{job.customer_name}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(job.stage)}`}>
                          {job.stage}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(job.priority)}`}>
                          {job.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-gray-900">
                        ${job.agreed_price?.toLocaleString() || '0'}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {job.delivery_date ? new Date(job.delivery_date).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Create Job Form View
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setView('list')}
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Job</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="job_reference">Job Reference *</Label>
              <Input
                id="job_reference"
                value={formData.job_reference}
                onChange={(e) => handleInputChange("job_reference", e.target.value)}
                className={errors.job_reference ? "border-red-500" : ""}
              />
              {errors.job_reference && (
                <p className="text-sm text-red-500 mt-1">{errors.job_reference}</p>
              )}
            </div>

            <div>
              <Label htmlFor="job_type">Job Type *</Label>
              <Select 
                value={formData.job_type} 
                onChange={(value) => handleInputChange("job_type", value)}
                className={errors.job_type ? "border-red-500" : ""}
              >
                <option value="">Select job type</option>
                {JOB_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
              {errors.job_type && (
                <p className="text-sm text-red-500 mt-1">{errors.job_type}</p>
              )}
            </div>

            <div>
              <Label htmlFor="job_name">Job Name</Label>
              <Input
                id="job_name"
                placeholder="e.g., Kitchen Renovation"
                value={formData.job_name}
                onChange={(e) => handleInputChange("job_name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select value={formData.stage} onChange={(value) => handleInputChange("stage", value)}>
                {JOB_STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Customer & Team */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer & Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Select 
                value={formData.customer_id} 
                onChange={handleCustomerChange}
                className={errors.customer_id ? "border-red-500" : ""}
              >
                <option value="">Select customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </Select>
              {errors.customer_id && (
                <p className="text-sm text-red-500 mt-1">{errors.customer_id}</p>
              )}
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-blue-50 rounded border">
                  <p className="text-sm font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="salesperson">Salesperson</Label>
              <Select value={formData.salesperson} onChange={(value) => handleInputChange("salesperson", value)}>
                <option value="">Select salesperson</option>
                {salespeople.map(person => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Important Dates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="measure_date">Measure Date</Label>
              <Input
                id="measure_date"
                type="date"
                value={formData.measure_date}
                onChange={(e) => handleInputChange("measure_date", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="delivery_date">Delivery Date</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => handleInputChange("delivery_date", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="completion_date">Completion Date</Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={(e) => handleInputChange("completion_date", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Financials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="quote_price">Quote Price ($)</Label>
              <Input
                id="quote_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.quote_price}
                onChange={(e) => handleInputChange("quote_price", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="agreed_price">Agreed Price ($)</Label>
              <Input
                id="agreed_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.agreed_price}
                onChange={(e) => handleInputChange("agreed_price", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="deposit_amount">Deposit Amount ($)</Label>
              <Input
                id="deposit_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.deposit_amount}
                onChange={(e) => handleInputChange("deposit_amount", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="deposit_due_date">Deposit Due Date</Label>
              <Input
                id="deposit_due_date"
                type="date"
                value={formData.deposit_due_date}
                onChange={(e) => handleInputChange("deposit_due_date", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Logistics */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Logistics
          </h2>
          <div className="space-y-6">
            <div>
              <Label htmlFor="installation_address">Installation Address *</Label>
              <Textarea
                id="installation_address"
                rows={3}
                value={formData.installation_address}
                onChange={(e) => handleInputChange("installation_address", e.target.value)}
                className={errors.installation_address ? "border-red-500" : ""}
              />
              {errors.installation_address && (
                <p className="text-sm text-red-500 mt-1">{errors.installation_address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="assigned_team">Assigned Team</Label>
                <Select value={formData.assigned_team} onChange={(value) => handleInputChange("assigned_team", value)}>
                  <option value="">Select team</option>
                  {fitters.map(fitter => (
                    <option key={fitter.id} value={fitter.id}>{fitter.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="primary_fitter">Primary Fitter</Label>
                <Select value={formData.primary_fitter} onChange={(value) => handleInputChange("primary_fitter", value)}>
                  <option value="">Select fitter</option>
                  {fitters.map(fitter => (
                    <option key={fitter.id} value={fitter.id}>{fitter.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onChange={(value) => handleInputChange("priority", value)}>
                  {PRIORITIES.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="e.g., rush-job, premium-customer (comma-separated)"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Notes & Additional Information</h2>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Add any additional notes or special requirements..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>
        </div>

        {/* Advanced Options */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Advanced Options</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create_counting_sheet"
                checked={formData.create_counting_sheet}
                onChange={(checked) => handleInputChange("create_counting_sheet", checked)}
              />
              <Label htmlFor="create_counting_sheet" className="mb-0">Create counting sheet(s)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="create_schedule"
                checked={formData.create_schedule}
                onChange={(checked) => handleInputChange("create_schedule", checked)}
              />
              <Label htmlFor="create_schedule" className="mb-0">Create schedule placeholder</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate_invoice"
                checked={formData.generate_invoice}
                onChange={(checked) => handleInputChange("generate_invoice", checked)}
              />
              <Label htmlFor="generate_invoice" className="mb-0">Generate initial invoice draft</Label>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setView('list')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Create Job</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}