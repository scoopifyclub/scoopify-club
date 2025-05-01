import { UserRole } from './enums';

export interface ServiceArea {
  id: string;
  employeeId: string;
  zipCode: string;
  travelRange: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddServiceAreaInput {
  zipCode: string;
  travelRange: number;
  active: boolean;
}

export interface UpdateServiceAreaInput {
  id: string;
  zipCode?: string;
  travelRange?: number;
  active?: boolean;
}
