export type Role = 'ADMIN' | 'CUSTOMER' | 'EMPLOYEE'

export interface User {
  id: string
  email: string
  name?: string
  role: Role
  emailVerified?: Date
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface Customer extends User {
  customer: {
    id: string
    name: string
    email: string
    phone?: string
    status: 'ACTIVE' | 'INACTIVE'
    createdAt: Date
    updatedAt: Date
  }
}

export interface Employee extends User {
  employee: {
    id: string
    name: string
    email: string
    phone?: string
    status: 'ACTIVE' | 'INACTIVE'
    createdAt: Date
    updatedAt: Date
  }
}

export interface Session {
  user: User
  expires: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  name: string
  role: Role
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  password: string
} 