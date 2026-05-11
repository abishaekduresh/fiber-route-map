import type { Metadata } from 'next';
import WidgetsClient from './WidgetsClient';

export const metadata: Metadata = {
  title: 'Widgets | Admin Portal',
  description: 'Manage map widgets — icons used on the fiber route map canvas',
};

export default function WidgetsPage() {
  return <WidgetsClient />;
}
