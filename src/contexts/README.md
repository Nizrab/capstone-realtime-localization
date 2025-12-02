# Authentication & Authorization Contexts

This directory contains the Login and Auth contexts for managing user authentication and role-based access control.

## LoginContext

Manages user authentication state, login/logout functionality, and persistent sessions.

### Features
- User authentication state management
- Persistent login using localStorage
- Loading and error states
- Mock authentication (replace with real API)

### Usage

```tsx
import { useLogin } from '@/contexts/LoginContext';

function MyComponent() {
  const { user, isLoading, error, login, logout } = useLogin();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password');
      // Handle successful login
    } catch (err) {
      // Handle error
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## AuthContext

Manages role-based access control and permissions.

### Features
- Role-based permission checks
- Multiple role support
- Utility functions: `hasRole()`, `hasAnyRole()`, `hasAllRoles()`
- HOC and component wrappers for conditional rendering

### Usage

#### Using the hook
```tsx
import { useAuth } from '@/contexts/AuthContext';

function Dashboard() {
  const { hasRole, hasAnyRole } = useAuth();

  return (
    <div>
      {hasRole('admin') && <AdminPanel />}
      {hasAnyRole(['clinician', 'nurse']) && <PatientData />}
    </div>
  );
}
```

#### Using RequireRole component
```tsx
import { RequireRole } from '@/contexts/AuthContext';

function Settings() {
  return (
    <div>
      <h1>Settings</h1>
      
      <RequireRole role="admin">
        <AdminSettings />
      </RequireRole>
      
      <RequireRole role="clinician">
        <ClinicalSettings />
      </RequireRole>
    </div>
  );
}
```

#### Using RequireAnyRole component
```tsx
import { RequireAnyRole } from '@/contexts/AuthContext';

function PatientView() {
  return (
    <div>
      <RequireAnyRole roles={['admin', 'clinician', 'nurse']}>
        <PatientDetails />
      </RequireAnyRole>
    </div>
  );
}
```

#### Using HOC
```tsx
import { withRole } from '@/contexts/AuthContext';

const AdminPanel = () => <div>Admin Panel</div>;

// This component will only render for admin users
export default withRole(AdminPanel, 'admin');
```

## Available Roles

- `admin` - Full system access
- `clinician` - Clinical data and patient management
- `nurse` - Patient monitoring and alerts
- `guest` - Limited read-only access

## Integration

Both contexts are integrated in `App.tsx`:

```tsx
<LoginProvider>
  <AuthProvider>
    <YourApp />
  </AuthProvider>
</LoginProvider>
```

The `AuthProvider` must be wrapped by `LoginProvider` as it depends on the user state.

## Test Accounts

For development, use these mock accounts:
- `admin@example.com` - Admin role
- `clinician@example.com` - Clinician role
- `nurse@example.com` - Nurse role
- `guest@example.com` - Guest role

Any password works with the mock authentication.
