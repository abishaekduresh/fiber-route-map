import { Metadata } from 'next';
import DeviceCategoriesClient from './DeviceCategoriesClient';

export const metadata: Metadata = {
  title: 'Device Categories | Tenant Portal',
  description: 'Manage device categories for your tenant account',
};

export default function DeviceCategoriesPage() {
  return <DeviceCategoriesClient />;
}
