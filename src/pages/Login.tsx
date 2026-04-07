import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '@/contexts/LoginContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useLogin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      // Error is handled by context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-primary text-3xl">🍁</span>
            <h1 className="text-2xl font-bold">Canadian Health</h1>
          </div>
          <p className="text-sm text-muted-foreground">Indoor Tracking</p>
          <p className="text-xs text-muted-foreground">Real-time indoor positioning for Canadian healthcare facilities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md">
          <div className="font-semibold mb-2">Demo Accounts:</div>
          <div>• <span className="font-mono">admin / admin123</span> - Full access</div>
          <div>• <span className="font-mono">nurse / nurse123</span> - Clinical data</div>
          <div>• <span className="font-mono">backend / backend123</span> - System metrics only</div>
        </div>
      </Card>
    </div>
  );
}
