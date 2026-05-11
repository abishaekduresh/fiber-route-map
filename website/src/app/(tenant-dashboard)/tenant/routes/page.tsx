import { Metadata } from 'next';
import RoutesClient from './RoutesClient';

export const metadata: Metadata = {
  title: 'Routes | Tenant Portal',
  description: 'Manage fiber and cable routes for your network',
};

export default function RoutesPage() {
  return <RoutesClient />;
}
