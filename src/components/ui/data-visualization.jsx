// Data Visualization Components for Dashboards
import React from 'react';
import { cn } from '../../lib/utils';

// Stat Card Component
export const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  className,
  ...props 
}) => {
  const changeColors = {
    positive: 'text-success-600 bg-success-50',
    negative: 'text-error-600 bg-error-50',
    neutral: 'text-neutral-600 bg-neutral-50',
  };

  const changeIcons = {
    positive: '↗',
    negative: '↘',
    neutral: '→',
  };

  return (
    <div className={cn(
      "p-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700",
      "hover:shadow-md transition-shadow duration-200",
      className
    )} {...props}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
        )}
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            changeColors[changeType]
          )}>
            <span className="mr-1">{changeIcons[changeType]}</span>
            {change}
          </span>
        </div>
      )}
    </div>
  );
};

// Progress Bar Component
export const ProgressBar = ({ 
  value, 
  max = 100, 
  label, 
  color = 'primary',
  showPercentage = true,
  className,
  ...props 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    info: 'bg-info-500',
  };

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
          {showPercentage && (
            <span className="text-neutral-500 dark:text-neutral-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300 ease-out",
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Simple Bar Chart Component
export const BarChart = ({ 
  data, 
  height = 200, 
  color = 'primary',
  className,
  ...props 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  const colorClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600',
    success: 'bg-success-500 hover:bg-success-600',
    warning: 'bg-warning-500 hover:bg-warning-600',
    error: 'bg-error-500 hover:bg-error-600',
    info: 'bg-info-500 hover:bg-info-600',
  };

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div 
        className="flex items-end space-x-2"
        style={{ height: `${height}px` }}
      >
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className={cn(
                "w-full rounded-t transition-all duration-300 hover:scale-105",
                colorClasses[color]
              )}
              style={{ 
                height: `${(item.value / maxValue) * 100}%`,
                minHeight: '4px'
              }}
            />
            <span className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple Line Chart Component
export const LineChart = ({ 
  data, 
  height = 200, 
  color = 'primary',
  showPoints = true,
  className,
  ...props 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  
  const colorClasses = {
    primary: 'stroke-primary-500 fill-primary-50',
    success: 'stroke-success-500 fill-success-50',
    warning: 'stroke-warning-500 fill-warning-50',
    error: 'stroke-error-500 fill-error-50',
    info: 'stroke-info-500 fill-info-50',
  };

  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((item.value - minValue) / range) * 100,
    label: item.label,
    value: item.value,
  }));

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className={cn("relative", className)} {...props}>
      <svg
        width="100%"
        height={height}
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-neutral-200 dark:text-neutral-700"
          />
        ))}
        
        {/* Line path */}
        <path
          d={pathData}
          strokeWidth="2"
          fill="none"
          className={colorClasses[color].split(' ')[0]}
        />
        
        {/* Fill area */}
        <path
          d={`${pathData} L 100 100 L 0 100 Z`}
          fill="currentColor"
          className={colorClasses[color].split(' ')[1]}
          opacity="0.1"
        />
        
        {/* Points */}
        {showPoints && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill="currentColor"
            className={colorClasses[color].split(' ')[0]}
          />
        ))}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-2">
        {data.map((item, index) => (
          <span key={index} className="text-center">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// Pie Chart Component
export const PieChart = ({ 
  data, 
  size = 200, 
  className,
  ...props 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const colors = [
    'rgb(142, 191, 71)',   // primary
    'rgb(233, 196, 106)',  // accent
    'rgb(59, 130, 246)',   // info
    'rgb(234, 179, 8)',    // warning
    'rgb(239, 68, 68)',    // error
  ];

  return (
    <div className={cn("flex items-center space-x-6", className)} {...props}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="transform -rotate-90"
        >
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {item.label}
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Metric Card Component
export const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue,
  icon: Icon,
  className,
  ...props 
}) => {
  const trendColors = {
    up: 'text-success-600',
    down: 'text-error-600',
    neutral: 'text-neutral-600',
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  return (
    <div className={cn(
      "p-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700",
      "hover:shadow-md transition-all duration-200",
      className
    )} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {Icon && (
              <Icon className="h-5 w-5 text-neutral-400" />
            )}
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {title}
            </p>
          </div>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {trend && (
          <div className={cn("flex items-center space-x-1", trendColors[trend])}>
            <span className="text-lg">{trendIcons[trend]}</span>
            <span className="text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Activity Feed Component
export const ActivityFeed = ({ 
  activities, 
  className,
  ...props 
}) => {
  const getActivityIcon = (type) => {
    const icons = {
      service: '🦮',
      payment: '💳',
      user: '👤',
      system: '⚙️',
      notification: '🔔',
    };
    return icons[type] || '📝';
  };

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="text-lg">{getActivityIcon(activity.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {activity.title}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {activity.description}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// All components are already exported individually above 