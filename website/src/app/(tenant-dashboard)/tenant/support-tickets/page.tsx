import { Metadata } from 'next';
import SupportTicketsClient from './SupportTicketsClient';

export const metadata: Metadata = {
  title: 'Support Tickets | Tenant Portal',
  description: 'Raise and manage support tickets for your tenant account',
};

export default function SupportTicketsPage() {
  return <SupportTicketsClient />;
}
