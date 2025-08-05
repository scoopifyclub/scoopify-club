// Scoopify Club Design System
// Comprehensive design tokens and utilities for consistent UI development

export const designTokens = {
  // Color Palette
  colors: {
    // Brand Colors
    primary: {
      50: 'rgb(248, 253, 242)',
      100: 'rgb(240, 251, 230)',
      200: 'rgb(224, 247, 204)',
      300: 'rgb(200, 241, 170)',
      400: 'rgb(162, 201, 101)', // brand-primary-light
      500: 'rgb(142, 191, 71)',  // brand-primary
      600: 'rgb(122, 171, 41)',  // brand-primary-dark
      700: 'rgb(102, 151, 31)',
      800: 'rgb(82, 131, 21)',
      900: 'rgb(62, 111, 11)',
    },
    
    // Accent Colors
    accent: {
      50: 'rgb(255, 253, 245)',
      100: 'rgb(255, 251, 235)',
      200: 'rgb(255, 247, 215)',
      300: 'rgb(255, 243, 195)',
      400: 'rgb(241, 210, 140)', // accent-secondary-light
      500: 'rgb(233, 196, 106)', // accent-secondary
      600: 'rgb(220, 180, 80)',  // accent-secondary-dark
      700: 'rgb(200, 160, 60)',
      800: 'rgb(180, 140, 40)',
      900: 'rgb(160, 120, 20)',
    },
    
    // Neutral Colors
    neutral: {
      50: 'rgb(248, 249, 250)',   // neutral-50
      100: 'rgb(241, 243, 245)',
      200: 'rgb(228, 230, 232)',
      300: 'rgb(212, 214, 216)',
      400: 'rgb(161, 163, 170)',
      500: 'rgb(113, 115, 122)',
      600: 'rgb(82, 84, 91)',
      700: 'rgb(63, 65, 70)',
      800: 'rgb(38, 40, 43)',
      900: 'rgb(24, 24, 27)',     // neutral-900
    },
    
    // Semantic Colors
    success: {
      50: 'rgb(240, 253, 244)',
      100: 'rgb(220, 252, 231)',
      500: 'rgb(142, 191, 71)',   // success
      600: 'rgb(122, 171, 41)',
      700: 'rgb(102, 151, 31)',
    },
    
    warning: {
      50: 'rgb(255, 251, 235)',
      100: 'rgb(254, 243, 199)',
      500: 'rgb(234, 179, 8)',    // warning
      600: 'rgb(202, 138, 4)',
      700: 'rgb(161, 98, 7)',
    },
    
    error: {
      50: 'rgb(254, 242, 242)',
      100: 'rgb(254, 226, 226)',
      500: 'rgb(239, 68, 68)',    // error
      600: 'rgb(220, 38, 38)',
      700: 'rgb(185, 28, 28)',
    },
    
    info: {
      50: 'rgb(239, 246, 255)',
      100: 'rgb(219, 234, 254)',
      500: 'rgb(59, 130, 246)',   // info
      600: 'rgb(37, 99, 235)',
      700: 'rgb(29, 78, 216)',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: 'var(--font-sans)',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    lineHeight: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },
  
  // Spacing
  spacing: {
    xs: 'var(--spacing-xs)',   // 0.25rem
    sm: 'var(--spacing-sm)',   // 0.5rem
    md: 'var(--spacing-md)',   // 1rem
    lg: 'var(--spacing-lg)',   // 1.5rem
    xl: 'var(--spacing-xl)',   // 2rem
    '2xl': 'var(--spacing-2xl)', // 3rem
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: 'var(--radius-sm)',    // 0.25rem
    md: 'var(--radius-md)',    // 0.5rem
    lg: 'var(--radius-lg)',    // 0.75rem
    xl: 'var(--radius-xl)',    // 1rem
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    none: 'none',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Component Variants
export const componentVariants = {
  button: {
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
    variants: {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
      outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-500',
      ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
      destructive: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
    },
  },
  
  card: {
    variants: {
      default: 'bg-white border border-neutral-200 shadow-sm',
      elevated: 'bg-white border border-neutral-200 shadow-md',
      outlined: 'bg-white border-2 border-neutral-200',
      ghost: 'bg-transparent border-none',
    },
  },
  
  input: {
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    },
    variants: {
      default: 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500',
      error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
      success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
    },
  },
};

// Utility Functions
export const designUtils = {
  // Color utilities
  getColor: (color, shade = 500) => designTokens.colors[color]?.[shade] || color,
  
  // Spacing utilities
  getSpacing: (size) => designTokens.spacing[size] || size,
  
  // Typography utilities
  getFontSize: (size) => designTokens.typography.fontSize[size] || size,
  getFontWeight: (weight) => designTokens.typography.fontWeight[weight] || weight,
  
  // Responsive utilities
  isMobile: () => window.innerWidth < parseInt(designTokens.breakpoints.md),
  isTablet: () => {
    const width = window.innerWidth;
    return width >= parseInt(designTokens.breakpoints.md) && width < parseInt(designTokens.breakpoints.lg);
  },
  isDesktop: () => window.innerWidth >= parseInt(designTokens.breakpoints.lg),
  
  // Animation utilities
  getTransition: (speed = 'normal') => designTokens.transitions[speed],
  
  // Generate CSS custom properties
  generateCSSVariables: () => {
    const variables = {};
    
    // Colors
    Object.entries(designTokens.colors).forEach(([colorName, shades]) => {
      Object.entries(shades).forEach(([shade, value]) => {
        variables[`--color-${colorName}-${shade}`] = value;
      });
    });
    
    // Typography
    Object.entries(designTokens.typography.fontSize).forEach(([size, value]) => {
      variables[`--font-size-${size}`] = value;
    });
    
    Object.entries(designTokens.typography.fontWeight).forEach(([weight, value]) => {
      variables[`--font-weight-${weight}`] = value;
    });
    
    return variables;
  },
};

// Theme Configuration
export const themeConfig = {
  light: {
    background: 'rgb(255, 255, 255)',
    foreground: 'rgb(24, 24, 27)',
    card: 'rgb(255, 255, 255)',
    cardForeground: 'rgb(24, 24, 27)',
    popover: 'rgb(255, 255, 255)',
    popoverForeground: 'rgb(24, 24, 27)',
    primary: 'rgb(142, 191, 71)',
    primaryForeground: 'rgb(255, 255, 255)',
    secondary: 'rgb(248, 249, 250)',
    secondaryForeground: 'rgb(24, 24, 27)',
    muted: 'rgb(248, 249, 250)',
    mutedForeground: 'rgb(113, 115, 122)',
    accent: 'rgb(248, 249, 250)',
    accentForeground: 'rgb(24, 24, 27)',
    destructive: 'rgb(239, 68, 68)',
    destructiveForeground: 'rgb(255, 255, 255)',
    border: 'rgb(228, 230, 232)',
    input: 'rgb(228, 230, 232)',
    ring: 'rgb(24, 24, 27)',
  },
  
  dark: {
    background: 'rgb(24, 24, 27)',
    foreground: 'rgb(248, 249, 250)',
    card: 'rgb(24, 24, 27)',
    cardForeground: 'rgb(248, 249, 250)',
    popover: 'rgb(24, 24, 27)',
    popoverForeground: 'rgb(248, 249, 250)',
    primary: 'rgb(142, 191, 71)',
    primaryForeground: 'rgb(24, 24, 27)',
    secondary: 'rgb(38, 40, 43)',
    secondaryForeground: 'rgb(248, 249, 250)',
    muted: 'rgb(38, 40, 43)',
    mutedForeground: 'rgb(161, 163, 170)',
    accent: 'rgb(38, 40, 43)',
    accentForeground: 'rgb(248, 249, 250)',
    destructive: 'rgb(239, 68, 68)',
    destructiveForeground: 'rgb(248, 249, 250)',
    border: 'rgb(63, 65, 70)',
    input: 'rgb(63, 65, 70)',
    ring: 'rgb(248, 249, 250)',
  },
};

export default {
  tokens: designTokens,
  variants: componentVariants,
  utils: designUtils,
  theme: themeConfig,
}; 