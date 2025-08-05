// Enhanced Navigation Components
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '../../lib/utils';

// Enhanced Breadcrumbs Component
export const EnhancedBreadcrumbs = ({ 
  items, 
  separator = '/',
  className,
  ...props 
}) => {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-neutral-400 dark:text-neutral-500">
              {separator}
            </span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors",
                index === items.length - 1 && "text-neutral-900 dark:text-white font-medium"
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              "text-neutral-600 dark:text-neutral-400",
              index === items.length - 1 && "text-neutral-900 dark:text-white font-medium"
            )}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Quick Action Button Component
export const QuickActionButton = ({ 
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800',
    ghost: 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
  };

  const sizes = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center space-x-2 rounded-lg font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-5 w-5" />}
      <span>{label}</span>
    </button>
  );
};

// Page Header Component
export const PageHeader = ({ 
  title, 
  subtitle, 
  breadcrumbs,
  actions,
  className,
  ...props 
}) => {
  return (
    <div className={cn("mb-8", className)} {...props}>
      {breadcrumbs && (
        <div className="mb-4">
          <EnhancedBreadcrumbs items={breadcrumbs} />
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Tab Navigation Component
export const TabNavigation = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  variant = 'default',
  className,
  ...props 
}) => {
  const variants = {
    default: {
      tab: "px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
      active: "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400",
    },
    pills: {
      tab: "px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg",
      active: "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20",
    },
  };

  return (
    <div className={cn("border-b border-neutral-200 dark:border-neutral-700", className)} {...props}>
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "transition-colors duration-200",
              variants[variant].tab,
              activeTab === tab.id && variants[variant].active
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Sidebar Navigation Component
export const SidebarNavigation = ({ 
  items, 
  activeItem,
  onItemClick,
  className,
  ...props 
}) => {
  return (
    <nav className={cn("space-y-1", className)} {...props}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={cn(
            "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800",
            activeItem === item.id
              ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          {item.icon && (
            <item.icon className="mr-3 h-5 w-5" />
          )}
          {item.label}
          {item.badge && (
            <span className="ml-auto bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium px-2 py-1 rounded-full">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

// Search Navigation Component
export const SearchNavigation = ({ 
  onSearch,
  placeholder = "Search...",
  className,
  ...props 
}) => {
  const [query, setQuery] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)} {...props}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </form>
  );
};

// Filter Navigation Component
export const FilterNavigation = ({ 
  filters, 
  activeFilters,
  onFilterChange,
  className,
  ...props 
}) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} {...props}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200",
            activeFilters.includes(filter.id)
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

// Pagination Component
export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  showPageNumbers = true,
  className,
  ...props 
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className={cn("flex items-center justify-between", className)} {...props}>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {showPageNumbers && (
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                  page === currentPage
                    ? "bg-primary-500 text-white"
                    : page === '...'
                    ? "text-neutral-400 cursor-default"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                {page}
              </button>
            ))}
          </div>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

// All components are already exported individually above 