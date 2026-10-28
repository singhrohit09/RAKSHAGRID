export type ShelterStatus = 'Open' | 'Near Capacity' | 'Full' | 'Closed';

export interface ShelterFacility {
  water: boolean;
  medical: boolean;
  electricity: boolean;
  food: boolean;
  wheelchairAccess: boolean;
  sanitation: boolean;
  childCare: boolean;
}

export interface Shelter {
  id: string;
  name: string;
  address: string;
  region: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  status: ShelterStatus;
  facilities: ShelterFacility;
  contactPerson: string;
  contactPhone: string; // Fictional demo
  notes: string;
  updatedAt: string;
}

