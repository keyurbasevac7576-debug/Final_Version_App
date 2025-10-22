
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'BaseVac123';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem('basevac-admin-auth', 'true');
        router.replace('/admin');
      } catch (error) {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Session storage is not available in your browser.",
          });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "The password you entered is incorrect.",
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm mx-auto">
        <header className="text-center mb-8">
            <div className="inline-block mb-4">
                <Logo className="w-48" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Admin Portal</h2>
        </header>

        <Card>
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Authentication Required</CardTitle>
              <CardDescription>Enter the password to access the admin portal.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-center"
                />
              </div>
              <Button type="submit" className="w-full">
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
