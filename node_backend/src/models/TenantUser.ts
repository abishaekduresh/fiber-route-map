export interface TenantUser {
  id: number;
  uuid: string;
  tenantId: number;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  address?: string;
  countryId?: number;
  tenantBusinessId?: number;
  roleId?: number;
  password?: string;
  status: 'active' | 'blocked';
  createdAt: Date;
  updatedAt: Date;

  // Joins
  countryName?: string;
  tenantBusinessName?: string;
  roleName?: string;
  roleSlug?: string;
  countryUuid?: string;
  tenantBusinessUuid?: string;
  roleUuid?: string;
}

export interface CreateTenantUserDTO {
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  countryUuid?: string;
  tenantBusinessUuid?: string;
  roleUuid?: string;
  password: string;
}

export interface UpdateTenantUserDTO {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  countryUuid?: string;
  tenantBusinessUuid?: string;
  roleUuid?: string;
  password?: string;
  status?: 'active' | 'blocked';
}
