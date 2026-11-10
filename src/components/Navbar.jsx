'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBroom, faTags, faInfoCircle, faSignInAlt, faUserPlus, faBars, faTimes, faSignOutAlt, faUser, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { Logo } from '@/components/Logo';

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const cookies = document.cookie.split(';');
            const hasAccessToken = cookies.some(cookie => cookie.trim().startsWith('accessToken='));
            setIsLoggedIn(hasAccessToken);
            const storedRole = localStorage.getItem('userRole');
            if (storedRole) {
                setUserRole(storedRole);
            }
        };
        checkAuth();
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) {
                document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                document.cookie = 'fingerprint=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                localStorage.removeItem('userRole');
                setIsLoggedIn(false);
                setUserRole(null);
                router.push('/');
                router.refresh();
            }
        }
        catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const getDashboardLink = () => {
        switch (userRole) {
            case 'ADMIN':
                return '/admin/dashboard';
            case 'EMPLOYEE':
                return '/employee/dashboard';
            case 'CUSTOMER':
            default:
                return '/customer/dashboard';
        }
    };

    const navigation = [
        { name: 'Home', href: '/', icon: faHome },
        { name: 'Services', href: '/services', icon: faBroom },
        { name: 'Pricing', href: '/pricing', icon: faTags },
        { name: 'About', href: '/about', icon: faInfoCircle },
    ];

    return (<header className="sticky top-0 z-50 border-b border-[color:var(--brand-line)] bg-[color:var(--brand-surface)]/90 backdrop-blur-md">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Logo size="md" href="/" />

          <div className="hidden md:flex items-center space-x-7">
            {navigation.map((item) => (<Link key={item.name} href={item.href} className="text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] font-medium transition-colors duration-200 flex items-center">
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <FontAwesomeIcon icon={item.icon} width="20" height="20"/>
                </span>
                <span className="ml-2">{item.name}</span>
              </Link>))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (<>
                <Link href={getDashboardLink()} className="text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] font-medium px-3 py-2 rounded-lg transition-colors duration-200 flex items-center">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon icon={userRole === 'ADMIN' ? faShieldAlt : faUser} width="20" height="20"/>
                  </span>
                  <span className="ml-2">
                    {userRole === 'ADMIN' ? 'Admin Dashboard' : 'Dashboard'}
                  </span>
                </Link>
                <button onClick={handleLogout} className="text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] font-medium px-3 py-2 rounded-lg transition-colors duration-200 flex items-center">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon icon={faSignOutAlt} width="20" height="20"/>
                  </span>
                  <span className="ml-2">Log out</span>
                </button>
              </>) : (<>
                <Link href="/login" className="text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] font-medium px-3 py-2 rounded-lg transition-colors duration-200 flex items-center">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon icon={faSignInAlt} width="20" height="20"/>
                  </span>
                  <span className="ml-2">Log in</span>
                </Link>
                <Link href="/signup" className="brand-cta-primary inline-flex items-center font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon icon={faUserPlus} width="20" height="20"/>
                  </span>
                  <span className="ml-2">Join the Club</span>
                </Link>
                <Link href="/auth/scooper-signup" className="brand-cta-secondary inline-flex items-center font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon icon={faBroom} width="20" height="20"/>
                  </span>
                  <span className="ml-2">Become a Scooper</span>
                </Link>
              </>)}
          </div>

          <div className="md:hidden">
            <button type="button" className="inline-flex items-center justify-center p-2 rounded-lg text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] hover:bg-[color:var(--brand-mist)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span className="sr-only">Open main menu</span>
              <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="h-6 w-6"/>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (<div className="md:hidden mt-3 rounded-xl border border-[color:var(--brand-line)] bg-[color:var(--brand-surface)] p-2">
            <div className="space-y-1">
              {navigation.map((item) => (<Link key={item.name} href={item.href} className="block px-3 py-2 rounded-lg text-base font-medium text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] hover:bg-[color:var(--brand-mist)]">
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                      <FontAwesomeIcon icon={item.icon} width="20" height="20"/>
                    </span>
                    {item.name}
                  </div>
                </Link>))}
              {isLoggedIn && (<>
                  <Link href={getDashboardLink()} className="block px-3 py-2 rounded-lg text-base font-medium text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] hover:bg-[color:var(--brand-mist)]">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon icon={userRole === 'ADMIN' ? faShieldAlt : faUser} width="20" height="20"/>
                      </span>
                      {userRole === 'ADMIN' ? 'Admin Dashboard' : 'Dashboard'}
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] hover:bg-[color:var(--brand-mist)]">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon icon={faSignOutAlt} width="20" height="20"/>
                      </span>
                      Log out
                    </div>
                  </button>
                </>)}
              {!isLoggedIn && (<>
                  <Link href="/login" className="block px-3 py-2 rounded-lg text-base font-medium text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] hover:bg-[color:var(--brand-mist)]">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon icon={faSignInAlt} width="20" height="20"/>
                      </span>
                      Log in
                    </div>
                  </Link>
                  <Link href="/signup" className="block px-3 py-2 rounded-lg text-base font-medium text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] hover:bg-[color:var(--brand-mist)]">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon icon={faUserPlus} width="20" height="20"/>
                      </span>
                      Join the Club
                    </div>
                  </Link>
                  <Link href="/auth/scooper-signup" className="block px-3 py-2 rounded-lg text-base font-medium text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-leaf)] hover:bg-[color:var(--brand-mist)]">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon icon={faBroom} width="20" height="20"/>
                      </span>
                      Become a Scooper
                    </div>
                  </Link>
                </>)}
            </div>
          </div>)}
      </nav>
    </header>);
}
