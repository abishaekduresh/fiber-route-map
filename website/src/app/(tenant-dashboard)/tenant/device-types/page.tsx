import { Metadata } from 'next';
import DeviceTypesClient from './DeviceTypesClient';

export const metadata: Metadata = {
  title: 'Device Types | Tenant Portal',
  description: 'Manage device types for your tenant account',
};

export default function DeviceTypesPage() {
  return <DeviceTypesClient />;
}
