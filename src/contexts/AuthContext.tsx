import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLogin } from './LoginContext';

type AppRole = 'admin' | 'clinician' | 'nurse' | 'guest';

interface AuthContextType {
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  hasAllRoles: (roles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user } = useLogin();

  const roles = useMemo<AppRole[]>(() => {
    if (!user) return ['guest'];
    
    // In a real app, roles would come from the backend
    const userRoles: AppRole[] = [user.role as AppRole];
    
    // Add guest role to all users
    if (!userRoles.includes('guest')) {
      userRoles.push('guest');
    }
    
    return userRoles;
  }, [user]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: AppRole[]): boolean => {
    return checkRoles.some((role) => roles.includes(role));
  };

  const hasAllRoles = (checkRoles: AppRole[]): boolean => {
    return checkRoles.every((role) => roles.includes(role));
  };

  return (
    <AuthContext.Provider value={{ roles, hasRole, hasAnyRole, hasAllRoles }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for role-based rendering
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: AppRole
) {
  return function WithRoleComponent(props: P) {
    const { hasRole } = useAuth();
    if (!hasRole(requiredRole)) return null;
    return <Component {...props} />;
  };
}

// Component for role-based rendering
export function RequireRole({ 
  role, 
  children 
}: { 
  role: AppRole; 
  children: ReactNode 
}) {
  const { hasRole } = useAuth();
  if (!hasRole(role)) return null;
  return <>{children}</>;
}

// Component for multiple roles (any)
export function RequireAnyRole({ 
  roles, 
  children 
}: { 
  roles: AppRole[]; 
  children: ReactNode 
}) {
  const { hasAnyRole } = useAuth();
  if (!hasAnyRole(roles)) return null;
  return <>{children}</>;
}
