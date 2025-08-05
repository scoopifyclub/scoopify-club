// Dashboard Enhancements - Comprehensive UI Improvements
import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import {
  StatCard,
  ProgressBar,
  BarChart,
  LineChart,
  PieChart,
  MetricCard,
  ActivityFeed,
} from './data-visualization';
import {
  PageHeader,
  TabNavigation,
  SearchNavigation,
  FilterNavigation,
  Pagination,
  QuickActionButton,
} from './enhanced-navigation';
import {
  LoadingSpinner,
  LoadingOverlay,
  DashboardCardSkeleton,
  ListLoading,
} from './loading-states';

// Enhanced Dashboard Layout Component
export const EnhancedDashboard = ({ 
  title = "Dashboard",
  subtitle,
  breadcrumbs,
  children,
  loading = false,
  className,
  ...props 
}) => {
  return (
    <div className={cn("min-h-screen bg-neutral-50 dark:bg-neutral-900", className)} {...props}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
        />
        
        <LoadingOverlay isLoading={loading}>
          {children}
        </LoadingOverlay>
      </div>
    </div>
  );
};

// Dashboard Stats Grid Component
export const DashboardStatsGrid = ({ 
  stats, 
  loading = false,
  className,
  ...props 
}) => {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)} {...props}>
        {Array.from({ length: 4 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)} {...props}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
        />
      ))}
    </div>
  );
};

// Dashboard Charts Section Component
export const DashboardChartsSection = ({ 
  charts,
  loading = false,
  className,
  ...props 
}) => {
  const [activeTab, setActiveTab] = useState(charts?.[0]?.id || 'overview');

  if (loading) {
    return (
      <div className={cn("space-y-6", className)} {...props}>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
            <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeChart = charts?.find(chart => chart.id === activeTab);

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {charts && charts.length > 1 && (
        <TabNavigation
          tabs={charts.map(chart => ({ id: chart.id, label: chart.label }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
      
      {activeChart && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {activeChart.title}
          </h3>
          
          {activeChart.type === 'bar' && (
            <BarChart
              data={activeChart.data}
              height={300}
              color={activeChart.color}
            />
          )}
          
          {activeChart.type === 'line' && (
            <LineChart
              data={activeChart.data}
              height={300}
              color={activeChart.color}
            />
          )}
          
          {activeChart.type === 'pie' && (
            <PieChart
              data={activeChart.data}
              size={300}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Dashboard Activity Section Component
export const DashboardActivitySection = ({ 
  activities,
  loading = false,
  className,
  ...props 
}) => {
  if (loading) {
    return (
      <div className={cn("bg-white dark:bg-neutral-800 rounded-lg p-6", className)} {...props}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-lg p-6", className)} {...props}>
      <ActivityFeed activities={activities} />
    </div>
  );
};

// Dashboard Data Table Component
export const DashboardDataTable = ({ 
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = true,
  paginated = true,
  className,
  ...props 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter data based on search and filters
  const filteredData = data?.filter(item => {
    const matchesSearch = !searchQuery || 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesFilters = activeFilters.length === 0 || 
      activeFilters.every(filter => item[filter.field] === filter.value);
    
    return matchesSearch && matchesFilters;
  }) || [];

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = paginated 
    ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredData;

  if (loading) {
    return (
      <div className={cn("bg-white dark:bg-neutral-800 rounded-lg", className)} {...props}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded flex-1"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-lg", className)} {...props}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Data Table
          </h3>
          
          <div className="flex items-center space-x-3">
            {searchable && (
              <SearchNavigation
                onSearch={setSearchQuery}
                placeholder="Search data..."
              />
            )}
            
            {filterable && (
              <FilterNavigation
                filters={[
                  { id: 'status', label: 'Active' },
                  { id: 'type', label: 'Type A' },
                  { id: 'category', label: 'Category 1' },
                ]}
                activeFilters={activeFilters}
                onFilterChange={(filterId) => {
                  setActiveFilters(prev => 
                    prev.includes(filterId) 
                      ? prev.filter(id => id !== filterId)
                      : [...prev, filterId]
                  );
                }}
              />
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="text-left py-3 px-4 text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="py-3 px-4 text-sm text-neutral-900 dark:text-white"
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {paginated && totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Dashboard Quick Actions Component
export const DashboardQuickActions = ({ 
  actions,
  className,
  ...props 
}) => {
  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-lg p-6", className)} {...props}>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <QuickActionButton
            key={index}
            icon={action.icon}
            label={action.label}
            onClick={action.onClick}
            variant={action.variant}
            size="md"
          />
        ))}
      </div>
    </div>
  );
};

// Dashboard Progress Section Component
export const DashboardProgressSection = ({ 
  progressItems,
  loading = false,
  className,
  ...props 
}) => {
  if (loading) {
    return (
      <div className={cn("bg-white dark:bg-neutral-800 rounded-lg p-6", className)} {...props}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-lg p-6", className)} {...props}>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
        Progress Overview
      </h3>
      
      <div className="space-y-6">
        {progressItems.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {item.label}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {item.value}%
              </span>
            </div>
            <ProgressBar
              value={item.value}
              color={item.color}
              showPercentage={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// All components are already exported individually above 