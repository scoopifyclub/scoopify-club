export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  emailverified: boolean;
  createdAt: string;
  updatedAt: string;
}
