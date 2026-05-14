import { Metadata } from 'next';
import DeviceCategoriesGlobalClient from './DeviceCategoriesGlobalClient';

export const metadata: Metadata = { title: 'Device Categories' };

export default function DeviceCategoriesPage() {
  return <DeviceCategoriesGlobalClient />;
}
