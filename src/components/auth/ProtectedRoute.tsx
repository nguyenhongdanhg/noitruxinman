import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
  requireClassTeacher?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles,
  requireClassTeacher 
}: ProtectedRouteProps) {
  const { user, loading, roles, hasRole, canAccessMeals } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check for required roles
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Không có quyền truy cập</h1>
            <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
          </div>
        </div>
      );
    }
  }

  // Check for class teacher access (for meals)
  if (requireClassTeacher && !canAccessMeals()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Không có quyền truy cập</h1>
          <p className="text-muted-foreground">Chỉ giáo viên chủ nhiệm mới có thể báo cơm cho lớp.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
