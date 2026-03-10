import ProtectedLayout from '@/components/ProtectedLayout';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <ProtectedLayout>
      <Dashboard />
    </ProtectedLayout>
  );
}