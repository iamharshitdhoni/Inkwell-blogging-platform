import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'author' | 'admin';
}

/**
 * ProtectedRoute Component
 * 
 * Protects routes from unauthorized access based on:
 * - Authentication status (JWT token)
 * - User role (user/author/admin)
 * 
 * @param children - Component to render if authorized
 * @param requiredRole - Required role to access (optional, defaults to any authenticated user)
 * 
 * @example
 * <ProtectedRoute requiredRole="author">
 *   <WriteBlogPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  // Authenticated but doesn't have required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Required role: <span className="capitalize font-semibold text-primary">{requiredRole}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Your role: <span className="capitalize">{user.role || 'user'}</span>
            </p>
          </div>
          <nav className="mt-8 flex gap-4 justify-center">
            <a href="/" className="text-primary hover:underline font-medium">
              Go home
            </a>
          </nav>
        </div>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
};
