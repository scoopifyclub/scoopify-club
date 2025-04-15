# Style Guide

## Code Style

### TypeScript
- Use strict type checking
- Avoid `any` type
- Use interfaces for object shapes
- Use type aliases for complex types
- Use enums for fixed sets of values

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Bad
const user: any = { ... };
```

### React Components
- Use functional components with hooks
- Use TypeScript for props
- Keep components small and focused
- Use proper naming conventions

```typescript
// Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, onClick, children }) => {
  return (
    <button className={`btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};

// Bad
const Button = (props) => {
  return <button onClick={props.onClick}>{props.children}</button>;
};
```

### State Management
- Use React hooks for local state
- Use context for global state
- Keep state as local as possible
- Use proper state initialization

```typescript
// Good
const [count, setCount] = useState<number>(0);
const [isLoading, setIsLoading] = useState<boolean>(false);

// Bad
const [state, setState] = useState({ count: 0, isLoading: false });
```

## Naming Conventions

### Files and Directories
- Use kebab-case for file names
- Use PascalCase for component files
- Use camelCase for utility files

```
components/
  user-profile.tsx
  service-card.tsx
utils/
  formatDate.ts
  validateInput.ts
```

### Variables and Functions
- Use camelCase for variables and functions
- Use PascalCase for components and types
- Use UPPER_SNAKE_CASE for constants

```typescript
// Good
const userCount = 0;
const MAX_RETRIES = 3;
function formatDate(date: Date): string { ... }

// Bad
const UserCount = 0;
const max_retries = 3;
function FormatDate(date: Date): string { ... }
```

## Component Structure

### File Organization
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui';

// 2. Types/Interfaces
interface Props {
  title: string;
  onClose: () => void;
}

// 3. Component
export const Modal: React.FC<Props> = ({ title, onClose }) => {
  // 4. State
  const [isOpen, setIsOpen] = useState(true);

  // 5. Effects
  useEffect(() => { ... }, []);

  // 6. Handlers
  const handleClose = () => { ... };

  // 7. Render
  return (
    <div className="modal">
      <h2>{title}</h2>
      <Button onClick={handleClose}>Close</Button>
    </div>
  );
};
```

## Styling

### CSS
- Use Tailwind CSS for styling
- Follow BEM naming convention for custom classes
- Use CSS variables for theming
- Keep styles modular and scoped

```css
/* Good */
.user-profile {
  &__header {
    color: var(--primary-color);
  }
  
  &__content {
    padding: 1rem;
  }
}

/* Bad */
.header {
  color: #ff0000;
}

.content {
  padding: 10px;
}
```

### Responsive Design
- Use mobile-first approach
- Use Tailwind's responsive prefixes
- Test on multiple devices

```jsx
// Good
<div className="p-4 md:p-6 lg:p-8">
  <h2 className="text-lg md:text-xl lg:text-2xl">Title</h2>
</div>

// Bad
<div className="p-8">
  <h2 className="text-2xl">Title</h2>
</div>
```

## Error Handling

### API Calls
- Use try-catch blocks
- Handle errors gracefully
- Provide user feedback

```typescript
// Good
const fetchData = async () => {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Failed to fetch data');
  }
};

// Bad
const fetchData = async () => {
  const response = await api.get('/data');
  return response.data;
};
```

### Form Validation
- Use proper validation libraries
- Show clear error messages
- Prevent invalid submissions

```typescript
// Good
const validateForm = (data: FormData) => {
  const errors: Record<string, string> = {};
  
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  return errors;
};

// Bad
const validateForm = (data: FormData) => {
  if (!data.email) return false;
  return true;
};
```

## Performance

### Code Splitting
- Use dynamic imports
- Split by routes
- Lazy load components

```typescript
// Good
const Modal = dynamic(() => import('@/components/Modal'), {
  loading: () => <LoadingSpinner />
});

// Bad
import Modal from '@/components/Modal';
```

### Memoization
- Use useMemo for expensive calculations
- Use useCallback for event handlers
- Use React.memo for pure components

```typescript
// Good
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// Bad
const value = computeExpensiveValue(a, b);
const callback = () => doSomething(a, b);
```

## Accessibility

### Semantic HTML
- Use proper HTML elements
- Include ARIA attributes
- Ensure keyboard navigation

```jsx
// Good
<button 
  aria-label="Close modal"
  onClick={handleClose}
>
  <span className="sr-only">Close</span>
  <XIcon />
</button>

// Bad
<div onClick={handleClose}>X</div>
```

### Color Contrast
- Meet WCAG standards
- Test with color contrast tools
- Provide alternative text

```css
/* Good */
.text-primary {
  color: var(--text-primary);
  background: var(--bg-primary);
}

/* Bad */
.text {
  color: #000;
  background: #fff;
}
```

## Testing

### Unit Tests
- Test component rendering
- Test user interactions
- Test edge cases

```typescript
// Good
describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});

// Bad
test('button works', () => {
  render(<Button>Click me</Button>);
});
```

### Integration Tests
- Test component interactions
- Test API integration
- Test data flow

```typescript
// Good
describe('UserProfile', () => {
  it('fetches and displays user data', async () => {
    const mockUser = { name: 'John Doe' };
    mockApi.get.mockResolvedValue({ data: mockUser });
    
    const { findByText } = render(<UserProfile userId="123" />);
    expect(await findByText('John Doe')).toBeInTheDocument();
  });
});

// Bad
test('profile works', () => {
  render(<UserProfile />);
});
``` 