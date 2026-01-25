// 1. CENTRALIZED BASE CONFIGURATION
// BASE_PATH remains '', which correctly targets /api/ on the current frontend host (e.g., http://localhost:3000)
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// FIXED: Converted the backend link to use localhost:5000 to match the Flask server
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// Auth uses Next.js API routes (targets http://localhost:3000/api)
const AUTH_API_ROOT = `${BASE_PATH}/api`;

// Data uses external backend (targets http://localhost:5000)
const DATA_API_ROOT = BACKEND_URL;

// 🔍 DEBUG: Log the configuration
if (typeof window !== 'undefined') {
  console.log('🌐 API Configuration:', {
    BASE_PATH,
    AUTH_API_ROOT,
    DATA_API_ROOT,
  });
}

// ✅ Helper function to redirect to login with basePath support
function redirectToLogin() {
  if (typeof window !== 'undefined') {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.location.href = `${basePath}/login`;
  }
}

// ✅ Helper to add timeout to fetch calls
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

/**
 * Helper function for PUBLIC API calls (no authentication required)
 * Used for login/register - calls Next.js API routes (localhost:3000/api)
 */
export async function fetchPublic(path: string, options: RequestInit = {}) {
  const url = `${AUTH_API_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;

  console.log('📡 fetchPublic calling:', url);

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Helper function to make authenticated API calls (or optional auth)
 * Used for data endpoints - calls external local backend (localhost:5000)
 */
export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");

  const url = `${DATA_API_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;

  console.log('📡 fetchWithAuth calling:', url);

  // ✅ For drawing-analyser, make auth optional (since mock user is set in backend)
  const requiresAuth = !path.includes('/api/drawing-analyser');

  if (!token && requiresAuth) {
    console.error("No auth token found");
    throw new Error("Not authenticated");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  // Add auth header if token exists
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

// ✅ Helper to handle API responses gracefully
async function handleApiResponse(response: Response) {
  if (response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      return { success: true };
    }
  }

  // Handle errors
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

// Example usage functions
export const api = {
  // AUTH ENDPOINTS (use fetchPublic - calls Next.js API routes on localhost:3000)
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
  }) {
    const response = await fetchPublic("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return handleApiResponse(response);
  },

  // GENERIC HTTP METHODS
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
      
      // ✅ Return empty data for drawing list endpoint to prevent crash
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

  // DATA ENDPOINTS (use fetchWithAuth - calls Flask backend on localhost:5000)
  async getCustomers() {
    try {
      const response = await fetchWithAuth("/customers"); 
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getCustomers failed, returning empty data");
      return { customers: [] };
    }
  },

  async getJobs() {
    try {
      const response = await fetchWithAuth("/jobs");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getJobs failed, returning empty data");
      return { jobs: [] };
    }
  },

  async getPipeline() {
    try {
      const response = await fetchWithAuth("/pipeline");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getPipeline failed, returning empty data");
      return { pipeline: [] };
    }
  },

  async updateCustomerStage(customerId: string, stage: string, reason: string, updatedBy: string) {
    const response = await fetchWithAuth(`/customers/${customerId}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage, reason, updated_by: updatedBy }),
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

  // ASSIGNMENT ENDPOINTS (for schedule)
  async getAssignments() {
    try {
      const response = await fetchWithAuth("/assignments");
      return await handleApiResponse(response);
    } catch (error) {
      console.warn("⚠️ getAssignments failed, returning empty data");
      return [];
    }
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
};