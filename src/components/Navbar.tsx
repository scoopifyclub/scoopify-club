'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaw, 
  faHome, 
  faBroom, 
  faTags, 
  faInfoCircle, 
  faSignInAlt, 
  faUserPlus, 
  faBars, 
  faTimes,
  faSignOutAlt,
  faUser,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'CUSTOMER' | 'EMPLOYEE' | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by looking for the access token
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const hasAccessToken = cookies.some(cookie => cookie.trim().startsWith('accessToken='));
      setIsLoggedIn(hasAccessToken);

      // Try to get user role from localStorage
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) {
        setUserRole(storedRole as 'ADMIN' | 'CUSTOMER' | 'EMPLOYEE');
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Clear cookies
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'fingerprint=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        
        // Clear localStorage
        localStorage.removeItem('userRole');
        
        // Reset state
        setIsLoggedIn(false);
        setUserRole(null);
        
        // Redirect to home page
        router.push('/');
        router.refresh();
      }
    } catch (error) {
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

  return (
    <header className="bg-white border-b border-neutral-200">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8">
                <FontAwesomeIcon 
                  icon={faPaw}
                  className="text-primary-500"
                  width="32"
                  height="32"
                />
              </span>
              <span className="ml-3">Scoopify<span className="text-primary-500">Club</span></span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-neutral-700 hover:text-primary-500 font-medium transition-colors duration-200 flex items-center"
              >
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <FontAwesomeIcon 
                    icon={item.icon}
                    width="20"
                    height="20"
                  />
                </span>
                <span className="ml-2">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link 
                  href={getDashboardLink()}
                  className="text-neutral-700 hover:text-primary font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon 
                      icon={userRole === 'ADMIN' ? faShieldAlt : faUser}
                      width="20"
                      height="20"
                    />
                  </span>
                  <span className="ml-2">
                    {userRole === 'ADMIN' ? 'Admin Dashboard' : 'Dashboard'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-neutral-700 hover:text-primary font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon 
                      icon={faSignOutAlt}
                      width="20"
                      height="20"
                    />
                  </span>
                  <span className="ml-2">Log out</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="text-neutral-700 hover:text-primary font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon 
                      icon={faSignInAlt}
                      width="20"
                      height="20"
                    />
                  </span>
                  <span className="ml-2">Log in</span>
                </Link>
                <Link 
                  href="/signup"
                  className="bg-primary text-white font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon 
                      icon={faUserPlus}
                      width="20"
                      height="20"
                    />
                  </span>
                  <span className="ml-2">Join the Club</span>
                </Link>
                <Link 
                  href="/scooper-signup"
                  className="border-2 border-primary text-primary font-medium px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200 flex items-center"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FontAwesomeIcon 
                      icon={faBroom}
                      width="20"
                      height="20"
                    />
                  </span>
                  <span className="ml-2">Become a Scooper</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-700 hover:text-primary-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <FontAwesomeIcon 
                icon={mobileMenuOpen ? faTimes : faBars}
                className="h-6 w-6"
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-100"
                >
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                      <FontAwesomeIcon 
                        icon={item.icon}
                        width="20"
                        height="20"
                      />
                    </span>
                    {item.name}
                  </div>
                </Link>
              ))}
              {isLoggedIn && (
                <>
                  <Link
                    href={getDashboardLink()}
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-100"
                  >
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon 
                          icon={userRole === 'ADMIN' ? faShieldAlt : faUser}
                          width="20"
                          height="20"
                        />
                      </span>
                      {userRole === 'ADMIN' ? 'Admin Dashboard' : 'Dashboard'}
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-100"
                  >
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon 
                          icon={faSignOutAlt}
                          width="20"
                          height="20"
                        />
                      </span>
                      Log out
                    </div>
                  </button>
                </>
              )}
              {!isLoggedIn && (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-100"
                  >
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon 
                          icon={faSignInAlt}
                          width="20"
                          height="20"
                        />
                      </span>
                      Log in
                    </div>
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-100"
                  >
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon 
                          icon={faUserPlus}
                          width="20"
                          height="20"
                        />
                      </span>
                      Join the Club
                    </div>
                  </Link>
                  <Link
                    href="/scooper-signup"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-primary-500 hover:bg-neutral-100"
                  >
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                        <FontAwesomeIcon 
                          icon={faBroom}
                          width="20"
                          height="20"
                        />
                      </span>
                      Become a Scooper
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
} 