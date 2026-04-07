import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

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

const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes
const LAST_ACTIVITY_KEY = 'ch_last_activity';

export function LoginProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage synchronously to prevent flash
    const storedUser = localStorage.getItem('rtls_user');
    if (storedUser) {
      try {
        // Check if session expired while away
        const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_TIMEOUT) {
          localStorage.removeItem('rtls_user');
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          return null;
        }
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('rtls_user');
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('rtls_user');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Reset inactivity timer on user activity
  const resetTimer = useCallback(() => {
    if (!user) return;
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [user, logout]);

  // Attach activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    // Throttle to avoid excessive writes
    let lastReset = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 10_000) { // throttle to every 10s
        lastReset = now;
        resetTimer();
      }
    };

    events.forEach((e) => window.addEventListener(e, throttledReset, { passive: true }));
    // Start the timer immediately
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, throttledReset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

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
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
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
