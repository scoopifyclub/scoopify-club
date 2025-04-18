import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, CreditCard, Calendar, Users, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Services', href: '/services', icon: Calendar },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex h-16 flex-shrink-0 items-center px-4">
        <Link href="/" className="text-2xl font-bold text-primary">
          Scoopify
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'bg-gray-100 dark:bg-gray-700 text-primary'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
              >
                <Icon
                  className={`${
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                  } mr-3 h-5 w-5 flex-shrink-0`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
              <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.name}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="ml-auto flex items-center rounded-md p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 