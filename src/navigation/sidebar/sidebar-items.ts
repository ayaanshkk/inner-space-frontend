import {
  ShoppingBag,
  Forklift,
  Mail,
  MessageSquare,
  Calendar,
  Kanban,
  ReceiptText,
  Users,
  Lock,
  Fingerprint,
  SquareArrowUpRight,
  LayoutDashboard,
  ChartBar,
  Banknote,
  Gauge,
  GraduationCap,
  CheckCircle,
  Package,
  Home,
  Briefcase,
  FileText,
  Settings,
  type LucideIcon,
  Bot,
  Bell,
  ClipboardList,
  DollarSign,
  ClipboardCheck,
  History,
  TrendingUp,
  Phone,
  BadgePoundSterling,
  FolderOpen,
  Trash2,
  File,
  UserPlus,
  Archive,
  UserCheck,
  Sparkles,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  roles?: string[];
  badge?: number | string;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  roles?: string[];
  badge?: number | string;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

// StreemLyne_MT Database Roles:
// 1 = Platform Admin
// 4 = Salesperson

// Define all sidebar items with role permissions
const allSidebarItems: NavGroup[] = [
  {
    id: 1,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/default",
        icon: Home,
        roles: ["platform admin", "salesperson"],
      },
      {
        title: "Drawing Analyzer",
        url: "/dashboard/analyzer",
        icon: FileText,
        roles: ["platform admin", "salesperson"],
        isNew: true,
      },
      {
        title: "Sales Pipeline",
        url: "/dashboard/sales_pipeline",
        icon: Briefcase,
        roles: ["platform admin", "salesperson"],
      },
      {
        title: "Customers",
        url: "/dashboard/customers",
        icon: Users,
        roles: ["platform admin", "salesperson"],
      },
      {
        title: "Materials",
        url: "/dashboard/materials",
        icon: Package,
        roles: ["platform admin"],
      },
      {
        title: "Schedule",
        url: "/dashboard/schedule",
        icon: Calendar,
        roles: ["platform admin", "salesperson"],
      },
      {
        title: "Chatbot",
        url: "/dashboard/chatbot",
        icon: Bot,
        roles: ["platform admin", "salesperson"],
      },
      {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
        roles: ["platform admin", "salesperson"],
        isNew: true,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
        roles: ["platform admin"],
      },
    ],
  },
];

// Filter sidebar items based on user role and optionally set notification badge
export const getSidebarItems = (userRole: string, notificationCount?: number): NavGroup[] => {
  // Normalize role to lowercase for comparison
  const normalizedRole = userRole?.toLowerCase().trim() || '';
  
  // Check if user has platform admin or salesperson role
  // Handle both role_ids string (e.g., "1,4") and role names
  const isPlatformAdmin = normalizedRole.includes('1') || normalizedRole.includes('platform') && normalizedRole.includes('admin');
  const isSalesperson = normalizedRole.includes('4') || normalizedRole.includes('salesperson') || normalizedRole.includes('sales');

  // Determine allowed roles
  let allowedRoles: string[] = [];
  if (isPlatformAdmin) {
    // Platform Admin sees everything
    allowedRoles = ['platform admin', 'salesperson'];
  } else if (isSalesperson) {
    // Salesperson only
    allowedRoles = ['salesperson'];
  }

  return allSidebarItems
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          if (!item.roles || item.roles.length === 0) return true;
          return item.roles.some(role => allowedRoles.includes(role.toLowerCase()));
        })
        .map((item) => {
          // ✅ Apply notification badge to Notifications menu item
          if (item.title === "Notifications" && notificationCount !== undefined && notificationCount > 0) {
            return {
              ...item,
              badge: notificationCount > 9 ? '9+' : notificationCount,
            };
          }

          if (item.subItems && item.subItems.length > 0) {
            return {
              ...item,
              subItems: item.subItems.filter((subItem) => {
                if (!subItem.roles || subItem.roles.length === 0) return true;
                return subItem.roles.some(role => allowedRoles.includes(role.toLowerCase()));
              }),
            };
          }

          return item;
        }),
    }))
    .filter((group) => group.items.length > 0);
};

// For backwards compatibility, export default items (Platform Admin view shows all)
export const sidebarItems = getSidebarItems("platform admin");