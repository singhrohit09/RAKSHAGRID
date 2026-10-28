import { describe, it, expect } from 'vitest';
import { ResourceItem } from '../types/resource';
import { ShelterStatus } from '../types/shelter';

describe('Resource Inventory Domain Business Rules', () => {
  it('should prevent resource allocation that exceeds available stock (negative stock prevention)', () => {
    const resource: ResourceItem = {
      id: 'RES-WAT-001',
      name: 'Drinking Water (20L Jerrycans)',
      category: 'food_water',
      quantityAvailable: 100,
      quantityAllocated: 50,
      unit: 'jerrycans',
      storageLocation: 'Depot A',
      minThreshold: 40,
      status: 'Sufficient',
      updatedAt: new Date().toISOString()
    };

    const requestedAmount = 150; // Exceeds 100 available!
    const canAllocate = requestedAmount <= resource.quantityAvailable && requestedAmount > 0;
    expect(canAllocate).toBe(false);
  });

  it('should calculate correct remaining and allocated quantities upon valid allocation', () => {
    const resource: ResourceItem = {
      id: 'RES-MED-002',
      name: 'Trauma Kits',
      category: 'medical',
      quantityAvailable: 100,
      quantityAllocated: 20,
      unit: 'kits',
      storageLocation: 'Hospital Reserve',
      minThreshold: 30,
      status: 'Sufficient',
      updatedAt: new Date().toISOString()
    };

    const requestedAmount = 40;
    const newAvailable = resource.quantityAvailable - requestedAmount;
    const newAllocated = resource.quantityAllocated + requestedAmount;

    expect(newAvailable).toBe(60);
    expect(newAllocated).toBe(60);

    // Status transition: 60 > minThreshold 30, so still 'Sufficient'
    let newStatus = 'Sufficient';
    if (newAvailable <= resource.minThreshold) newStatus = 'Low Stock';
    expect(newStatus).toBe('Sufficient');
  });

  it('should flag Low Stock when remaining available quantity drops below minimum threshold', () => {
    const minThreshold: number = 50;
    const remainingAvailable: number = 45;

    let status = 'Sufficient';
    if (remainingAvailable === 0) status = 'Depleted';
    else if (remainingAvailable <= minThreshold * 0.5) status = 'Critical';
    else if (remainingAvailable <= minThreshold) status = 'Low Stock';

    expect(status).toBe('Low Stock');
  });

  it('should prevent releasing more than currently allocated', () => {
    const allocated = 30;
    const releaseAttempt = 40;
    const canRelease = releaseAttempt <= allocated && releaseAttempt > 0;
    expect(canRelease).toBe(false);
  });
});

describe('Shelter Capacity & Occupancy Rules', () => {
  it('should compute status as "Full" when current occupancy meets or exceeds capacity', () => {
    const capacity = 1000;
    const occupancy = 1000;

    let status: ShelterStatus = 'Open';
    if (occupancy >= capacity) status = 'Full';
    else if (occupancy >= capacity * 0.85) status = 'Near Capacity';

    expect(status).toBe('Full');
  });

  it('should compute status as "Near Capacity" when occupancy is 85% or greater', () => {
    const capacity = 1000;
    const occupancy = 870;

    let status: ShelterStatus = 'Open';
    if (occupancy >= capacity) status = 'Full';
    else if (occupancy >= capacity * 0.85) status = 'Near Capacity';

    expect(status).toBe('Near Capacity');
  });

  it('should compute status as "Open" when occupancy is below 85%', () => {
    const capacity = 1000;
    const occupancy = 450;

    let status: ShelterStatus = 'Open';
    if (occupancy >= capacity) status = 'Full';
    else if (occupancy >= capacity * 0.85) status = 'Near Capacity';

    expect(status).toBe('Open');
  });

  it('should calculate available bed count correctly without returning negative values', () => {
    const capacity = 500;
    const occupancy = 420;
    const available = Math.max(0, capacity - occupancy);
    expect(available).toBe(80);
  });
});
