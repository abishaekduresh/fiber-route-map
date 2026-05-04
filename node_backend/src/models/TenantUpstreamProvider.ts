export type ServiceCategory = 'cabletv' | 'bandwidth' | 'iptv' | 'hybrid';
export type ProviderStatus = 'active' | 'inactive' | 'blocked' | 'deleted';

export interface TenantUpstreamProvider {
  id: number;
  uuid: string;
  tenantBusinessId: number;
  name: string;
  code: string;
  serviceCategory: ServiceCategory;
  contactPerson: string;
  phone: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  countryId: number | null;
  status: ProviderStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateUpstreamProviderDTO {
  name: string;
  serviceCategory: ServiceCategory;
  contactPerson: string;
  phone: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  countryId?: number | null;
}

export interface UpdateUpstreamProviderDTO {
  name?: string;
  serviceCategory?: ServiceCategory;
  contactPerson?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  countryId?: number | null;
  status?: ProviderStatus;
}
