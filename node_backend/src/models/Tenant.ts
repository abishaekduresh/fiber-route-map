export interface Tenant {
  uuid: string;
  email: string;
  username: string;
  name: string;
  address: string;
  status: 'active' | 'blocked' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
  phone: string;
  country?: {
    uuid: string;
    name: string;
    code: string;
    phoneCode: string;
  } | null;
  role?: {
    uuid: string;
    name: string;
    slug: string;
  } | null;
  business?: {
    uuid: string;
    name: string;
    type: 'operator' | 'distributor';
  } | null;
}

export type CreateTenantDTO = {
  email: string;
  username: string;
  name: string;
  phone: string;
  address: string;
  password: string;
  countryUuid?: string;
  roleUuid?: string;
  tenantBusinessUuid?: string;
};

export type UpdateTenantDTO = Partial<Omit<CreateTenantDTO, 'password'>>;
