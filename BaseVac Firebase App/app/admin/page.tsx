
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart, List, Users, ShieldAlert, LibraryBig, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/Logo';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { StructureManager } from '@/components/admin/StructureManager';
import { TeamMemberManager } from '@/components/admin/TeamMemberManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EntryManager } from '@/components/admin/EntryManager';

function AdminPortalContent() {
  return (
    <>
      <header className="relative flex items-center justify-between mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/" aria-label="Back to Home">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="absolute left-1/2 -translate-x-1/2">
          <Logo className="w-40" />
        </div>
        <div></div>
      </header>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Admin Portal</h2>
        <p className="text-muted-foreground mt-2">
          Manage your application data and view production analytics.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="dashboard"><BarChart className="mr-2 h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="structure"><LibraryBig className="mr-2 h-4 w-4" />Structure</TabsTrigger>
          <TabsTrigger value="members"><Users className="mr-2 h-4 w-4" />Team Members</TabsTrigger>
          <TabsTrigger value="entries"><Database className="mr-2 h-4 w-4" />Entries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="structure">
            <Card>
                <CardHeader>
                    <CardTitle>Production Structure Management</CardTitle>
                    <CardDescription>Manage the categories, sub-categories, and tasks that define your production workflow.</CardDescription>
                </CardHeader>
                <CardContent>
                    <StructureManager />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Member Management</CardTitle>
              <CardDescription>Add, edit, or deactivate team members.</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMemberManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>Production Entry Explorer</CardTitle>
              <CardDescription>View, filter, and manage all submitted production data.</CardDescription>
            </CardHeader>
            <CardContent>
              <EntryManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}


export default function AdminPortal() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const authStatus = sessionStorage.getItem('basevac-admin-auth');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.replace('/admin/login');
      }
    } catch (error) {
      // This can happen in SSR or if sessionStorage is disabled
      setIsAuthenticated(false);
      router.replace('/admin/login');
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-lg mx-auto text-center">
                <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Authenticating...</h2>
                <p className="text-muted-foreground mb-6">Please wait while we check your credentials.</p>
                <div className="space-y-4 mt-8">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
        </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {isAuthenticated ? <AdminPortalContent /> : null}
      </div>
    </main>
  );
}
