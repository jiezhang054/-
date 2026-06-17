import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/workspace" replace />;
  return <>{children}</>;
}
