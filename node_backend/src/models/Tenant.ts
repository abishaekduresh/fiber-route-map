export interface Tenant {
  uuid: string;
  email: string;
  username: string;
  name: string;
  address: string;
  status: 'active' | 'blocked' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
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
}

export type CreateTenantDTO = {
  email: string;
  username: string;
  name: string;
  address: string;
  password: string;
  countryUuid?: string;
  roleUuid?: string;
};

export type UpdateTenantDTO = Partial<Omit<CreateTenantDTO, 'password'>>;
