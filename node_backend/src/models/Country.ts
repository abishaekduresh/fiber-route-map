export interface Country {
  uuid: string;
  name: string;
  code: string;
  phoneCode: string;
  status: 'active' | 'blocked' | 'deleted';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type CreateCountryDTO = Pick<Country, 'name' | 'code' | 'phoneCode'>;
export type UpdateCountryDTO = Partial<CreateCountryDTO>;
