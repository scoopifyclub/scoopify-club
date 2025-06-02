'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Home, 
    Calendar, 
    Users, 
    Settings, 
    LogOut,
    Map,
    Bell,
    MessageSquare,
    DollarSign,
    FileText,
    Briefcase,
    Menu,
    X
} from 'lucide-react';

const menuItems = [
    { href: '/employee/dashboard', label: 'Overview', icon: Home },
    { href: '/employee/dashboard/schedule', label: 'Schedule', icon: Calendar },
    { href: '/employee/dashboard/services', label: 'Services', icon: Briefcase },
    { href: '/employee/dashboard/maps', label: 'Maps', icon: Map },
    { href: '/employee/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/employee/dashboard/messages', label: 'Messages', icon: MessageSquare },
    { href: '/employee/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/employee/dashboard/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/employee/dashboard/reports', label: 'Reports', icon: FileText },
    { href: '/employee/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const { user, loading, logout } = useAuth({
        required: true,
        role: 'EMPLOYEE',
        redirectTo: '/auth/signin'
    });

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/auth/signin');
    };

    if (loading) {
        console.log('🔄 Dashboard layout loading...', { loading, user });
        // TEMPORARILY DISABLED - bypassing auth loading to fix dashboard
        // return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 right-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-40 w-64 h-screen transition-transform
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="h-full bg-white border-r">
                    <div className="flex flex-col h-full">
                        {/* Logo */}
                        <div className="h-16 flex items-center px-6 border-b">
                            <h1 className="text-xl font-bold">Employee Dashboard</h1>
                        </div>

                        {/* Navigation */}
                        <ScrollArea className="flex-1 px-3 py-4">
                            <nav className="space-y-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100 gap-3"
                                        >
                                            <Icon className="w-5 h-5" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </ScrollArea>

                        {/* User section */}
                        <div className="p-4 border-t mt-auto">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1">
                                    <p className="font-medium">{user?.name}</p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                            </div>
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

            {/* Main content */}
            <main className={`
                transition-all duration-200
                lg:ml-64
            `}>
                {children}
            </main>

            {/* Mobile menu backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 lg:hidden z-30"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
