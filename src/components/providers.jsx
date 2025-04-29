'use client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faPaw, 
  faHome, 
  faBroom, 
  faInfoCircle, 
  faUser, 
  faBars, 
  faXmark, 
  faSignInAlt, 
  faUserPlus, 
  faTags, 
  faTimes,
  faCalendarAlt,
  faKey,
  faExclamationCircle,
  faDoorOpen,
  faSave,
  faCog,
  faCircleInfo,
  faCircleCheck,
  faStar,
  faCalendar,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
// Initialize Font Awesome configuration
config.autoAddCss = false; // Tell Font Awesome to skip adding CSS automatically since we're doing it manually
// Add icons to library
library.add(
  faPaw, 
  faHome, 
  faBroom, 
  faInfoCircle, 
  faUser, 
  faBars, 
  faXmark,
  faSignInAlt,
  faUserPlus,
  faTags,
  faTimes,
  faCalendarAlt,
  faKey,
  faExclamationCircle,
  faDoorOpen,
  faSave,
  faCog,
  faCircleInfo,
  faCircleCheck,
  faStar,
  faCalendar,
  faCheck
);

/**
 * Providers component for theme management
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} The rendered component
 */
export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
