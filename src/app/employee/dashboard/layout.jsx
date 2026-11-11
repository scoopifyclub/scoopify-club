'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Home,
    Briefcase,
    Settings,
    LogOut,
    DollarSign,
    HelpCircle,
    Menu,
    X,
} from 'lucide-react';

// Pilot scooper nav: jobs only. Customer CRM / email stay admin-side.
const menuItems = [
    { href: '/employee/dashboard', label: 'Available Jobs', icon: Home },
    { href: '/employee/dashboard/services', label: 'My Jobs', icon: Briefcase },
    { href: '/employee/dashboard/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/employee/faq', label: 'Help', icon: HelpCircle },
    { href: '/employee/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/signout', {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) {
                router.push('/auth/signin');
            }
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/auth/signin');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="lg:hidden fixed top-4 right-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </Button>
            </div>

            <aside
                className={`
                fixed top-0 left-0 z-40 w-64 h-screen transition-transform
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
            >
                <div className="h-full bg-white border-r">
                    <div className="flex flex-col h-full">
                        <div className="h-16 flex items-center px-6 border-b">
                            <h1 className="text-xl font-bold">Scooper</h1>
                        </div>

                        <ScrollArea className="flex-1 px-3 py-4">
                            <nav className="space-y-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const active =
                                        pathname === item.href ||
                                        (item.href !== '/employee/dashboard' &&
                                            pathname?.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center px-3 py-2 rounded-lg gap-3 ${
                                                active
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </ScrollArea>

                        <div className="p-4 border-t mt-auto">
                            <p className="text-xs text-gray-500 mb-3">
                                Need help? Message Scoopify support from Help — not customers.
                            </p>
                            <Button
                                variant="destructive"
                                className="w-full flex items-center justify-center gap-2 py-2"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="transition-all duration-200 lg:ml-64">{children}</main>

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 lg:hidden z-30"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
