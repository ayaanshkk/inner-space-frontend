import { useState, useEffect, useMemo } from 'react';

// Stage definitions
const STAGES = [
  "Lead", "Quote", "Consultation", "Survey", "Measure", "Design",
  "Quoted", "Accepted", "OnHold", "Production", "Delivery",
  "Installation", "Complete", "Remedial", "Cancelled"
];

const stageColors = {
  Lead: "#6B7280", Quote: "#3B82F6", Consultation: "#8B5CF6",
  Survey: "#EC4899", Measure: "#F59E0B", Design: "#10B981",
  Quoted: "#06B6D4", Accepted: "#059669", OnHold: "#6D28D9",
  Production: "#D97706", Delivery: "#0284C7", Installation: "#16A34A",
  Complete: "#065F46", Remedial: "#DC2626", Cancelled: "#4B5563"
};

// Icon components (simplified SVG)
const Icons = {
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  FileText: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Filter: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Phone: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  MapPin: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Users: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Calendar: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  DollarSign: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Money: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  AlertCircle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Briefcase: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  MoreHorizontal: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
};

// UI Components
function Badge({ children, variant = "default", className = "", style = {} }) {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 text-gray-700 bg-white",
    destructive: "bg-red-100 text-red-800"
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${variants[variant]} ${className}`} style={style}>
      {children}
    </span>
  );
}

function Button({ children, variant = "default", size = "default", className = "", onClick, disabled }) {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100"
  };
  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs"
  };
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

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>;
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

// Kanban Card Component
function KanbanCard({ item, onOpenCustomer, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('itemId', item.id);
        e.dataTransfer.setData('currentStage', item.stage);
        if (onDragStart) onDragStart(item);
      }}
      className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing p-3"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{item.reference}</p>
            <button 
              className="text-xs text-gray-600 hover:underline truncate"
              onClick={() => onOpenCustomer && onOpenCustomer(item.customer?.id)}
            >
              {item.name}
            </button>
          </div>
          <div className="flex flex-col gap-1 ml-2">
            {item.jobType && <Badge variant="outline" className="text-xs">{item.jobType}</Badge>}
            <Badge variant={item.type === 'customer' ? 'secondary' : 'default'} className="text-xs">
              {item.type === 'customer' ? 'Customer' : 'Job'}
            </Badge>
          </div>
        </div>

        {(item.customer?.phone || item.customer?.email || item.customer?.address) && (
          <div className="space-y-1 text-xs text-gray-600">
            {item.customer?.phone && (
              <div className="flex items-center gap-2">
                <Icons.Phone />
                <span className="truncate">{item.customer.phone}</span>
              </div>
            )}
            {item.customer?.email && (
              <div className="flex items-center gap-2">
                <Icons.Mail />
                <span className="truncate">{item.customer.email}</span>
              </div>
            )}
            {item.customer?.address && (
              <div className="flex items-center gap-2">
                <Icons.MapPin />
                <span className="truncate">{item.customer.address}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 text-xs">
          {item.salesperson && (
            <div className="flex items-center gap-2">
              <Icons.Users />
              <span className="truncate">{item.salesperson}</span>
            </div>
          )}
          {item.measureDate && (
            <div className="flex items-center gap-2">
              <Icons.Calendar />
              <span className="truncate">Measure: {new Date(item.measureDate).toLocaleDateString()}</span>
            </div>
          )}
          {item.quotePrice && (
            <div className="flex items-center gap-2">
              <Icons.DollarSign />
              <span className="truncate">Quote: £{item.quotePrice.toLocaleString()}</span>
            </div>
          )}
          {item.agreedPrice && (
            <div className="flex items-center gap-2">
              <Icons.Check />
              <span className="truncate">Agreed: £{item.agreedPrice.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex gap-1 pt-2 border-t">
          <Button size="sm" variant="ghost" className="h-6 px-1 text-xs flex-1">
            <Icons.Eye />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-1 text-xs flex-1">
            <Icons.Mail />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-1 text-xs flex-1">
            <Icons.Check />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({ stage, items, onDrop, onOpenCustomer, onDragStart }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const color = stageColors[stage];
  const totalValue = items.reduce((sum, item) => sum + (item.agreedPrice || item.soldAmount || item.quotePrice || 0), 0);

  return (
    <div 
      className={`w-72 min-w-72 h-full flex flex-col rounded-lg ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-gray-50'}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const itemId = e.dataTransfer.getData('itemId');
        const currentStage = e.dataTransfer.getData('currentStage');
        if (itemId && currentStage !== stage) {
          onDrop(itemId, stage);
        }
      }}
    >
      <div className="p-3 border-b bg-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-medium text-sm">{stage}</span>
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
          <div className="ml-auto text-xs text-gray-500">£{totalValue.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {items.map((item) => (
          <KanbanCard key={item.id} item={item} onOpenCustomer={onOpenCustomer} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}

// Main Component
export default function SalesPipeline({ userRole }) {
  const [pipelineItems, setPipelineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSalesperson, setFilterSalesperson] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const isStaff = userRole === 'staff';

  // Staff should not have access to sales pipeline at all
  if (isStaff) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Icons.AlertCircle />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Access Restricted</h3>
              <p className="text-sm text-yellow-800 mb-3">
                You don't have permission to view the Sales Pipeline. This section is only available to administrators.
              </p>
              <p className="text-xs text-yellow-700">
                If you believe you should have access, please contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:5000/pipeline');
        
        if (!response.ok) throw new Error('Failed to fetch pipeline data');

        const data = await response.json();
        const items = data.map((item) => {
          if (item.type === 'customer') {
            return {
              id: item.id,
              type: 'customer',
              customer: item.customer,
              reference: `CUST-${item.customer.id.slice(-4).toUpperCase()}`,
              name: item.customer.name,
              stage: item.customer.stage,
              jobType: item.customer.project_types?.join(', '),
              measureDate: item.customer.date_of_measure,
              salesperson: item.customer.salesperson,
            };
          } else {
            return {
              id: item.id,
              type: 'job',
              customer: item.customer,
              job: item.job,
              reference: item.job.job_reference || `JOB-${item.job.id.slice(-4).toUpperCase()}`,
              name: item.customer.name,
              stage: item.job.stage,
              jobType: item.job.job_type,
              quotePrice: item.job.quote_price,
              agreedPrice: item.job.agreed_price,
              soldAmount: item.job.sold_amount,
              measureDate: item.job.measure_date || item.customer.date_of_measure,
              deliveryDate: item.job.delivery_date,
              salesperson: item.job.salesperson_name || item.customer.salesperson,
            };
          }
        });

        setPipelineItems(items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return pipelineItems.filter((item) => {
      const matchesSearch = !searchTerm || 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer?.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSalesperson = filterSalesperson === "all" || item.salesperson === filterSalesperson;
      const matchesStage = filterStage === "all" || item.stage === filterStage;
      const matchesType = filterType === "all" || item.jobType === filterType;

      return matchesSearch && matchesSalesperson && matchesStage && matchesType;
    });
  }, [pipelineItems, searchTerm, filterSalesperson, filterStage, filterType]);

  const salespeople = useMemo(() => 
    [...new Set(pipelineItems.map((item) => item.salesperson).filter(Boolean))], 
    [pipelineItems]
  );
  
  const jobTypes = useMemo(() => 
    [...new Set(pipelineItems.map((item) => item.jobType).filter(Boolean))], 
    [pipelineItems]
  );

  const itemsByStage = useMemo(() => {
    const grouped = {};
    STAGES.forEach(stage => {
      grouped[stage] = filteredItems.filter(item => item.stage === stage);
    });
    return grouped;
  }, [filteredItems]);

  const handleDrop = async (itemId, newStage) => {
    // Find the item being moved
    const item = pipelineItems.find(i => i.id === itemId);
    if (!item || item.stage === newStage) return;

    // Optimistically update UI
    setPipelineItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, stage: newStage } : i
    ));

    // Update backend
    try {
      const entityId = itemId.replace('customer-', '').replace('job-', '');
      const endpoint = item.type === 'customer' 
        ? `http://127.0.0.1:5000/customers/${entityId}`
        : `http://127.0.0.1:5000/jobs/${entityId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      console.log(`Moved ${item.type} ${itemId} to ${newStage}`);
    } catch (error) {
      console.error('Error updating stage:', error);
      // Revert on error
      setPipelineItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, stage: item.stage } : i
      ));
      alert('Failed to update stage. Please try again.');
    }
  };

  const handleOpenCustomer = (customerId) => {
    console.log('Opening customer', customerId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading pipeline data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Icons.AlertCircle />
            <h3 className="text-lg font-medium text-red-900 mb-2 mt-4">Error Loading Data</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Icons.Plus />
            <span className="ml-2">New Job</span>
          </Button>
          <Button variant="outline" size="sm">
            <Icons.FileText />
            <span className="ml-2">Export CSV</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-64">
          <Icons.Search />
          <Input
            placeholder="Search by name, reference, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Icons.Filter />
          <span className="ml-2">Filters</span>
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <Select value={filterSalesperson} onChange={setFilterSalesperson}>
            <option value="all">All Salespeople</option>
            {salespeople.map((person) => (
              <option key={person} value={person}>{person}</option>
            ))}
          </Select>

          <Select value={filterStage} onChange={setFilterStage}>
            <option value="all">All Stages</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </Select>

          <Select value={filterType} onChange={setFilterType}>
            <option value="all">All Job Types</option>
            {jobTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setView("kanban")}
          className={`px-4 py-2 font-medium transition-colors ${view === "kanban" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
        >
          Kanban View
        </button>
        <button
          onClick={() => setView("list")}
          className={`px-4 py-2 font-medium transition-colors ${view === "list" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
        >
          List View
        </button>
      </div>

      {view === "kanban" && (
        <div className="h-[calc(100vh-450px)] min-h-[600px] overflow-x-auto">
          <div className="flex flex-row items-start gap-4 h-full w-max pb-4">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                items={itemsByStage[stage] || []}
                onDrop={handleDrop}
                onOpenCustomer={handleOpenCustomer}
                onDragStart={(item) => console.log('Dragging', item.reference)}
              />
            ))}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Icons.Briefcase />
              <h3 className="text-lg font-medium mb-2 mt-4">No items found</h3>
              <p className="text-gray-600">Try adjusting your search or filters.</p>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">{item.reference}</span>
                      <span className="text-gray-700">{item.name}</span>
                      <Badge style={{ backgroundColor: stageColors[item.stage], color: "white" }}>
                        {item.stage}
                      </Badge>
                      {item.jobType && <Badge variant="outline">{item.jobType}</Badge>}
                      <Badge variant={item.type === 'customer' ? 'secondary' : 'default'}>
                        {item.type === 'customer' ? 'Customer' : 'Job'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.salesperson && <span>Salesperson: {item.salesperson}</span>}
                      {item.quotePrice && <span className="ml-4">Quote: £{item.quotePrice.toLocaleString()}</span>}
                      {item.agreedPrice && <span className="ml-4">Agreed: £{item.agreedPrice.toLocaleString()}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Icons.MoreHorizontal />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}