import { UserRole } from './enums';

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}
