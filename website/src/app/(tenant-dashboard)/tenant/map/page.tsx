import { Metadata } from 'next';
import MapClient from './MapClient';

export const metadata: Metadata = {
  title: 'Network Map | Tenant Portal',
  description: 'View and filter your fiber network nodes on an interactive map',
};

export default function MapPage() {
  return <MapClient />;
}
