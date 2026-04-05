export interface TenantBusiness {
  uuid: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  type: 'operator' | 'distributor';
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
}

export type CreateTenantBusinessDTO = {
  name: string;
  address: string;
  email: string;
  phone: string;
  type: 'operator' | 'distributor';
  countryUuid?: string;
};

export type UpdateTenantBusinessDTO = Partial<CreateTenantBusinessDTO>;
