import { Shelter } from '../types/shelter';

export const INITIAL_SHELTERS: Shelter[] = [
  {
    id: 'SHL-NORTH-01',
    name: 'Sector 4 Community Sports Complex',
    address: 'Ring Road Plot 14, Demo Sector 4',
    region: 'North Basin Riverine Zone',
    latitude: 28.6480,
    longitude: 77.2280,
    capacity: 1200,
    currentOccupancy: 940,
    status: 'Near Capacity',
    facilities: {
      water: true,
      medical: true,
      electricity: true,
      food: true,
      wheelchairAccess: true,
      sanitation: true,
      childCare: true
    },
    contactPerson: 'Aditi Sharma (Shelter In-Charge)',
    contactPhone: '+91 98111-DEMO1',
    notes: 'Primary reception center for low-lying riverbank evacuees. Backup diesel generator operational.',
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'SHL-EAST-02',
    name: 'Govt Model Senior Secondary School 11',
    address: 'Vikas Marg Extension, Sector 11',
    region: 'East District Inundation Zone',
    latitude: 28.6320,
    longitude: 77.2850,
    capacity: 850,
    currentOccupancy: 810,
    status: 'Near Capacity',
    facilities: {
      water: true,
      medical: true,
      electricity: true,
      food: true,
      wheelchairAccess: false,
      sanitation: true,
      childCare: false
    },
    contactPerson: 'Rameshwar Dayal (Principal / Coordinator)',
    contactPhone: '+91 98111-DEMO2',
    notes: '2nd floor classrooms converted to sleeping quarters. Medical triage corner active.',
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'SHL-SOUTH-03',
    name: 'South Ridge Polytechnic Auditorium',
    address: 'Mehrauli-Badarpur Corridor, Sector 18',
    region: 'South Uplands Buffer',
    latitude: 28.5200,
    longitude: 77.2200,
    capacity: 1500,
    currentOccupancy: 420,
    status: 'Open',
    facilities: {
      water: true,
      medical: true,
      electricity: true,
      food: true,
      wheelchairAccess: true,
      sanitation: true,
      childCare: true
    },
    contactPerson: 'Kavita Nair (Disaster Officer)',
    contactPhone: '+91 98111-DEMO3',
    notes: 'High elevation safe zone. Ample parking for supply logistics and ambulances.',
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'SHL-WEST-04',
    name: 'District Indoor Badminton Arena',
    address: 'Najafgarh Road, Demo West Sector 7',
    region: 'West Drainage Corridor',
    latitude: 28.6520,
    longitude: 77.1350,
    capacity: 600,
    currentOccupancy: 600,
    status: 'Full',
    facilities: {
      water: true,
      medical: false,
      electricity: true,
      food: true,
      wheelchairAccess: true,
      sanitation: true,
      childCare: false
    },
    contactPerson: 'Sunil Kumar (Stadium Mgr)',
    contactPhone: '+91 98111-DEMO4',
    notes: 'Full capacity reached. Evacuation buses being rerouted to South Ridge Polytechnic.',
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'SHL-CENTRAL-05',
    name: 'Old Exhibition Hall C',
    address: 'Pragati Enclave Gate 4',
    region: 'Central Command Buffer',
    latitude: 28.6180,
    longitude: 77.2410,
    capacity: 2000,
    currentOccupancy: 350,
    status: 'Open',
    facilities: {
      water: true,
      medical: true,
      electricity: true,
      food: true,
      wheelchairAccess: true,
      sanitation: true,
      childCare: true
    },
    contactPerson: 'Harsh Vardhan (Venue Lead)',
    contactPhone: '+91 98111-DEMO5',
    notes: 'Large cavernous hall with industrial air scrubbing. Secondary triage post available.',
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];
