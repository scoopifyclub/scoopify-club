'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style jsx global>{`
        .svg-inline--fa {
          display: inline-block;
          height: 1em;
          width: 1em;
          vertical-align: -0.125em;
        }
        .svg-inline--fa path {
          fill: currentColor;
        }
      `}</style>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
      <Toaster richColors position="top-right" />
    </>
  );
} 