import { useEffect, useMemo, useState } from 'react';

// Icons
const Icons = {
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Calendar: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Clock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  AlertTriangle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Truck: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>,
  Coffee: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7h-4m0 10v-5c0-.55-.45-1-1-1h-2c-.55 0-1-.45-1-1s.45-1 1-1h2m-6 8h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  Briefcase: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Loader2: () => <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>,
  RefreshCw: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Trash2: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
};

const MOCK_TEAM_MEMBERS = [
  { id: 1, name: "John Smith", role: "Installer" },
  { id: 2, name: "Mike Johnson", role: "Installer" },
  { id: 3, name: "Sarah Wilson", role: "Measuring" },
  { id: 4, name: "Tom Brown", role: "Installer" },
  { id: 5, name: "Lisa Davis", role: "Delivery" },
];

const TEAM_MEMBER_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16", "#F97316"
];

// UI Components
function Button({ children, variant = "default", size = "default", className = "", onClick, disabled }) {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
    destructive: "bg-red-600 text-white hover:bg-red-700"
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

function Select({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    >
      {children}
    </select>
  );
}

function Label({ children, className = "" }) {
  return <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>{children}</label>;
}

function Modal({ isOpen, onClose, title, description, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icons.X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function JobScheduling({ userRole, user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [teamMembers, setTeamMembers] = useState(MOCK_TEAM_MEMBERS);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [draggedAssignment, setDraggedAssignment] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    type: "job",
    start_time: "09:00",
    end_time: "17:00",
    priority: "Medium",
    status: "Scheduled",
    estimated_hours: 8,
  });

  const isStaff = userRole === 'staff';
  const currentUserId = user?.id || null;

  const visibleTeamMembers = useMemo(() => {
    console.log('Filtering team members - isStaff:', isStaff, 'currentUserId:', currentUserId);
    console.log('All team members:', teamMembers);
    
    if (isStaff && currentUserId) {
      // Map staff user ID to team member ID
      const staffMemberId = currentUserId === 'staff-001' ? 1 : parseInt(currentUserId);
      console.log('Staff member ID to filter:', staffMemberId);
      
      const filtered = teamMembers.filter(member => member.id === staffMemberId);
      console.log('Filtered team members:', filtered);
      
      return filtered;
    }
    return teamMembers;
  }, [teamMembers, isStaff, currentUserId]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= lastDay; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [currentDate]);

  const formatDateKey = (date) => {
    if (typeof date === "string") return date;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === "prev") newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const [assignmentsRes, jobsRes, customersRes, staffRes] = await Promise.all([
          fetch('http://127.0.0.1:5000/assignments'),
          fetch('http://127.0.0.1:5000/jobs/available'),
          fetch('http://127.0.0.1:5000/customers/active'),
          fetch('http://127.0.0.1:5000/staff'),
        ]);
        
        if (!assignmentsRes.ok || !jobsRes.ok || !customersRes.ok || !staffRes.ok) {
          throw new Error('API not available');
        }
        
        const [assignmentsData, jobsData, customersData, staffData] = await Promise.all([
          assignmentsRes.json(),
          jobsRes.json(),
          customersRes.json(),
          staffRes.json(),
        ]);
        
        setAssignments(assignmentsData);
        setAvailableJobs(jobsData);
        setCustomers(customersData);
        setTeamMembers(staffData);
      } catch (apiError) {
        console.log('API not available, using demo data');
        setTeamMembers(MOCK_TEAM_MEMBERS);
        setAvailableJobs([
          { id: "1", job_reference: "JOB-2024-001", customer_name: "Alice Johnson", customer_id: "1", job_type: "Kitchen", stage: "ready" },
          { id: "2", job_reference: "JOB-2024-002", customer_name: "Bob Smith", customer_id: "2", job_type: "Bedroom", stage: "ready" },
          { id: "3", job_reference: "JOB-2024-003", customer_name: "Carol Brown", customer_id: "3", job_type: "Kitchen", stage: "ready" },
        ]);
        setCustomers([
          { id: "1", name: "Alice Johnson", stage: "active" },
          { id: "2", name: "Bob Smith", stage: "active" },
          { id: "3", name: "Carol Brown", stage: "active" },
        ]);

        const todayKey = formatDateKey(new Date());
        setAssignments([
          {
            id: "demo-1",
            type: "job",
            title: "JOB-2024-001 - Alice Johnson",
            date: todayKey,
            staff_id: "1",
            job_id: "1",
            customer_id: "1",
            estimated_hours: 4,
            start_time: "09:00",
            end_time: "13:00",
            staff_name: "John Smith",
            job_reference: "JOB-2024-001",
            customer_name: "Alice Johnson"
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (assignmentData) => {
    try {
      setSaving(true);
      
      let title = "";
      switch (assignmentData.type) {
        case "job":
          if (assignmentData.job_id) {
            const job = availableJobs.find(j => j.id === assignmentData.job_id);
            title = job ? `${job.job_reference} - ${job.customer_name}` : "Job Assignment";
          } else {
            title = "Job Assignment";
          }
          break;
        case "off":
          title = "Day Off";
          break;
        case "delivery":
          title = "Deliveries";
          break;
        case "note":
          title = assignmentData.notes || "Note";
          break;
        default:
          title = "Assignment";
      }

      const finalAssignmentData = { ...assignmentData, title };

      try {
        const response = await fetch('http://127.0.0.1:5000/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalAssignmentData),
        });

        if (!response.ok) throw new Error('API not available');
        const result = await response.json();
        setAssignments(prev => [...prev, result.assignment]);
        return result.assignment;
      } catch (apiError) {
        const newAssignment = {
          id: `local-${Date.now()}`,
          ...finalAssignmentData,
          status: finalAssignmentData.status || "Scheduled",
        };
        setAssignments(prev => [...prev, newAssignment]);
        return newAssignment;
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateAssignment = async (id, assignmentData) => {
    try {
      setSaving(true);
      
      try {
        const response = await fetch(`http://127.0.0.1:5000/assignments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignmentData),
        });

        if (!response.ok) throw new Error('API not available');
        const result = await response.json();
        setAssignments(prev => prev.map(a => a.id === id ? result.assignment : a));
        return result.assignment;
      } catch (apiError) {
        setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...assignmentData } : a));
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deleteAssignment = async (id) => {
    try {
      setSaving(true);
      
      try {
        await fetch(`http://127.0.0.1:5000/assignments/${id}`, {
          method: 'DELETE',
        });
      } catch (apiError) {
        // Continue with local deletion
      }

      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting assignment:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAssignmentsForDateAndStaff = (date, staffId) => {
    const dateKey = formatDateKey(date);
    return assignments.filter((assignment) => 
      assignment.date === dateKey && String(assignment.staff_id) === String(staffId)
    );
  };

  const getStaffDailyHours = (date, staffId) => {
    const dayAssignments = getAssignmentsForDateAndStaff(date, staffId);
    return dayAssignments.reduce((total, assignment) => {
      if (assignment.type === "job" && assignment.estimated_hours) {
        const h = typeof assignment.estimated_hours === "string" ? parseFloat(assignment.estimated_hours) : (assignment.estimated_hours || 0);
        return total + (isNaN(h) ? 0 : h);
      }
      return total;
    }, 0);
  };

  const isOverbooked = (date, staffId) => {
    return getStaffDailyHours(date, staffId) > 8;
  };

  const getAssignmentColor = (assignment) => {
    switch (assignment.type) {
      case "off":
        return "bg-gray-200 text-gray-800 border-gray-300";
      case "delivery":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "note":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "job":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getAssignmentIcon = (type) => {
    switch (type) {
      case "off":
        return <Icons.Coffee />;
      case "delivery":
        return <Icons.Truck />;
      case "note":
        return <Icons.Calendar />;
      case "job":
        return <Icons.Briefcase />;
      default:
        return null;
    }
  };

  const getMemberColor = (memberId) => {
    return TEAM_MEMBER_COLORS[memberId % TEAM_MEMBER_COLORS.length];
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.staff_id || !newAssignment.date || !newAssignment.type) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createAssignment(newAssignment);
      setShowAddDialog(false);
      setNewAssignment({
        type: "job",
        start_time: "09:00",
        end_time: "17:00",
        priority: "Medium",
        status: "Scheduled",
        estimated_hours: 8,
      });
    } catch (err) {
      alert(err.message || 'Failed to create assignment');
    }
  };

  const handleEditAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      await updateAssignment(selectedAssignment.id, selectedAssignment);
      setShowEditDialog(false);
      setSelectedAssignment(null);
    } catch (err) {
      alert(err.message || 'Failed to update assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await deleteAssignment(assignmentId);
      setShowEditDialog(false);
      setSelectedAssignment(null);
    } catch (err) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  const handleDragStart = (assignment) => {
    setDraggedAssignment(assignment);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, date, staffId) => {
    e.preventDefault();
    if (!draggedAssignment) return;
    
    const dateKey = formatDateKey(date);
    
    try {
      await updateAssignment(draggedAssignment.id, {
        date: dateKey,
        staff_id: staffId,
      });
      setDraggedAssignment(null);
    } catch (err) {
      alert(err.message || 'Failed to move assignment');
      setDraggedAssignment(null);
    }
  };

  const computeBlockHeight = (hours) => {
    const hNum = typeof hours === "string" ? parseFloat(hours) : (hours || 0);
    if (!hNum || isNaN(hNum)) return 28;
    const h = Math.max(28, Math.min(120, Math.round((hNum / 8) * 120)));
    return h;
  };

  const gridTemplateColumns = `220px repeat(${calendarDays.length}, 160px)`;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Icons.Loader2 />
          <span>Loading schedule...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icons.AlertTriangle />
          <h3 className="text-lg font-medium text-red-900 mb-2 mt-4">Error Loading Schedule</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <Icons.ChevronLeft />
            </Button>
            <span className="text-lg font-medium px-4">{formatMonthYear(currentDate)}</span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <Icons.ChevronRight />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
            <Icons.RefreshCw />
            <span className="ml-2">Refresh</span>
          </Button>
          <Button onClick={() => setShowAddDialog(true)} disabled={isStaff}>
            <Icons.Plus />
            <span className="ml-2">Add Assignment</span>
          </Button>
        </div>
      </div>

      {/* View-Only Banner for Staff */}
      {isStaff && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center space-x-2">
            <Icons.Eye />
            <span className="text-sm font-medium text-blue-800">
              View Only Mode - You can only view your own schedule
            </span>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="border rounded-lg overflow-auto shadow-sm">
          <div className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <div className="grid" style={{ gridTemplateColumns }}>
              <div className="p-3 border-r border-gray-200 font-medium text-sm text-gray-900 bg-gray-50 sticky left-0 z-20">
                Team Member
              </div>
              {calendarDays.map((day, idx) => (
                <div key={idx} className="p-3 border-r border-gray-200 text-center min-w-[140px]">
                  <div className="text-xs font-medium text-gray-900">{formatDate(day)}</div>
                  <div className="text-xs text-gray-500">{day.getDate()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {visibleTeamMembers.map((member) => (
              <div key={member.id} className="grid" style={{ gridTemplateColumns }}>
                <div className="p-3 border-r border-gray-200 bg-white sticky left-0 z-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getMemberColor(member.id) }} />
                    <div>
                      <div className="font-medium text-sm text-gray-900">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                    </div>
                  </div>
                </div>

                {calendarDays.map((day, dayIndex) => {
                  const dayKey = formatDateKey(day);
                  const dayAssignments = getAssignmentsForDateAndStaff(day, member.id.toString());
                  const dailyHours = getStaffDailyHours(day, member.id.toString());
                  const overbooked = isOverbooked(day, member.id.toString());

                  return (
                    <div
                      key={dayIndex}
                      className="p-2 border-r border-gray-200 min-h-[96px] relative bg-white"
                      onDragOver={!isStaff ? handleDragOver : undefined}
                      onDrop={!isStaff ? (e) => handleDrop(e, day, member.id.toString()) : undefined}
                    >
                      {overbooked && (
                        <div className="absolute top-1 right-1">
                          <Icons.AlertTriangle />
                        </div>
                      )}

                      {dailyHours > 0 && <div className="absolute bottom-1 right-1 text-xs text-gray-500">{dailyHours}h</div>}

                      <div className="flex flex-col space-y-2">
                        {dayAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className={`relative rounded-md text-xs border p-2 ${isStaff ? 'cursor-default' : 'cursor-pointer'} ${getAssignmentColor(assignment)}`}
                            draggable={!isStaff}
                            onDragStart={() => !isStaff && handleDragStart(assignment)}
                            onClick={() => {
                              if (!isStaff) {
                                setSelectedAssignment(assignment);
                                setShowEditDialog(true);
                              }
                            }}
                            style={{ height: computeBlockHeight(assignment.estimated_hours) }}
                            title={assignment.title}
                          >
                            <div className="flex items-start space-x-2">
                              <div className="flex-shrink-0 mt-[2px]">{getAssignmentIcon(assignment.type)}</div>
                              <div className="flex-1 truncate">
                                <div className="font-medium text-[12px] truncate">{assignment.title}</div>
                                <div className="text-[11px] text-gray-600">
                                  {assignment.type === "job" && assignment.start_time 
                                    ? `${assignment.start_time} · ${assignment.estimated_hours || ""}h` 
                                    : assignment.notes || assignment.type}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {!isStaff && (
                          <div className="pt-1">
                            <button
                              className="text-xs text-gray-400 hover:text-gray-700"
                              onClick={() => {
                                setNewAssignment({ 
                                  type: "job", 
                                  staff_id: member.id.toString(), 
                                  date: dayKey, 
                                  estimated_hours: 8, 
                                  start_time: "09:00", 
                                  end_time: "17:00",
                                  priority: "Medium",
                                  status: "Scheduled"
                                });
                                setShowAddDialog(true);
                              }}
                            >
                              + Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
            <span>Job</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded" />
            <span>Day Off</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
            <span>Delivery</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
            <span>Note</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icons.AlertTriangle />
            <span>Overbooked (8+ hours)</span>
          </div>
        </div>
      </div>

      {/* Add Assignment Modal */}
      <Modal 
        isOpen={showAddDialog} 
        onClose={() => setShowAddDialog(false)}
        title="Add Assignment"
        description="Schedule a new assignment for a team member."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select 
              value={newAssignment.type} 
              onChange={(value) => setNewAssignment({ ...newAssignment, type: value })}
            >
              <option value="job">Job</option>
              <option value="off">Day Off</option>
              <option value="delivery">Delivery</option>
              <option value="note">Note</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Team Member</Label>
            <Select
              value={newAssignment.staff_id?.toString() || ''}
              onChange={(value) => setNewAssignment({ ...newAssignment, staff_id: value })}
            >
              <option value="">Select team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id.toString()}>
                  {member.name} ({member.role})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input 
              type="date" 
              value={newAssignment.date || ''} 
              onChange={(e) => setNewAssignment({ ...newAssignment, date: e.target.value })} 
            />
          </div>

          {newAssignment.type === "job" && (
            <>
              <div className="space-y-2">
                <Label>Job (Optional)</Label>
                <Select 
                  value={newAssignment.job_id || ''} 
                  onChange={(value) => {
                    const job = availableJobs.find(j => j.id === value);
                    setNewAssignment({ 
                      ...newAssignment, 
                      job_id: value, 
                      customer_id: job?.customer_id 
                    });
                  }}
                >
                  <option value="">Select existing job</option>
                  {availableJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_reference} - {job.customer_name}
                    </option>
                  ))}
                </Select>
              </div>

              {!newAssignment.job_id && (
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select 
                    value={newAssignment.customer_id || ''} 
                    onChange={(value) => setNewAssignment({ ...newAssignment, customer_id: value })}
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input 
                    type="time" 
                    value={newAssignment.start_time || ''} 
                    onChange={(e) => setNewAssignment({ ...newAssignment, start_time: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input 
                    type="time" 
                    value={newAssignment.end_time || ''} 
                    onChange={(e) => setNewAssignment({ ...newAssignment, end_time: e.target.value })} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estimated Hours</Label>
                <Input 
                  type="number" 
                  step="0.5" 
                  value={newAssignment.estimated_hours || ''} 
                  onChange={(e) => setNewAssignment({ ...newAssignment, estimated_hours: parseFloat(e.target.value) })} 
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newAssignment.priority || 'Medium'} 
                  onChange={(value) => setNewAssignment({ ...newAssignment, priority: value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </Select>
              </div>
            </>
          )}

          {(newAssignment.type === "note" || newAssignment.type === "delivery") && (
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea 
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                value={newAssignment.notes || ''} 
                onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })} 
                placeholder="Enter notes..." 
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAssignment} disabled={saving}>
              {saving && <Icons.Loader2 />}
              <span className="ml-2">Add Assignment</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal 
        isOpen={showEditDialog} 
        onClose={() => setShowEditDialog(false)}
        title="Edit Assignment"
        description="Modify or delete this assignment."
      >
        {selectedAssignment && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={selectedAssignment.type} 
                onChange={(value) => setSelectedAssignment({ ...selectedAssignment, type: value })}
              >
                <option value="job">Job</option>
                <option value="off">Day Off</option>
                <option value="delivery">Delivery</option>
                <option value="note">Note</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team Member</Label>
              <Select 
                value={String(selectedAssignment.staff_id)} 
                onChange={(value) => setSelectedAssignment({ ...selectedAssignment, staff_id: value })}
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id.toString()}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={selectedAssignment.date} 
                onChange={(e) => setSelectedAssignment({ ...selectedAssignment, date: e.target.value })} 
              />
            </div>

            {selectedAssignment.type === "job" && (
              <>
                <div className="space-y-2">
                  <Label>Estimated Hours</Label>
                  <Input 
                    type="number" 
                    step="0.5" 
                    value={selectedAssignment.estimated_hours || ''} 
                    onChange={(e) => setSelectedAssignment({ ...selectedAssignment, estimated_hours: parseFloat(e.target.value) })} 
                  />
                </div>
              </>
            )}

            {(selectedAssignment.type === "note" || selectedAssignment.type === "delivery") && (
              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea 
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={selectedAssignment.notes || ''} 
                  onChange={(e) => setSelectedAssignment({ ...selectedAssignment, notes: e.target.value })} 
                  placeholder="Enter notes..." 
                />
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteAssignment(selectedAssignment.id)} 
                disabled={saving}
              >
                <Icons.Trash2 />
                <span className="ml-2">Delete</span>
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditAssignment} disabled={saving}>
                  {saving && <Icons.Loader2 />}
                  <span className="ml-2">Save Changes</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}