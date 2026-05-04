import { Metadata } from 'next';
import UpstreamProvidersClient from './UpstreamProvidersClient';

export const metadata: Metadata = {
  title: 'Upstream Providers | Tenant Portal',
  description: 'Manage upstream providers for your tenant account',
};

export default function UpstreamProvidersPage() {
  return <UpstreamProvidersClient />;
}
