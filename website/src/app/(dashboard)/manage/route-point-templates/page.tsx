import { Metadata } from 'next';
import RoutePointTemplatesClient from './RoutePointTemplatesClient';

export const metadata: Metadata = { title: 'Route Point Templates' };

export default function RoutePointTemplatesPage() {
  return <RoutePointTemplatesClient />;
}
