import type { Metadata } from 'next';
import IconsClient from './IconsClient';

export const metadata: Metadata = {
  title: 'Icons | Admin Portal',
  description: 'Manage map icons used on the fiber route map canvas',
};

export default function IconsPage() {
  return <IconsClient />;
}
