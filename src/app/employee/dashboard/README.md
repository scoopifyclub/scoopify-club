# Employee Dashboard

This directory contains the employee dashboard for the Scoopify Club application. The dashboard provides employees with tools to manage their schedules, customers, services, and communications.

## Structure

- `layout.tsx` - Main dashboard layout with navigation sidebar
- `page.tsx` - Root page that redirects to the overview tab
- `/overview` - Dashboard homepage with summary statistics
- `/schedule` - Weekly calendar view of appointments
- `/customers` - Customer management interface
- `/services` - Yard cleanup service management
- `/maps` - Service locations and route optimization
- `/messages` - Internal messaging system
- `/profile` - Employee profile management
- `/settings` - Account settings and preferences

## Key Features

### Authentication & Protection

All dashboard pages are protected and require authentication with the `EMPLOYEE` role. Unauthorized users are redirected to the login page.

Example authentication check (used in all pages):

```typescript
useEffect(() => {
  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/employee/dashboard');
    return;
  }
  
  // Verify user is an employee
  if (status === 'authenticated' && session?.user?.role !== 'EMPLOYEE') {
    router.push('/');
    return;
  }

  // Page-specific initialization...
}, [status, session, router]);
```

### Tab Navigation

The dashboard uses a tab-based navigation system that:
- Persists the active tab in localStorage
- Synchronizes the URL with the selected tab
- Provides visual feedback for the active tab

### Data Management

Each dashboard page follows a similar pattern for data management:
1. Define TypeScript interfaces for page-specific data
2. Initialize state with empty values
3. Fetch mock data on component mount
4. Update the state with the fetched data
5. Provide loading and error states

In a production environment, the mock data would be replaced with actual API calls.

## UI Components

The dashboard uses the following UI components:
- `Card` - Container for content sections
- `Button` - Interactive buttons with different variants
- `Input` - Form input fields
- `Badge` - Status indicators
- `Avatar` - User profile images
- `Select` - Dropdown selection menus
- `Checkbox` - Toggle input controls

## Mock Data Structure

The dashboard currently uses mock data for demonstration purposes. The data structures are designed to mimic real API responses and include:

- Customer information
- Service appointments
- Locations and routes
- Messages and conversations
- Employee profile data

## Adding New Dashboard Pages

To add a new dashboard tab page:

1. Create a new directory in `src/app/employee/dashboard/[tab-name]`
2. Create a `page.tsx` file within that directory
3. Implement the page with authentication and data fetching
4. Add the tab to the navigation sidebar in `layout.tsx`

## Future Enhancements

- Implement real API integration
- Add data filtering and search capabilities
- Implement real-time notifications
- Add analytics and reporting features
- Integrate with map services for route optimization 