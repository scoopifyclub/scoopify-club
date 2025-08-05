'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  AlertCircle,
  DollarSign,
  MapPin,
  TrendingUp
} from 'lucide-react';

/**
 * @typedef {Object} NavItem
 * @property {string} title - The title of the navigation item
 * @property {string} href - The URL of the navigation item
 * @property {React.ComponentType} icon - The icon component for the navigation item
 */

/**
 * Navigation items for the admin panel
 * @type {NavItem[]}
 */
const navItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Employees',
    href: '/admin/employees',
    icon: Users
  },
  {
    title: 'Coverage Areas',
    href: '/admin/dashboard/coverage',
    icon: MapPin
  },
  {
    title: 'Schedule',
    href: '/admin/schedule',
    icon: Calendar
  },
  {
    title: 'Failed Payments',
    href: '/admin/failed-payments',
    icon: AlertCircle
  },
  {
    title: 'Billing',
    href: '/admin/billing',
    icon: DollarSign
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings
  },
  {
    title: 'Operational Efficiency',
    href: '/admin/operational-efficiency',
    icon: TrendingUp
  },
  {
    title: 'Marketing & Growth',
    href: '/admin/marketing-growth',
    icon: BarChart3
  }
];

/**
 * AdminNav component for the admin panel navigation
 * @returns {JSX.Element} The rendered component
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100',
              pathname === item.href && 'bg-gray-100 text-gray-900'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
