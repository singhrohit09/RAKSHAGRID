import { ResourceItem } from '../types/resource';

export const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: 'RES-WAT-001',
    name: 'Packaged Drinking Water (20L Jerrycans)',
    category: 'food_water',
    quantityAvailable: 4200,
    quantityAllocated: 1800,
    unit: 'jerrycans',
    storageLocation: 'Central Relief Warehouse Alpha',
    minThreshold: 1500,
    status: 'Sufficient',
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'RES-MED-002',
    name: 'Field Trauma & Wound Dressing Kits',
    category: 'medical',
    quantityAvailable: 140,
    quantityAllocated: 120,
    unit: 'trauma kits',
    storageLocation: 'Civil Hospital Emergency Reserve',
    minThreshold: 200,
    status: 'Low Stock',
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'RES-BOAT-003',
    name: 'Inflatable Zodiac Rescue Boats with Outboard Motor',
    category: 'rescue_gear',
    quantityAvailable: 18,
    quantityAllocated: 14,
    unit: 'boats',
    storageLocation: 'Riverine Water Rescue Station',
    minThreshold: 10,
    status: 'Sufficient',
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'RES-RTE-004',
    name: 'Ready-to-Eat High Protein Meal Rations (MRE)',
    category: 'food_water',
    quantityAvailable: 8500,
    quantityAllocated: 3400,
    unit: 'ration packets',
    storageLocation: 'East District Supply Depot',
    minThreshold: 3000,
    status: 'Sufficient',
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'RES-GEN-005',
    name: 'Mobile Silent Diesel Generators (25 kVA)',
    category: 'temporary_shelter',
    quantityAvailable: 6,
    quantityAllocated: 5,
    unit: 'gensets',
    storageLocation: 'Power Grid Emergency Workshop',
    minThreshold: 8,
    status: 'Critical',
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'RES-COM-006',
    name: 'VHF/UHF Dual-Band Tactical Handheld Radios',
    category: 'communication',
    quantityAvailable: 85,
    quantityAllocated: 60,
    unit: 'transceivers',
    storageLocation: 'Police Communications HQ',
    minThreshold: 40,
    status: 'Sufficient',
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'RES-PPE-007',
    name: 'Level B Chemical Hazmat Protective Suits',
    category: 'protective_equipment',
    quantityAvailable: 45,
    quantityAllocated: 35,
    unit: 'suits',
    storageLocation: 'Industrial Fire Staging Bay',
    minThreshold: 50,
    status: 'Low Stock',
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'RES-VEH-008',
    name: 'High-Clearance 4x4 Troop & Rescue Transporters',
    category: 'vehicles',
    quantityAvailable: 12,
    quantityAllocated: 9,
    unit: 'vehicles',
    storageLocation: 'State Police Motor Pool',
    minThreshold: 8,
    status: 'Sufficient',
    updatedAt: new Date(Date.now() - 3600000 * 7).toISOString()
  }
];
