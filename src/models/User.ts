export interface User {
  uuid: string;
  email: string;
  username: string;
  name: string;
  phone: string;
  status: 'active' | 'blocked' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export type CreateUserDTO = Pick<User, 'email' | 'username' | 'name' | 'phone'> & { password: string };
export type UpdateUserDTO = Partial<CreateUserDTO>;
