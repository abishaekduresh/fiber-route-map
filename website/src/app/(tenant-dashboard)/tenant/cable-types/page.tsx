import { Metadata } from 'next';
import CableTypesClient from './CableTypesClient';

export const metadata: Metadata = {
  title: 'Cable Types | Tenant Portal',
  description: 'Manage fiber cable types for your tenant account',
};

export default function CableTypesPage() {
  return <CableTypesClient />;
}
