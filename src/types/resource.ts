export type ResourceCategory = 
  | 'food_water' 
  | 'medical' 
  | 'rescue_gear' 
  | 'vehicles' 
  | 'temporary_shelter' 
  | 'communication' 
  | 'protective_equipment';

export type ResourceStatus = 'Sufficient' | 'Low Stock' | 'Critical' | 'Depleted';

export interface ResourceItem {
  id: string;
  name: string;
  category: ResourceCategory;
  quantityAvailable: number;
  quantityAllocated: number;
  unit: string;
  storageLocation: string;
  minThreshold: number;
  status: ResourceStatus;
  updatedAt: string;
}
