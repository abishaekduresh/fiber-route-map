export interface TenantUserSetting {
  id: number;
  uuid: string;
  tenantBusinessId: number;
  tenantUserId: number;
  name: string;
  key: string;
  value: string;
  status: 'active' | 'inactive' | 'deleted';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UpsertSettingDTO {
  key: string;
  name: string;
  value: string;
}
