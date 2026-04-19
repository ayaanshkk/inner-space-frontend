import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "InnerSpace Interiors",
  version: packageJson.version,
  copyright: `© ${currentYear}, InnerSpace Interiors. All rights reserved.`,
  meta: {
    title: "InnerSpace Interiors CRM",
    description: "Kitchen & Bedroom Installation Management System",
  },
  // ✅ Base path for routing
  basePath: "/streemlyne",
  
  // Company Info
  company: "InnerSpace Interiors",
  shortName: "InnerSpace CRM",
  
  // Contact
  supportEmail: "support@innerspaceinteriors.com",
  supportPhone: "+44 (0) 20 1234 5678",
  
  // Features
  features: {
    multiTenant: true,
    notifications: true,
    fileUpload: true,
    aiAnalysis: true,
    materials: true,
  },
  
  // API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
    timeout: 30000,
  },
  
  // UI
  ui: {
    itemsPerPage: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
    ],
  },
  
  // Roles (maps to role_ids in Employee_Master)
  roles: {
    1: "Manager",
    2: "HR",
    3: "Staff",
    4: "Sales",
    5: "Production",
  },
  
  // Stages (Pipeline stages for kitchen/bedroom projects)
  stages: [
    "Lead",
    "Survey",
    "Design",
    "Quote",
    "Accepted",
    "Rejected",
    "Ordered",
    "Production",
    "Delivery",
    "Installation",
    "Complete",
    "Remedial",
    "Cancelled",
  ],
  
  // Project Types
  projectTypes: [
    "Kitchen",
    "Bedroom",
    "Wardrobe",
    "Other",
  ],
  
  // Priorities
  priorities: ["Low", "Medium", "High"],
  
  // Notification Types
  notificationTypes: {
    activity: "Activity",
    task: "Task",
    alert: "Alert",
    stage_change: "Stage Change",
    document_processed: "Document Processed",
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
export type Role = keyof typeof APP_CONFIG.roles;
export type Stage = (typeof APP_CONFIG.stages)[number];
export type ProjectType = (typeof APP_CONFIG.projectTypes)[number];
export type Priority = (typeof APP_CONFIG.priorities)[number];