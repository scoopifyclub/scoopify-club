import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceDetails } from '../ServiceDetails';

// Mock the Dialog component since it might use portals or other complex behaviors
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>,
}));

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
}));

describe('ServiceDetails Component', () => {
  const mockService = {
    id: '1',
    status: 'SCHEDULED',
    scheduledDate: '2023-05-15T10:00:00Z',
    customer: {
      email: 'test@example.com',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
      },
    },
    servicePlan: {
      name: 'Basic Plan',
      duration: 75, // 1h 15m
    },
    notes: 'Test service notes',
    latitude: 35.123,
    longitude: -80.456,
  };

  const mockOnClose = jest.fn();
  const mockOnClaim = jest.fn();
  const mockOnArrive = jest.fn();
  const mockOnComplete = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders service details when service is provided', () => {
    render(
      <ServiceDetails
        service={mockService}
        onClose={mockOnClose}
        onClaim={mockOnClaim}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.getByText('Test City, TS 12345')).toBeInTheDocument();
    expect(screen.getByText('Test service notes')).toBeInTheDocument();
    expect(screen.getByText('1h 15m')).toBeInTheDocument();
  });

  test('does not render when service is null', () => {
    render(
      <ServiceDetails
        service={null}
        onClose={mockOnClose}
        onClaim={mockOnClaim}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <ServiceDetails
        service={mockService}
        onClose={mockOnClose}
        onClaim={mockOnClaim}
      />
    );

    fireEvent.click(screen.getByTestId('button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('shows claim button when status is SCHEDULED and onClaim is provided', () => {
    render(
      <ServiceDetails
        service={mockService}
        onClose={mockOnClose}
        onClaim={mockOnClaim}
      />
    );

    const claimButton = screen.getByText('Claim Job');
    expect(claimButton).toBeInTheDocument();
    
    fireEvent.click(claimButton);
    expect(mockOnClaim).toHaveBeenCalledTimes(1);
  });

  test('shows arrive button when status is CLAIMED and onArrive is provided', () => {
    const claimedService = { ...mockService, status: 'CLAIMED' };
    
    render(
      <ServiceDetails
        service={claimedService}
        onClose={mockOnClose}
        onArrive={mockOnArrive}
      />
    );

    const arriveButton = screen.getByText('Mark as Arrived');
    expect(arriveButton).toBeInTheDocument();
    
    fireEvent.click(arriveButton);
    expect(mockOnArrive).toHaveBeenCalledTimes(1);
  });

  test('shows complete button when status is ARRIVED and onComplete is provided', () => {
    const arrivedService = { ...mockService, status: 'ARRIVED' };
    
    render(
      <ServiceDetails
        service={arrivedService}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    const completeButton = screen.getByText('Complete Service');
    expect(completeButton).toBeInTheDocument();
    
    fireEvent.click(completeButton);
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  test('disables claim button when hasInProgressJob is true', () => {
    render(
      <ServiceDetails
        service={mockService}
        onClose={mockOnClose}
        onClaim={mockOnClaim}
        hasInProgressJob={true}
      />
    );

    expect(screen.getByText('Complete Current Job First')).toBeInTheDocument();
    expect(screen.getByText('You must complete your current job before claiming a new one.')).toBeInTheDocument();
  });
}); 