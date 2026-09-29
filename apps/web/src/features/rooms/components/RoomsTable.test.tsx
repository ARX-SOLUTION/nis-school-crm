import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RoomResponseDto } from '@nis/shared';
import { RoomsTable } from './RoomsTable';

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const mockRoom: RoomResponseDto = {
  id: 'room-1',
  roomNumber: '101',
  name: 'Physics Lab',
  capacity: 32,
  type: 'LAB',
  floor: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('RoomsTable', () => {
  it('should render room number, name, capacity, and type', () => {
    renderWithClient(<RoomsTable rooms={[mockRoom]} canManage={true} />);
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('Physics Lab')).toBeInTheDocument();
    expect(screen.getByText('32 seats')).toBeInTheDocument();
    expect(screen.getByText('LAB')).toBeInTheDocument();
  });

  it('should render empty state when room list is empty', () => {
    renderWithClient(<RoomsTable rooms={[]} canManage={true} />);
    expect(screen.getByText(/No rooms registered/i)).toBeInTheDocument();
  });

  it('should show delete button when canManage is true', () => {
    renderWithClient(<RoomsTable rooms={[mockRoom]} canManage={true} />);
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  it('should hide delete button when canManage is false', () => {
    renderWithClient(<RoomsTable rooms={[mockRoom]} canManage={false} />);
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });
});
