
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function SchedulePage() {
  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
         <header className="relative flex items-center justify-between mb-8">
            <Button variant="outline" size="icon" asChild>
            <Link href="/" aria-label="Back to Home">
                <ArrowLeft className="h-4 w-4" />
            </Link>
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
                <Logo className="w-40" />
            </div>
            <div />
        </header>

        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Weekly Production Schedule</h2>
            <p className="text-muted-foreground mt-2">
            This feature is coming soon.
            </p>
        </div>

      </div>
    </main>
  );
}
