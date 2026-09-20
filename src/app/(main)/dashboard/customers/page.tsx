"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Edit, Trash2, ChevronDown, Filter,
  AlertCircle, FolderOpen, ChevronRight, ChevronLeft,
  ChevronLast, ChevronFirst,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================
// CONFIG
// ============================================================
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const CUSTOMERS_PER_PAGE = 25;

// ============================================================
// ROLE HELPERS
// ============================================================
const hasRole = (roleIds: string | undefined, ...ids: number[]): boolean => {
  if (!roleIds) return false;
  const userRoles = roleIds.split(",").map((r) => parseInt(r.trim(), 10));
  return ids.some((id) => userRoles.includes(id));
};
const isManagerOrHR  = (r?: string) => hasRole(r, 1, 2);
const isSales        = (r?: string) => hasRole(r, 3);
const canAddCustomer = (r?: string) => hasRole(r, 1, 2, 3);

// ============================================================
// TYPES
// ============================================================
type JobStage =
  | "Lead" | "Quote" | "Consultation" | "Survey" | "Measure"
  | "Design" | "Quoted" | "Accepted" | "Rejected" | "Production"
  | "Delivery" | "Installation" | "Complete" | "Remedial" | "Cancelled";

interface Customer {
  id: string;
  name: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  stage: JobStage;
  project_count: number;
  salesperson?: string;
  project_types?: string[];
  has_documents: boolean;
  drawing_count: number;
  form_count: number;
  form_document_count: number;
  created_at: string;
  updated_at?: string;
  created_by?: string | number;
  visit_date?: string;
}

// ============================================================
// HELPERS
// ============================================================
const STAGES: JobStage[] = [
  "Lead","Quote","Consultation","Survey","Measure","Design",
  "Quoted","Accepted","Rejected","Production","Delivery",
  "Installation","Complete","Remedial","Cancelled",
];

const getStageColor = (stage: JobStage): string => {
  switch (stage) {
    case "Lead":                           return "bg-gray-100 text-gray-700";
    case "Quote": case "Consultation":     return "bg-blue-100 text-blue-800";
    case "Survey": case "Measure":         return "bg-yellow-100 text-yellow-800";
    case "Design": case "Quoted":          return "bg-orange-100 text-orange-800";
    case "Accepted": case "Production":    return "bg-purple-100 text-purple-800";
    case "Delivery": case "Installation":  return "bg-indigo-100 text-indigo-800";
    case "Complete":                       return "bg-green-100 text-green-800";
    case "Rejected": case "Cancelled":     return "bg-red-100 text-red-600";
    case "Remedial":                       return "bg-red-100 text-red-800";
    default:                               return "bg-gray-100 text-gray-700";
  }
};

const formatDate = (d?: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
};

// ============================================================
// COMPONENT
// ============================================================
export default function CustomersPage() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm]     = useState("");
  const [stageFilter, setStageFilter]   = useState<JobStage | "All">("All");
  const [salesFilter, setSalesFilter]   = useState<string>("All");
  const [isLoading, setIsLoading]       = useState(true);
  const [currentPage, setCurrentPage]   = useState(1);

  // Inline stage update
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null);

  const router   = useRouter();
  const { user } = useAuth();

  const getHeaders = (): HeadersInit => {
    const token    = localStorage.getItem("auth_token");
    const tenantId = localStorage.getItem("tenant_id") ?? user?.tenant_id ?? "";
    return {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": String(tenantId),
      "Content-Type": "application/json",
    };
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, stageFilter, salesFilter]);

  // ── FETCH ──────────────────────────────────────────────────
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/customers`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAllCustomers(data.map((c: any) => ({
        ...c,
        postcode:      c.postcode || c.post_code || "",
        project_types: Array.isArray(c.project_types) ? c.project_types : [],
        stage:         c.stage || "Lead",
        project_count: Number(c.project_count) || 0,
        updated_at:    c.updated_at || c.created_at,
      })));
    } catch (err) {
      console.error(err);
      setAllCustomers([]);
    } finally { setIsLoading(false); }
  };

  // ── INLINE STAGE UPDATE ────────────────────────────────────
  const handleStageChange = async (customerId: string, newStage: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingStageId(customerId);
    try {
      await fetch(`${BACKEND_URL}/customers/${customerId}/stage`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ stage: newStage }),
      });
      setAllCustomers((prev) =>
        prev.map((c) => c.id === customerId ? { ...c, stage: newStage as JobStage } : c)
      );
    } catch (err) { console.error(err); }
    finally { setUpdatingStageId(null); }
  };

  // ── DELETE ─────────────────────────────────────────────────
  const deleteCustomer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isManagerOrHR(user?.role_ids)) { alert("No permission."); return; }
    if (!window.confirm("Delete this customer?")) return;
    try {
      await fetch(`${BACKEND_URL}/customers/${id}`, { method: "DELETE", headers: getHeaders() });
      setAllCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch { alert("Error deleting customer"); }
  };

  // ── FILTERING & SORTING ────────────────────────────────────
  const salespeople = useMemo(() =>
    Array.from(new Set(allCustomers.map((c) => c.salesperson).filter(Boolean))) as string[],
    [allCustomers]
  );

  const roleFiltered = useMemo(() => {
    if (isSales(user?.role_ids) && !isManagerOrHR(user?.role_ids)) {
      return allCustomers.filter((c) =>
        String(c.created_by || "").trim() === String(user?.employee_id || "").trim() ||
        (c.salesperson || "").toLowerCase() === (user?.employee_name || "").toLowerCase()
      );
    }
    return allCustomers;
  }, [allCustomers, user]);

  const filtered = useMemo(() => {
    return roleFiltered.filter((c) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        (c.name     || "").toLowerCase().includes(term) ||
        (c.phone    || "").toLowerCase().includes(term) ||
        (c.address  || "").toLowerCase().includes(term) ||
        (c.postcode || "").toLowerCase().includes(term) ||
        (c.email    || "").toLowerCase().includes(term);
      const matchStage = stageFilter === "All" || c.stage === stageFilter;
      const matchSales = salesFilter === "All" || c.salesperson === salesFilter;
      return matchSearch && matchStage && matchSales;
    });
  }, [roleFiltered, searchTerm, stageFilter, salesFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const aAcc = a.stage?.toLowerCase() === "accepted";
    const bAcc = b.stage?.toLowerCase() === "accepted";
    if (aAcc && !bAcc) return -1;
    if (!aAcc && bAcc) return 1;
    return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
  }), [filtered]);

  const totalPages       = Math.ceil(sorted.length / CUSTOMERS_PER_PAGE);
  const paginated        = useMemo(() => sorted.slice((currentPage - 1) * CUSTOMERS_PER_PAGE, currentPage * CUSTOMERS_PER_PAGE), [sorted, currentPage]);
  const salesView        = isSales(user?.role_ids) && !isManagerOrHR(user?.role_ids);

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="w-full p-6">
      <h1 className="mb-6 text-3xl font-bold">{salesView ? "My Customers" : "Customers"}</h1>

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search customers..." className="pl-8"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {/* Stage filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                {stageFilter === "All" ? "All Stages" : stageFilter}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-72 overflow-y-auto">
              <DropdownMenuItem onClick={() => setStageFilter("All")}>All Stages</DropdownMenuItem>
              {STAGES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStageFilter(s)}>{s}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Salesperson filter (Manager/HR only) */}
          {isManagerOrHR(user?.role_ids) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  {salesFilter === "All" ? "All Salespeople" : salesFilter}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-y-auto">
                <DropdownMenuItem onClick={() => setSalesFilter("All")}>All Salespeople</DropdownMenuItem>
                {salespeople.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => setSalesFilter(s)}>{s}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {canAddCustomer(user?.role_ids) && (
          <Button onClick={() => router.push("/dashboard/customers/create")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Postcode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
                {isManagerOrHR(user?.role_ids) && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesperson</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Types</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-gray-400" />
                    <p className="mt-3 text-gray-500">Loading customers...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                paginated.map((customer, idx) => {
                  const rowNum = sorted.length - ((currentPage - 1) * CUSTOMERS_PER_PAGE + idx);
                  const isAccepted = customer.stage?.toLowerCase() === "accepted";

                  return (
                    <tr key={customer.id}
                      onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        isAccepted ? "bg-purple-50" : !customer.has_documents ? "bg-red-50" : ""
                      }`}
                    >
                      {/* Row number */}
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{String(rowNum).padStart(3, "0")}</td>

                      {/* Name */}
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {!customer.has_documents && (
                            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500"
                              title={`No documents. Drawings: ${customer.drawing_count}, Forms: ${customer.form_count}`} />
                          )}
                          {customer.name}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-gray-700">{customer.phone || "—"}</td>

                      {/* Address */}
                      <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{customer.address || "—"}</td>

                      {/* Postcode */}
                      <td className="px-4 py-3 text-gray-700">{customer.postcode || "—"}</td>

                      {/* Stage — inline dropdown */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={customer.stage}
                          disabled={updatingStageId === customer.id || (!isManagerOrHR(user?.role_ids) && !isSales(user?.role_ids))}
                          onValueChange={(val) =>
                            handleStageChange(customer.id, val, { stopPropagation: () => {} } as React.MouseEvent)
                          }
                        >
                          <SelectTrigger className={`h-7 w-36 border-0 px-2 py-0 text-xs font-semibold rounded-full ${getStageColor(customer.stage)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Projects */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <FolderOpen className="h-4 w-4" />
                          <span className="text-sm">{customer.project_count}</span>
                        </div>
                      </td>

                      {/* Salesperson */}
                      {isManagerOrHR(user?.role_ids) && (
                        <td className="px-4 py-3 text-gray-700">{customer.salesperson || "—"}</td>
                      )}

                      {/* Visit Date */}
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {customer.visit_date ? formatDate(customer.visit_date) : "—"}
                      </td>

                      {/* Project Types */}
                      <td className="px-4 py-3">
                        {customer.project_types && customer.project_types.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {customer.project_types.map((t, i) => (
                              <span key={i} className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon"
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/customers/${customer.id}/edit`); }}
                            className="h-7 w-7 text-gray-500 hover:text-gray-900">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isManagerOrHR(user?.role_ids) && (
                            <Button variant="ghost" size="icon"
                              onClick={(e) => deleteCustomer(customer.id, e)}
                              className="h-7 w-7 text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && sorted.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{(currentPage - 1) * CUSTOMERS_PER_PAGE + 1}</span> to{" "}
              <span className="font-medium">{Math.min(currentPage * CUSTOMERS_PER_PAGE, sorted.length)}</span> of{" "}
              <span className="font-medium">{sorted.length}</span> customers
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronFirst className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronLast className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}