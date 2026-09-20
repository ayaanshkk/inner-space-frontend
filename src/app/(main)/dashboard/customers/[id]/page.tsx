"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Edit, FileText, Plus, Receipt, DollarSign,
  Trash2, AlertCircle, Eye, Package, Image, Upload,
  Briefcase, CheckSquare, MapPin, Calendar, User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================
// CONFIG & ROLES
// ============================================================
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const hasRole = (roleIds: string | undefined, ...ids: number[]): boolean => {
  if (!roleIds) return false;
  return roleIds.split(",").map((r) => parseInt(r.trim(), 10)).some((id) => ids.includes(id));
};
const isManagerOrHR = (r?: string) => hasRole(r, 1, 2);
const isSales       = (r?: string) => hasRole(r, 3);
const isStaff       = (r?: string) => hasRole(r, 5);

// ============================================================
// TYPES
// ============================================================
interface Project {
  id: string;
  project_name: string;
  stage: string;
  service_id?: number;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  salesperson?: string;
  stage: string;
  status: string;
  notes?: string;
  created_at: string;
  assigned_employee_id?: string | number;
}

interface DrawingDocument {
  id: string;
  filename: string;
  url: string;
  type: string;
  created_at: string;
}

interface FormDocument {
  id: string;
  filename: string;
  url: string;
  type: string;
  created_at: string;
  customer_id: string;
}

interface FinancialDocument {
  id: string;
  type: string;
  title: string;
  total?: number;
  amount_paid?: number;
  balance?: number;
  created_at: string;
}

// ============================================================
// CONSTANTS
// ============================================================
const PROJECT_STAGES = [
  "Not Started","Lead","Quote","Consultation","Survey","Measure",
  "Design","Quoted","Accepted","Rejected","Production","Delivery",
  "Installation","Complete","Remedial","Cancelled",
];

const STAGE_COLORS: Record<string, string> = {
  Complete:     "bg-green-100 text-green-800",
  Accepted:     "bg-purple-100 text-purple-800",
  Production:   "bg-purple-100 text-purple-800",
  Installation: "bg-orange-100 text-orange-800",
  Measure:      "bg-yellow-100 text-yellow-800",
  Survey:       "bg-yellow-100 text-yellow-800",
  Rejected:     "bg-red-100 text-red-600",
  Cancelled:    "bg-red-100 text-red-600",
  Lead:         "bg-gray-100 text-gray-700",
};
const stageColor = (s: string) => STAGE_COLORS[s] || "bg-blue-100 text-blue-800";

const FINANCIAL_ICONS: Record<string, React.ReactNode> = {
  invoice:  <FileText className="h-4 w-4 text-blue-600" />,
  proforma: <FileText className="h-4 w-4 text-indigo-600" />,
  receipt:  <Receipt  className="h-4 w-4 text-green-600" />,
  deposit:  <Receipt  className="h-4 w-4 text-emerald-600" />,
  final:    <Receipt  className="h-4 w-4 text-teal-600" />,
  terms:    <DollarSign className="h-4 w-4 text-purple-600" />,
};

const DRAWING_ICONS: Record<string, React.ReactNode> = {
  pdf:   <FileText className="h-4 w-4 text-red-600" />,
  image: <Image    className="h-4 w-4 text-green-600" />,
  other: <FileText className="h-4 w-4 text-gray-600" />,
};

const FORM_ICONS: Record<string, React.ReactNode> = {
  excel: <FileText className="h-4 w-4 text-green-600" />,
  pdf:   <FileText className="h-4 w-4 text-red-600" />,
  other: <FileText className="h-4 w-4 text-gray-600" />,
};

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T00:00:00") : new Date(d);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return d; }
};

type Tab = "info" | "checklists" | "drawings" | "projects" | "financial";

// ============================================================
// COMPONENT
// ============================================================
export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const fileInputRef     = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("info");

  // Data
  const [customer, setCustomer]           = useState<Customer | null>(null);
  const [projects, setProjects]           = useState<Project[]>([]);
  const [drawingDocs, setDrawingDocs]     = useState<DrawingDocument[]>([]);
  const [formDocs, setFormDocs]           = useState<FormDocument[]>([]);
  const [financialDocs, setFinancialDocs] = useState<FinancialDocument[]>([]);
  const [loading, setLoading]             = useState(true);
  const [hasAccess, setHasAccess]         = useState(true);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Drawings
  const [selectedDrawings, setSelectedDrawings]             = useState<Set<string>>(new Set());
  const [showBulkDeleteDrawings, setShowBulkDeleteDrawings] = useState(false);
  const [drawingToDelete, setDrawingToDelete]               = useState<DrawingDocument | null>(null);
  const [showDeleteDrawing, setShowDeleteDrawing]           = useState(false);
  const [isDeletingDrawing, setIsDeletingDrawing]           = useState(false);
  const [isBulkDeleting, setIsBulkDeleting]                 = useState(false);

  // Form docs
  const [selectedFormDocs, setSelectedFormDocs]               = useState<Set<string>>(new Set());
  const [showBulkDeleteFormDocs, setShowBulkDeleteFormDocs]   = useState(false);
  const [formDocToDelete, setFormDocToDelete]                 = useState<FormDocument | null>(null);
  const [showDeleteFormDoc, setShowDeleteFormDoc]             = useState(false);
  const [isDeletingFormDoc, setIsDeletingFormDoc]             = useState(false);

  // Projects
  const [selectedProject, setSelectedProject]   = useState<Project | null>(null);
  const [showEditProject, setShowEditProject]   = useState(false);
  const [editProjectData, setEditProjectData]   = useState<Partial<Project>>({});
  const [isSavingProject, setIsSavingProject]   = useState(false);
  const [projectToDelete, setProjectToDelete]   = useState<Project | null>(null);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Coming soon
  const [showComingSoon, setShowComingSoon] = useState(false);

  // ── HEADERS ────────────────────────────────────────────────
  const getHeaders = (): HeadersInit => {
    const token    = localStorage.getItem("auth_token");
    const tenantId = localStorage.getItem("tenant_id") ?? user?.tenant_id ?? "";
    return { Authorization: `Bearer ${token}`, "X-Tenant-ID": String(tenantId), "Content-Type": "application/json" };
  };
  const getMultipartHeaders = (): HeadersInit => {
    const token    = localStorage.getItem("auth_token");
    const tenantId = localStorage.getItem("tenant_id") ?? user?.tenant_id ?? "";
    return { Authorization: `Bearer ${token}`, "X-Tenant-ID": String(tenantId) };
  };

  // ── PERMISSIONS ────────────────────────────────────────────
  const canEdit           = () => !isStaff(user?.role_ids);
  const canDelete         = () => isManagerOrHR(user?.role_ids);
  const canManageProjects = () => !isStaff(user?.role_ids);

  // ── LOAD ───────────────────────────────────────────────────
  useEffect(() => { if (id) loadAll(); }, [id]);

  const loadAll = () => {
    setLoading(true);
    const h = getHeaders();

    const cP = fetch(`${BACKEND_URL}/customers/${id}`, { headers: h })
      .then((r) => r.json())
      .then((data) => {
        if (isSales(user?.role_ids) && !isManagerOrHR(user?.role_ids)) {
          const ok =
            String(data.assigned_employee_id || "").trim() === String(user?.employee_id || "").trim() ||
            (data.salesperson || "").toLowerCase() === (user?.employee_name || "").toLowerCase();
          if (!ok) { setHasAccess(false); return; }
        }
        setCustomer({ ...data, postcode: data.post_code ?? data.postcode ?? "" });
      })
      .catch(console.error);

    const pP = fetch(`${BACKEND_URL}/customers/${id}/projects`, { headers: h })
      .then((r) => r.json())
      .then((data) => setProjects(data.projects || []))
      .catch(console.error);

    fetch(`${BACKEND_URL}/drawings?customer_id=${id}`, { headers: h })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setDrawingDocs(Array.isArray(d) ? d : []))
      .catch(() => setDrawingDocs([]));

    fetch(`${BACKEND_URL}/files/forms?customer_id=${id}`, { headers: h })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setFormDocs(Array.isArray(d) ? d : []))
      .catch(() => setFormDocs([]));

    fetch(`${BACKEND_URL}/invoices?customer_id=${id}`, { headers: h })
      .then((r) => r.ok ? r.json() : [])
      .then((invoices: any[]) => setFinancialDocs(
        invoices.map((inv) => ({
          id: inv.id, type: "invoice", title: `Invoice #${inv.id}`,
          total: parseFloat(inv.total) || undefined,
          amount_paid: parseFloat(inv.amount_paid) || undefined,
          balance: parseFloat(inv.balance) || undefined,
          created_at: inv.created_at,
        }))
      ))
      .catch(() => setFinancialDocs([]));

    Promise.all([cP, pP]).finally(() => setLoading(false));
  };

  // ── STAGE UPDATE — available to ALL roles ──────────────────
  const handleStageChange = async (newStage: string) => {
    if (!customer || isUpdatingStage) return;
    setIsUpdatingStage(true);
    try {
      const res = await fetch(`${BACKEND_URL}/customers/${id}/stage`, {
        method: "PATCH", headers: getHeaders(), body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error();
      setCustomer((p) => p ? { ...p, stage: newStage } : p);
    } catch { alert("Error updating stage"); }
    finally { setIsUpdatingStage(false); }
  };

  // ── DRAWINGS ───────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    for (const file of Array.from(e.target.files)) {
      const fd = new FormData(); fd.append("file", file); fd.append("customer_id", id);
      const res = await fetch(`${BACKEND_URL}/drawings`, { method: "POST", headers: getMultipartHeaders(), body: fd });
      if (res.ok) {
        const data = await res.json();
        setDrawingDocs((prev) => [...prev, {
          id: data.drawing?.id, filename: data.drawing?.filename || file.name,
          url: data.drawing?.url || "", type: data.drawing?.type || "other",
          created_at: data.drawing?.created_at || new Date().toISOString(),
        }].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    }
    if (e.target) e.target.value = "";
  };

  const confirmDeleteDrawing = async () => {
    if (!drawingToDelete) return;
    setIsDeletingDrawing(true);
    const res = await fetch(`${BACKEND_URL}/drawings/${drawingToDelete.id}`, { method: "DELETE", headers: getHeaders() });
    if (res.ok) { setDrawingDocs((p) => p.filter((d) => d.id !== drawingToDelete.id)); setShowDeleteDrawing(false); }
    setIsDeletingDrawing(false);
  };

  const confirmBulkDeleteDrawings = async () => {
    setIsBulkDeleting(true);
    await Promise.all(Array.from(selectedDrawings).map((did) =>
      fetch(`${BACKEND_URL}/drawings/${did}`, { method: "DELETE", headers: getHeaders() })
    ));
    setDrawingDocs((p) => p.filter((d) => !selectedDrawings.has(d.id)));
    setSelectedDrawings(new Set()); setShowBulkDeleteDrawings(false); setIsBulkDeleting(false);
  };

  // ── FORM DOCS ──────────────────────────────────────────────
  const handleFormFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    for (const file of Array.from(e.target.files)) {
      const fd = new FormData(); fd.append("file", file); fd.append("customer_id", id);
      const res = await fetch(`${BACKEND_URL}/files/forms`, { method: "POST", headers: getMultipartHeaders(), body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormDocs((prev) => [...prev, {
          id: data.form_document?.id, filename: data.form_document?.filename || file.name,
          url: data.form_document?.url || "", type: data.form_document?.type || "other",
          created_at: data.form_document?.created_at || new Date().toISOString(), customer_id: id,
        }].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    }
    if (e.target) e.target.value = "";
  };

  const confirmDeleteFormDoc = async () => {
    if (!formDocToDelete) return;
    setIsDeletingFormDoc(true);
    const res = await fetch(`${BACKEND_URL}/files/forms/${formDocToDelete.id}`, { method: "DELETE", headers: getHeaders() });
    if (res.ok) { setFormDocs((p) => p.filter((d) => d.id !== formDocToDelete.id)); setShowDeleteFormDoc(false); }
    setIsDeletingFormDoc(false);
  };

  const confirmBulkDeleteFormDocs = async () => {
    setIsBulkDeleting(true);
    await Promise.all(Array.from(selectedFormDocs).map((did) =>
      fetch(`${BACKEND_URL}/files/forms/${did}`, { method: "DELETE", headers: getHeaders() })
    ));
    setFormDocs((p) => p.filter((d) => !selectedFormDocs.has(d.id)));
    setSelectedFormDocs(new Set()); setShowBulkDeleteFormDocs(false); setIsBulkDeleting(false);
  };

  // ── PROJECTS ───────────────────────────────────────────────
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || isSavingProject) return;
    setIsSavingProject(true);
    try {
      const res = await fetch(`${BACKEND_URL}/projects/${selectedProject.id}`, {
        method: "PUT", headers: getHeaders(), body: JSON.stringify(editProjectData),
      });
      if (!res.ok) throw new Error();
      setProjects((p) => p.map((proj) => proj.id === selectedProject.id ? { ...proj, ...editProjectData } : proj));
      setShowEditProject(false);
    } catch { alert("Failed to update project"); }
    finally { setIsSavingProject(false); }
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete || isDeletingProject) return;
    setIsDeletingProject(true);
    try {
      const res = await fetch(`${BACKEND_URL}/projects/${projectToDelete.id}`, { method: "DELETE", headers: getHeaders() });
      if (!res.ok) throw new Error();
      setProjects((p) => p.filter((proj) => proj.id !== projectToDelete.id));
      setShowDeleteProject(false);
    } catch { alert("Failed to delete project"); }
    finally { setIsDeletingProject(false); }
  };

  // ── GUARDS ─────────────────────────────────────────────────
  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!hasAccess) return (
    <div className="min-h-screen bg-white p-8 text-center">
      <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
      <h2 className="mb-2 text-xl font-semibold">Access Denied</h2>
      <Button onClick={() => router.push("/dashboard/customers")}>Return to Customers</Button>
    </div>
  );
  if (!customer) return <div className="p-8">Customer not found.</div>;

  // ── TABS ───────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "info",       label: "Customer Information", icon: <User className="h-4 w-4" /> },
    { key: "checklists", label: "Checklists",            icon: <CheckSquare className="h-4 w-4" /> },
    { key: "drawings",   label: "Drawings & Layouts",    icon: <Image className="h-4 w-4" /> },
    { key: "projects",   label: `Projects (${projects.length})`, icon: <Package className="h-4 w-4" /> },
    { key: "financial",  label: "Financial Documents",   icon: <DollarSign className="h-4 w-4" /> },
  ];

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange}
        accept=".pdf,image/*" multiple style={{ display: "none" }} />
      <input type="file" ref={formFileInputRef} onChange={handleFormFileChange}
        accept=".pdf,.xlsx,.xls,.csv" multiple style={{ display: "none" }} />

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/customers")}
              className="text-gray-400 hover:text-gray-700 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Details</h1>
              <p className="text-sm text-gray-400 mt-0.5">ID: {customer.id}</p>
            </div>
          </div>

          {/* Header action buttons — matching screenshot exactly */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => formFileInputRef.current?.click()}
              className="flex items-center gap-2 border-gray-300"
            >
              <CheckSquare className="h-4 w-4" />
              Add Checklist
            </Button>

            {canManageProjects() && (
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/projects/create?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`)}
                className="flex items-center gap-2 border-gray-300"
              >
                <Plus className="h-4 w-4" />
                Add New Project
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowComingSoon(true)}
              className="flex items-center gap-2 border-gray-300"
            >
              <DollarSign className="h-4 w-4" />
              Add Financial Document
            </Button>

            {canEdit() && (
              <Button
                onClick={() => router.push(`/dashboard/customers/${id}/edit`)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}

            {canDelete() && (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!window.confirm("Delete this customer? This cannot be undone.")) return;
                  await fetch(`${BACKEND_URL}/customers/${id}`, { method: "DELETE", headers: getHeaders() });
                  router.push("/dashboard/customers");
                }}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── TABS — pill style matching screenshot ── */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white border border-gray-200 rounded-lg shadow-sm text-gray-900 mx-1 my-2"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="px-8 py-6">

        {/* ── CUSTOMER INFORMATION ── */}
        {activeTab === "info" && (
          <div className="rounded-xl bg-white border border-gray-200 p-8">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Contact Information</h2>
            <div className="space-y-8">

              {/* Row 1 */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Name</p>
                  <p className="font-medium text-gray-900">{customer.name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </p>
                  <p className="text-gray-900">{customer.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <p className="text-gray-900">{customer.email || "—"}</p>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Address <span className="text-red-500">*</span>
                  </p>
                  <p className="text-gray-900">{customer.address || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Postcode <span className="text-red-500">*</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {customer.postcode ? (
                      <>
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-sm text-gray-800">
                          {customer.postcode}
                        </span>
                      </>
                    ) : "—"}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Preferred Contact</p>
                  <p className="text-gray-900">—</p>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Project Type</p>
                  <p className="text-gray-900">—</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Pipeline Stage</p>
                  {/* Stage dropdown — available to ALL users */}
                  <Select
                    value={customer.stage || "Lead"}
                    onValueChange={handleStageChange}
                    disabled={isUpdatingStage}
                  >
                    <SelectTrigger className="w-36 h-8 text-sm border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STAGES.map((s) => (
                        <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Customer Since</p>
                  <p className="text-gray-900">{formatDate(customer.created_at)}</p>
                </div>
              </div>

              {customer.notes && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Notes</p>
                  <div className="rounded-lg bg-gray-50 p-3 text-sm whitespace-pre-wrap text-gray-900">
                    {customer.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CHECKLISTS ── */}
        {activeTab === "checklists" && (
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Checklists</h2>
              {canEdit() && (
                <Button onClick={() => formFileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4" />Upload Document
                </Button>
              )}
            </div>

            {formDocs.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Uploaded Documents ({formDocs.length})</p>
                  {canEdit() && (
                    <div className="flex items-center gap-2">
                      {selectedFormDocs.size > 0 && (
                        <>
                          <Button variant="destructive" size="sm"
                            onClick={() => setShowBulkDeleteFormDocs(true)}>
                            <Trash2 className="mr-1 h-3 w-3" />Delete ({selectedFormDocs.size})
                          </Button>
                          <Button variant="outline" size="sm"
                            onClick={() => setSelectedFormDocs(new Set())}>Clear</Button>
                        </>
                      )}
                      <Checkbox
                        checked={selectedFormDocs.size === formDocs.length && formDocs.length > 0}
                        onCheckedChange={() =>
                          setSelectedFormDocs(selectedFormDocs.size === formDocs.length
                            ? new Set() : new Set(formDocs.map((d) => d.id)))
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {formDocs.map((doc) => {
                    const ext = doc.filename.split(".").pop()?.toLowerCase() || "";
                    const t   = doc.type || (ext === "pdf" ? "pdf" : ["xlsx","xls","csv"].includes(ext) ? "excel" : "other");
                    return (
                      <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm">
                        {canEdit() && (
                          <Checkbox checked={selectedFormDocs.has(doc.id)}
                            onCheckedChange={() => {
                              const s = new Set(selectedFormDocs);
                              s.has(doc.id) ? s.delete(doc.id) : s.add(doc.id);
                              setSelectedFormDocs(s);
                            }} />
                        )}
                        <div className="rounded-lg bg-green-50 p-2">{FORM_ICONS[t]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-sm text-gray-900">{doc.filename}</p>
                          <p className="text-xs text-gray-500">{formatDate(doc.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm"
                            onClick={() => window.open(
                              doc.url?.startsWith("http") ? doc.url : `${BACKEND_URL}/${doc.url?.replace(/^\//, "")}`, "_blank"
                            )}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit() && (
                            <Button variant="outline" size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => { setFormDocToDelete(doc); setShowDeleteFormDoc(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-16 text-center">
                <CheckSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500 mb-1">No checklists or documents yet.</p>
                <p className="text-sm text-gray-400">Upload documents using the button above.</p>
              </div>
            )}
          </div>
        )}

        {/* ── DRAWINGS & LAYOUTS ── */}
        {activeTab === "drawings" && (
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Drawings & Layouts</h2>
              <div className="flex items-center gap-2">
                {canEdit() && selectedDrawings.size > 0 && (
                  <>
                    <Button variant="destructive" size="sm"
                      onClick={() => setShowBulkDeleteDrawings(true)}>
                      <Trash2 className="mr-1 h-3 w-3" />Delete ({selectedDrawings.size})
                    </Button>
                    <Button variant="outline" size="sm"
                      onClick={() => setSelectedDrawings(new Set())}>Clear</Button>
                  </>
                )}
                {canEdit() && drawingDocs.length > 0 && (
                  <Checkbox
                    checked={selectedDrawings.size === drawingDocs.length && drawingDocs.length > 0}
                    onCheckedChange={() =>
                      setSelectedDrawings(selectedDrawings.size === drawingDocs.length
                        ? new Set() : new Set(drawingDocs.map((d) => d.id)))
                    }
                  />
                )}
                {canEdit() && (
                  <Button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                    <Upload className="h-4 w-4" />Upload File
                  </Button>
                )}
              </div>
            </div>

            {drawingDocs.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {drawingDocs.map((doc) => {
                  const ext = doc.filename.split(".").pop()?.toLowerCase() || "";
                  const t   = doc.type || (ext === "pdf" ? "pdf" : ["png","jpg","jpeg","gif"].includes(ext) ? "image" : "other");
                  return (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm">
                      {canEdit() && (
                        <Checkbox checked={selectedDrawings.has(doc.id)}
                          onCheckedChange={() => {
                            const s = new Set(selectedDrawings);
                            s.has(doc.id) ? s.delete(doc.id) : s.add(doc.id);
                            setSelectedDrawings(s);
                          }} />
                      )}
                      <div className="rounded-lg bg-gray-100 p-2">{DRAWING_ICONS[t]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-sm text-gray-900">{doc.filename}</p>
                        <p className="text-xs text-gray-500">{formatDate(doc.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm"
                          onClick={() => window.open(
                            doc.url?.startsWith("http") ? doc.url : `${BACKEND_URL}/${doc.url?.replace(/^\//, "")}`, "_blank"
                          )}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit() && (
                          <Button variant="outline" size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => { setDrawingToDelete(doc); setShowDeleteDrawing(true); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
                <Image className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500 mb-1">No drawings or layouts yet.</p>
                <p className="text-sm text-gray-400">Upload CADs, sketches, photos, or client documentation.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PROJECTS ── */}
        {activeTab === "projects" && (
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Projects ({projects.length})</h2>
              {canManageProjects() && (
                <Button
                  onClick={() => router.push(`/dashboard/projects/create?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`)}
                  className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />New Opportunity
                </Button>
              )}
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {[...projects]
                  .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((p) => (
                    <div key={p.id} className="rounded-lg border bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="h-4 w-4 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">{p.project_name}</h3>
                          </div>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${stageColor(p.stage)}`}>
                            {p.stage}
                          </span>
                          <p className="mt-2 text-xs text-gray-500">
                            <Calendar className="mr-1 inline h-3 w-3" />
                            {formatDate(p.created_at)}
                          </p>
                        </div>
                        {canManageProjects() && (
                          <div className="flex flex-col gap-1 ml-4">
                            <Button variant="default" size="sm"
                              onClick={() => {
                                setSelectedProject(p);
                                setEditProjectData({ project_name: p.project_name, stage: p.stage });
                                setShowEditProject(true);
                              }}>
                              <Edit className="h-3 w-3 mr-1" />Edit
                            </Button>
                            <Button variant="destructive" size="sm"
                              onClick={() => { setProjectToDelete(p); setShowDeleteProject(true); }}>
                              <Trash2 className="h-3 w-3 mr-1" />Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-16 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">No projects yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── FINANCIAL DOCUMENTS ── */}
        {activeTab === "financial" && (
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Financial Documents</h2>
              <Button variant="outline" onClick={() => setShowComingSoon(true)}
                className="flex items-center gap-2">
                <Plus className="h-4 w-4" />Add Financial Document
              </Button>
            </div>

            {financialDocs.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {financialDocs.map((doc) => (
                  <div key={doc.id} className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-lg bg-blue-50 p-2">{FINANCIAL_ICONS[doc.type]}</div>
                        <div>
                          <p className="font-semibold text-gray-900">{doc.title}</p>
                          <p className="text-xs text-gray-500">{formatDate(doc.created_at)}</p>
                          {doc.total != null && (
                            <p className="mt-1 text-sm font-medium text-blue-600">£{doc.total.toFixed(2)}</p>
                          )}
                          {doc.balance != null && doc.balance > 0 && (
                            <p className="text-sm text-red-600">Balance: £{doc.balance.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm"
                        onClick={() => router.push(`/dashboard/invoices/${doc.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-16 text-center">
                <DollarSign className="mx-auto mb-4 h-14 w-14 text-blue-300" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No Financial Documents</h3>
                <p className="text-gray-500 mb-6">Financial document creation is coming soon.</p>
                <Button variant="outline" onClick={() => setShowComingSoon(true)}>
                  Add Financial Document
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DIALOGS ── */}

      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Coming Soon</DialogTitle>
            <DialogDescription className="text-center">
              Financial document creation is currently in development and will be available soon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center">
            <Button onClick={() => setShowComingSoon(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditProject} onOpenChange={setShowEditProject}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Opportunity</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveProject}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Name</Label>
                <Input className="col-span-3" value={editProjectData.project_name || ""}
                  onChange={(e) => setEditProjectData((p) => ({ ...p, project_name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Stage</Label>
                <Select value={editProjectData.stage || "Not Started"}
                  onValueChange={(v) => setEditProjectData((p) => ({ ...p, stage: v }))}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditProject(false)}>Cancel</Button>
              <Button type="submit" disabled={isSavingProject}>{isSavingProject ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteProject} onOpenChange={setShowDeleteProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Opportunity</DialogTitle>
            <DialogDescription>Delete <strong>{projectToDelete?.project_name}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteProject(false)} disabled={isDeletingProject}>Cancel</Button>
            <Button onClick={handleConfirmDeleteProject} disabled={isDeletingProject} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeletingProject ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDrawing} onOpenChange={setShowDeleteDrawing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Drawing</DialogTitle>
            <DialogDescription>Delete <strong>{drawingToDelete?.filename}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDrawing(false)} disabled={isDeletingDrawing}>Cancel</Button>
            <Button onClick={confirmDeleteDrawing} disabled={isDeletingDrawing} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeletingDrawing ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkDeleteDrawings} onOpenChange={setShowBulkDeleteDrawings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedDrawings.size} Drawing(s)</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDrawings(false)} disabled={isBulkDeleting}>Cancel</Button>
            <Button onClick={confirmBulkDeleteDrawings} disabled={isBulkDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isBulkDeleting ? "Deleting..." : `Delete ${selectedDrawings.size} Files`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteFormDoc} onOpenChange={setShowDeleteFormDoc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>Delete <strong>{formDocToDelete?.filename}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteFormDoc(false)} disabled={isDeletingFormDoc}>Cancel</Button>
            <Button onClick={confirmDeleteFormDoc} disabled={isDeletingFormDoc} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeletingFormDoc ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkDeleteFormDocs} onOpenChange={setShowBulkDeleteFormDocs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedFormDocs.size} Document(s)</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteFormDocs(false)} disabled={isBulkDeleting}>Cancel</Button>
            <Button onClick={confirmBulkDeleteFormDocs} disabled={isBulkDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isBulkDeleting ? "Deleting..." : `Delete ${selectedFormDocs.size} Files`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}