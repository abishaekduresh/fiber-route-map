import { Permission } from './Permission.js';

export interface Role {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'inactive';
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type CreateRoleDTO = Pick<Role, 'name' | 'slug' | 'description'> & { status?: 'active' | 'inactive' };
export type UpdateRoleDTO = Partial<CreateRoleDTO>;
