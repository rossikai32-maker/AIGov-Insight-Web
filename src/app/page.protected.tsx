import ProtectedLayout from '@/components/ProtectedLayout';
import Dashboard from './page';

export default function ProtectedDashboard() {
  return (
    <ProtectedLayout>
      <Dashboard />
    </ProtectedLayout>
  );
}