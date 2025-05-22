import { AppLayout } from '@/components/app-layout';
import { Dashboard } from '@/components/dashboard';
import { PomodoroTimer } from '@/components/pomodoro';

/**
 * HoyPage: muestra la vista principal de Hoy, incluyendo el Pomodoro Timer y el Dashboard.
 */
export default function HoyPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <PomodoroTimer />
        <Dashboard />
      </div>
    </AppLayout>
  );
}
