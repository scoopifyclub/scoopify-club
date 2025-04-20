import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Calendar,
  DollarSign,
  AlertTriangle,
  Camera,
  Package,
  CreditCard
} from "lucide-react";

// Find the admin payments section and add a new link for payment batches
export const adminSidebarLinks = [
  {
    heading: "Dashboard",
    links: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: FileText },
    ],
  },
  {
    heading: "Management",
    links: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/employees", label: "Employees", icon: Users },
      { href: "/admin/services", label: "Services", icon: Calendar },
    ],
  },
  {
    heading: "Payments",
    links: [
      { href: "/admin/payments", label: "All Payments", icon: DollarSign },
      { href: "/admin/payments/batches", label: "Payment Batches", icon: Package },
      { href: "/admin/failed-payments", label: "Failed Payments", icon: AlertTriangle },
    ],
  },
  {
    heading: "Content",
    links: [
      { href: "/admin/photos", label: "Photos", icon: Camera },
    ],
  },
  {
    heading: "System",
    links: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
]; 