export interface Lco {
  id: number;
  uuid: string;
  tenantId: number;
  tenantBusinessId: number;
  businessName: string;
  code: string;
  lcoName: string;
  phone: string;
  email: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  countryId: number | null;
  status: 'active' | 'inactive' | 'deleted';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateLcoDTO {
  businessName: string;
  lcoName: string;
  phone: string;
  email: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  countryId?: number;
  status?: 'active' | 'inactive';
}

export interface UpdateLcoDTO extends Omit<Partial<CreateLcoDTO>, 'status'> {
  status?: 'active' | 'inactive' | 'deleted';
}
