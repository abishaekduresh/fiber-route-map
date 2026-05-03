export interface TenantUser {
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: 'active' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantUserDTO {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  password: string;
}

export interface UpdateTenantUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}
