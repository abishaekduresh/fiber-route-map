export interface User {
  uuid: string;
  email: string;
  name: string;
  phone: string | number;
  password?: string;
  status: 'active' | 'blocked' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export type CreateUserDTO = Pick<User, 'email' | 'name' | 'phone' | 'password'>;
export type UpdateUserDTO = Partial<CreateUserDTO>;
