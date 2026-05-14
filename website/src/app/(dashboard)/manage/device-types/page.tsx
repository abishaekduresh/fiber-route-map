import { Metadata } from 'next';
import DeviceTypesGlobalClient from './DeviceTypesGlobalClient';

export const metadata: Metadata = { title: 'Device Types' };

export default function DeviceTypesPage() {
  return <DeviceTypesGlobalClient />;
}
