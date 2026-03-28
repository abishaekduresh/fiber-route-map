export interface Permission {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreatePermissionDTO = Pick<Permission, 'name' | 'slug' | 'description'>;
export type UpdatePermissionDTO = Partial<CreatePermissionDTO>;
