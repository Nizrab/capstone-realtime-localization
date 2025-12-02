import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'nurse' | 'backend';
}

interface LoginContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export function LoginProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('rtls_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('rtls_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Hardcoded demo accounts
      const accounts = [
        { username: 'admin', password: 'admin123', role: 'admin' as const },
        { username: 'nurse', password: 'nurse123', role: 'nurse' as const },
        { username: 'backend', password: 'backend123', role: 'backend' as const },
      ];

      const account = accounts.find(
        (acc) => acc.username === username && acc.password === password
      );

      if (!account) {
        throw new Error('Invalid username or password');
      }

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: account.username,
        role: account.role,
      };

      setUser(mockUser);
      localStorage.setItem('rtls_user', JSON.stringify(mockUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rtls_user');
  };

  return (
    <LoginContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </LoginContext.Provider>
  );
}

export function useLogin() {
  const context = useContext(LoginContext);
  if (context === undefined) {
    throw new Error('useLogin must be used within a LoginProvider');
  }
  return context;
}
