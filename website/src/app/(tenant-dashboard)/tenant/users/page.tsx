import { Metadata } from 'next';
import UsersClient from './UsersClient';

export const metadata: Metadata = {
  title: 'User Management | Tenant Portal',
  description: 'Manage sub-users for your tenant account',
};

export default function TenantUsersPage() {
  return <UsersClient />;
}
