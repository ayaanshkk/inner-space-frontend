import { useState, useEffect } from 'react';

const Icons = {
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash2: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  ChevronDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  Filter: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
};

function Button({ children, variant = "default", size = "default", className = "", onClick, disabled }) {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100"
  };
  const sizes = { default: "px-4 py-2 text-sm", sm: "px-3 py-1.5 text-xs" };
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {children}
    </select>
  );
}

const getStageColor = (stage) => {
  const colors = {
    Lead: 'bg-gray-100 text-gray-800',
    Quote: 'bg-blue-100 text-blue-800',
    Consultation: 'bg-blue-100 text-blue-800',
    Survey: 'bg-yellow-100 text-yellow-800',
    Measure: 'bg-yellow-100 text-yellow-800',
    Design: 'bg-orange-100 text-orange-800',
    Quoted: 'bg-orange-100 text-orange-800',
    Accepted: 'bg-purple-100 text-purple-800',
    Production: 'bg-purple-100 text-purple-800',
    Delivery: 'bg-indigo-100 text-indigo-800',
    Installation: 'bg-indigo-100 text-indigo-800',
    Complete: 'bg-green-100 text-green-800',
    OnHold: 'bg-gray-100 text-gray-600',
    Remedial: 'bg-red-100 text-red-800',
    Cancelled: 'bg-red-100 text-red-600'
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
};

function CreateCustomerModal({ isOpen, onClose, onCustomerCreated }) {
  const [formData, setFormData] = useState({
    name: '', address: '', postcode: '', phone: '', email: '',
    contact_made: 'Unknown', preferred_contact_method: 'Phone',
    marketing_opt_in: false, date_of_measure: '', stage: 'Lead',
    notes: '', salesperson: '', project_types: []
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to create customer');
      
      onCustomerCreated();
      onClose();
      setFormData({
        name: '', address: '', postcode: '', phone: '', email: '',
        contact_made: 'Unknown', preferred_contact_method: 'Phone',
        marketing_opt_in: false, date_of_measure: '', stage: 'Lead',
        notes: '', salesperson: '', project_types: []
      });
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Error creating customer');
    }
  };

  const handleProjectTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      project_types: prev.project_types.includes(type)
        ? prev.project_types.filter(t => t !== type)
        : [...prev.project_types, type]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add New Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icons.X />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
              <Input
                value={formData.postcode}
                onChange={(e) => setFormData({...formData, postcode: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson</label>
              <Input
                value={formData.salesperson}
                onChange={(e) => setFormData({...formData, salesperson: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Types</label>
            <div className="flex gap-3">
              {['Kitchen', 'Bedroom', 'Wardrobe', 'Other'].map(type => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.project_types.includes(type)}
                    onChange={() => handleProjectTypeToggle(type)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <Select value={formData.stage} onChange={(val) => setFormData({...formData, stage: val})}>
                <option value="Lead">Lead</option>
                <option value="Quote">Quote</option>
                <option value="Consultation">Consultation</option>
                <option value="Measure">Measure</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Made</label>
              <Select value={formData.contact_made} onChange={(val) => setFormData({...formData, contact_made: val})}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unknown">Unknown</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Customer</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    fetch("http://127.0.0.1:5000/customers")
      .then((res) => res.json())
      .then(setCustomers)
      .catch((err) => console.error("Error fetching customers:", err));
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      (customer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'All' || customer.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const deleteCustomer = async (id) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/customers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete customer");
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting customer");
    }
  };

  const uniqueStages = Array.from(new Set(customers.map(c => c.stage)));

  return (
    <div className="w-full p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Customers</h1>
      
      <div className="flex justify-between mb-6">
        <div className="flex gap-3">
          <div className="relative w-64">
            <div className="absolute left-2 top-2.5">
              <Icons.Search />
            </div>
            <Input
              placeholder="Search customers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Button 
              variant="outline"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Icons.Filter />
              <span className="ml-2">{stageFilter === 'All' ? 'All Stages' : stageFilter}</span>
              <Icons.ChevronDown />
            </Button>
            
            {showFilterDropdown && (
              <div className="absolute top-full mt-1 w-48 bg-white border rounded-md shadow-lg z-10">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => {
                    setStageFilter('All');
                    setShowFilterDropdown(false);
                  }}
                >
                  All Stages
                </button>
                {uniqueStages.map((stage) => (
                  <button
                    key={stage}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setStageFilter(stage);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Icons.Plus />
          <span className="ml-2">Add Customer</span>
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Types</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm text-gray-900">{customer.address || "—"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {customer.phone && <div className="text-sm text-gray-900">{customer.phone}</div>}
                      {customer.email && <div className="text-sm text-gray-500">{customer.email}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(customer.stage)}`}>
                      {customer.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.salesperson || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.project_types && customer.project_types.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {customer.project_types.map((type, index) => (
                          <span 
                            key={index}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              type === 'Kitchen' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-900">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Edit customer', customer.id);
                        }}
                      >
                        <Icons.Edit />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomer(customer.id);
                        }}
                      >
                        <Icons.Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCustomerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCustomerCreated={fetchCustomers}
      />
    </div>
  );
}