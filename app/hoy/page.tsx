import { AppLayout } from '@/components/app-layout';
import { Dashboard } from '@/components/dashboard';

/**
 * HoyPage: muestra la vista principal de Hoy reutilizando el Dashboard.
 */
export default function HoyPage() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}