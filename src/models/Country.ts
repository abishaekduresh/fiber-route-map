export interface Country {
  uuid: string;
  name: string;
  code: string;
  phone_code: string;
  status: 'active' | 'blocked' | 'deleted';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type CreateCountryDTO = Pick<Country, 'name' | 'code' | 'phone_code'>;
export type UpdateCountryDTO = Partial<CreateCountryDTO>;
