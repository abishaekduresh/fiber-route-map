export interface User {
  uuid: string;
  email: string;
  username: string;
  name: string;
  phone: string;
  status: 'active' | 'blocked' | 'deleted';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  country?: {
    id: string;
    name: string;
    code: string;
    phoneCode: string;
  } | null;
  roles?: {
    uuid: string;
    name: string;
    slug: string;
  }[];
}

export type CreateUserDTO = Pick<User, 'email' | 'username' | 'name' | 'phone'> & { 
  password: string; 
  countryUuid: string;
  roleUuids?: string[];
};
export type UpdateUserDTO = Partial<CreateUserDTO>;
