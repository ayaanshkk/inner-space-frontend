// =====================================================
// API Configuration for InnerSpace Interiors CRM
// =====================================================

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const AUTH_API_ROOT = BACKEND_URL;
const DATA_API_ROOT = BACKEND_URL;

console.log('🔍 Environment Check:', {
  'process.env.NEXT_PUBLIC_BACKEND_URL': process.env.NEXT_PUBLIC_BACKEND_URL,
  'BACKEND_URL': BACKEND_URL,
  'AUTH_API_ROOT': AUTH_API_ROOT,
  'DATA_API_ROOT': DATA_API_ROOT,
});

if (typeof window !== 'undefined') {
  console.log('🌐 API Configuration:', {
    BASE_PATH,
    AUTH_API_ROOT,
    DATA_API_ROOT,
  });
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.location.href = `${basePath}/login`;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function fetchPublic(path: string, options: RequestInit = {}) {
  const url = `${AUTH_API_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;
  console.log('📡 fetchPublic calling:', url);

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetchWithTimeout(url, {
    ...options,
    headers,
  });

  return response;
}

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  const url = `${DATA_API_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;
  console.log('📡 fetchWithAuth calling:', url);

  const requiresAuth = !path.includes('/api/drawing-analyser');

  if (!token && requiresAuth) {
    console.error("No auth token found");
    throw new Error("Not authenticated");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers,
    }, 60000);

    if (response.status === 401 && requiresAuth) {
      console.error("🔒 Unauthorized - token invalid or expired");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("user_role");
      redirectToLogin();
      throw new Error("Unauthorized - please log in again");
    }

    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("⏱️ Request timeout - backend not responding (waited 60s)");
      throw new Error("Request timeout - backend may be sleeping");
    }
    throw error;
  }
}

async function handleApiResponse(response: Response) {
  if (response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      return { success: true };
    }
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const errorData = await response.json();
    throw new Error(errorData.error || "API error");
  } else {
    const errorText = await response.text();
    console.error("Non-JSON response:", errorText);
    throw new Error(`API failed with status ${response.status}`);
  }
}

// =====================================================
// API Helper Functions
// =====================================================

export const api = {
  // ==================== AUTH ENDPOINTS ====================

  async login(email: string, password: string) {
    const response = await fetchPublic("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return handleApiResponse(response);
  },

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
    phone?: string;
    department?: string;
  }) {
    const response = await fetchPublic("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return handleApiResponse(response);
  },

  async getCurrentUser() {
    const response = await fetchWithAuth("/auth/me");
    return handleApiResponse(response);
  },

  // ==================== GENERIC HTTP METHODS ====================

  async get(path: string, options: RequestInit = {}) {
    try {
      const response = await fetchWithAuth(path, {
        ...options,
        method: "GET",
      });
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('API GET error:', {
        path,
        error: error.message,
        name: error.name
      });
      
      if (path.includes('/api/drawing-analyser') && !path.includes('/upload')) {
        console.warn('⚠️ Drawing analyser GET failed, returning empty data');
        return { drawings: [], total: 0, limit: 50, offset: 0 };
      }
      
      throw error;
    }
  },

  async post(path: string, data?: any, options: RequestInit = {}) {
    const response = await fetchWithAuth(path, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleApiResponse(response);
  },

  async put(path: string, data?: any, options: RequestInit = {}) {
    const response = await fetchWithAuth(path, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleApiResponse(response);
  },

  async patch(path: string, data?: any, options: RequestInit = {}) {
    const response = await fetchWithAuth(path, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleApiResponse(response);
  },

  async delete(path: string, options: RequestInit = {}) {
    const response = await fetchWithAuth(path, {
      ...options,
      method: "DELETE",
    });
    return handleApiResponse(response);
  },

  // ==================== CUSTOMER ENDPOINTS ====================

  async getCustomers() {
    try {
      const response = await fetchWithAuth("/customers");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getCustomers failed, returning empty data");
      return { customers: [] };
    }
  },

  async getCustomer(customerId: string) {
    const response = await fetchWithAuth(`/customers/${customerId}`);
    return handleApiResponse(response);
  },

  async createCustomer(customerData: any) {
    const response = await fetchWithAuth("/customers", {
      method: "POST",
      body: JSON.stringify(customerData),
    });
    return handleApiResponse(response);
  },

  async updateCustomer(customerId: string, customerData: any) {
    const response = await fetchWithAuth(`/customers/${customerId}`, {
      method: "PUT",
      body: JSON.stringify(customerData),
    });
    return handleApiResponse(response);
  },

  async deleteCustomer(customerId: string) {
    const response = await fetchWithAuth(`/customers/${customerId}`, {
      method: "DELETE",
    });
    return handleApiResponse(response);
  },

  async updateCustomerStage(customerId: string, stage: string, reason: string, updatedBy: string) {
    const response = await fetchWithAuth(`/customers/${customerId}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage, reason, updated_by: updatedBy }),
    });
    return handleApiResponse(response);
  },

  // ==================== JOB ENDPOINTS ====================

  async getJobs() {
    try {
      const response = await fetchWithAuth("/jobs");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getJobs failed, returning empty data");
      return { jobs: [] };
    }
  },

  async getJob(jobId: string) {
    const response = await fetchWithAuth(`/jobs/${jobId}`);
    return handleApiResponse(response);
  },

  async createJob(jobData: any) {
    const response = await fetchWithAuth("/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });
    return handleApiResponse(response);
  },

  async updateJob(jobId: string, jobData: any) {
    const response = await fetchWithAuth(`/jobs/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(jobData),
    });
    return handleApiResponse(response);
  },

  async deleteJob(jobId: string) {
    const response = await fetchWithAuth(`/jobs/${jobId}`, {
      method: "DELETE",
    });
    return handleApiResponse(response);
  },

  async updateJobStage(jobId: string, stage: string, reason: string, updatedBy: string) {
    const response = await fetchWithAuth(`/jobs/${jobId}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage, reason, updated_by: updatedBy }),
    });
    return handleApiResponse(response);
  },

  // ==================== PIPELINE ENDPOINTS ====================

  async getPipeline() {
    try {
      const response = await fetchWithAuth("/pipeline");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getPipeline failed, returning empty data");
      return { pipeline: [] };
    }
  },

  // ==================== ASSIGNMENT ENDPOINTS ====================

  async getAssignments() {
    try {
      const response = await fetchWithAuth("/assignments");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getAssignments failed, returning empty data");
      return [];
    }
  },

  async getAssignment(assignmentId: string) {
    const response = await fetchWithAuth(`/assignments/${assignmentId}`);
    return handleApiResponse(response);
  },

  async createAssignment(assignmentData: any) {
    const response = await fetchWithAuth("/assignments", {
      method: "POST",
      body: JSON.stringify(assignmentData),
    });
    return handleApiResponse(response);
  },

  async updateAssignment(assignmentId: string, assignmentData: any) {
    const response = await fetchWithAuth(`/assignments/${assignmentId}`, {
      method: "PUT",
      body: JSON.stringify(assignmentData),
    });
    return handleApiResponse(response);
  },

  async deleteAssignment(assignmentId: string) {
    const response = await fetchWithAuth(`/assignments/${assignmentId}`, {
      method: "DELETE",
    });
    return handleApiResponse(response);
  },

  // ==================== NOTIFICATION ENDPOINTS ====================

  async getNotifications() {
    try {
      const response = await fetchWithAuth("/notifications/production");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getNotifications failed, returning empty data");
      return [];
    }
  },

  async markNotificationAsRead(notificationId: number) {
    const response = await fetchWithAuth(`/notifications/production/${notificationId}/read`, {
      method: "PATCH",
    });
    return handleApiResponse(response);
  },

  async dismissNotification(notificationId: number) {
    const response = await fetchWithAuth(`/notifications/production/${notificationId}/dismiss`, {
      method: "POST",
    });
    return handleApiResponse(response);
  },

  async deleteNotification(notificationId: number) {
    const response = await fetchWithAuth(`/notifications/production/${notificationId}`, {
      method: "DELETE",
    });
    return handleApiResponse(response);
  },

  // ==================== DOCUMENT ENDPOINTS ====================

  async getDocuments() {
    try {
      const response = await fetchWithAuth("/files/documents");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getDocuments failed, returning empty data");
      return { documents: [] };
    }
  },

  async uploadDocument(formData: FormData) {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${DATA_API_ROOT}/files/documents`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });
    return handleApiResponse(response);
  },

  async deleteDocument(documentId: string) {
    const response = await fetchWithAuth(`/files/documents/${documentId}`, {
      method: "DELETE",
    });
    return handleApiResponse(response);
  },

  // ==================== DRAWING ANALYSER ENDPOINTS ====================

  async getDrawings() {
    try {
      const response = await fetchWithAuth("/api/drawing-analyser");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getDrawings failed, returning empty data");
      return { drawings: [], total: 0, limit: 50, offset: 0 };
    }
  },

  async uploadDrawing(formData: FormData) {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${DATA_API_ROOT}/api/drawing-analyser/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });
    return handleApiResponse(response);
  },

  async getDrawing(drawingId: string) {
    const response = await fetchWithAuth(`/api/drawing-analyser/${drawingId}`);
    return handleApiResponse(response);
  },

  async deleteDrawing(drawingId: string) {
    const response = await fetchWithAuth(`/api/drawing-analyser/${drawingId}`, {
      method: "DELETE",
    });
    return handleApiResponse(response);
  },

  // ==================== MANUAL CABINET ENDPOINTS ====================

  async calculateCabinet(data: {
    cabinet_type: 'base' | 'wall';
    height: number;
    width: number;
    depth?: number;
    project_name?: string;
    save?: boolean;
  }) {
    const response = await fetchWithAuth('/api/manual-cabinet/calculate', { 
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  async getSavedCabinets() {
    try {
      const response = await fetchWithAuth('/manual-cabinet/saved');
      return await handleApiResponse(response);
    } catch (error) {
      console.warn('⚠️ getSavedCabinets failed, returning empty data');
      return { cabinets: [] };
    }
  },
};
