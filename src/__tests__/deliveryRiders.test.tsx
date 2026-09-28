import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { isRouteAllowed, ROLE_PERMISSIONS } from '../utils/permissions';
import { toCoordinate, deliveryService } from '../services/deliveryService';
import { apiClient } from '../services/apiClient';
import { PageErrorBoundary } from '../components/common/PageErrorBoundary';

describe('Rider Management route access', () => {
  it('is allowed for HQ Admin and Warehouse Manager (was locked for everyone)', () => {
    expect(isRouteAllowed('/riders', 'HQ Admin')).toBe(true);
    expect(isRouteAllowed('/riders', 'Warehouse Manager')).toBe(true);
    expect(isRouteAllowed('/riders', 'Finance Lead')).toBe(false);
  });

  it('every sidebar-linked rider/dispatch page is in the HQ Admin allow-list', () => {
    expect(ROLE_PERMISSIONS['HQ Admin']).toEqual(
      expect.arrayContaining(['/delivery', '/riders']),
    );
  });
});

describe('live rider coordinates', () => {
  afterEach(() => vi.restoreAllMocks());

  it('coerces Postgres DECIMAL strings to numbers and rejects junk', () => {
    expect(toCoordinate('22.57260000')).toBeCloseTo(22.5726);
    expect(toCoordinate(88.36)).toBe(88.36);
    expect(toCoordinate(null)).toBeNull();
    expect(toCoordinate('')).toBeNull();
    expect(toCoordinate('abc')).toBeNull();
    expect(toCoordinate(undefined)).toBeNull();
  });

  it('getLiveRiders returns numeric coordinates so .toFixed can never throw', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'r1', name: 'Rider', phone: '9700000001',
          current_lat: '22.57260000', current_lng: '88.36390000',
          vehicle_type: 'BIKE', is_online: true, order_id: null, delivery_status: null,
        },
        {
          id: 'r2', name: 'No GPS', phone: '9700000002',
          current_lat: null, current_lng: null,
          vehicle_type: null, is_online: true, order_id: null, delivery_status: null,
        },
      ],
    } as any);
    const riders = await deliveryService.getLiveRiders();
    expect(riders[0].current_lat!.toFixed(3)).toBe('22.573');
    expect(riders[1].current_lat).toBeNull();
  });
});

describe('PageErrorBoundary', () => {
  it('shows an error panel instead of unmounting when a page throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Boom: React.FC = () => {
      throw new Error('kaboom');
    };
    render(
      <div>
        <p>sidebar stays</p>
        <PageErrorBoundary>
          <Boom />
        </PageErrorBoundary>
      </div>,
    );
    expect(screen.getByText('sidebar stays')).toBeTruthy();
    expect(screen.getByText('This page hit an error')).toBeTruthy();
    expect(screen.getByText('kaboom')).toBeTruthy();
  });
});
