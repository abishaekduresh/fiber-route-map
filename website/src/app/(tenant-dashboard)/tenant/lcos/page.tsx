import { Metadata } from 'next';
import LcosClient from './LcosClient';

export const metadata: Metadata = {
  title: 'LCO Management | Tenant Portal',
  description: 'Manage Local Cable Operators for your tenant account',
};

export default function LcosPage() {
  return <LcosClient />;
}
