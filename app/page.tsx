
'use client';

import Link from 'next/link';
import { Clock, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductionReportForm } from '@/components/team-lead/ProductionReportForm';
import { Logo } from '@/components/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import React, { useMemo, useState, useEffect } from 'react';
import { WeeklyTargets } from '@/components/team-lead/WeeklyTargets';
import type { DailyEntry, TeamMember, Task, Category, SubCategory } from '@/lib/types';
import { useSheetData } from '@/hooks/use-sheet-data';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

function RecentEntries() {
  const { dailyEntries, teamMembers, tasks, categories, subCategories, isLoading } = useSheetData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const recentEntries = useMemo(() => {
    if (!dailyEntries || !isClient) return [];

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    return dailyEntries.filter(row => {
        try {
            if (!row || !row.date) return false;
            const entryDate = parseISO(row.date);
            return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
        } catch {
            return false;
        }
    })
    .sort((a, b) => {
        try {
            if (!a.created_at || !b.created_at) return 0;
            return parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime();
        } catch {
            return 0;
        }
    });
  }, [dailyEntries, isClient]);


  const getMemberName = (id: string) => teamMembers?.find(m => m.id === id)?.name || 'N/A';
  const getTaskName = (id: string) => tasks?.find(t => t.id === id)?.name || 'N/A';

  const getCategoryNamesFromTask = (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (task) {
        const subCategory = subCategories?.find(sc => sc.id === task.sub_category_id);
        if (subCategory) {
            const category = categories?.find(c => c.id === subCategory.category_id);
            return `${category?.name || 'N/A'} > ${subCategory.name || 'N/A'}`;
        }
    }
    return 'N/A';
  };
  
  if (isLoading || !isClient) {
      return (
        <Card className="mt-12">
            <CardHeader>
                <CardTitle>
                    <Skeleton className='h-8 w-48' />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className='space-y-2'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-10 w-full' />
                </div>
            </CardContent>
        </Card>
      );
  }

  if (!recentEntries || recentEntries.length === 0) {
    return null;
  }

  return (
    <>
    <Card className="mt-12">
      <CardHeader>
        <div className='flex items-center gap-3'>
            <Clock className='h-6 w-6 text-primary' />
            <CardTitle>This Week's Entries</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Time (hrs)</TableHead>
                <TableHead>Output</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getMemberName(entry.member_id)}</TableCell>
                  <TableCell>
                      <div className='font-medium'>{getTaskName(entry.task_id)}</div>
                      <div className='text-xs text-muted-foreground'>
                        {getCategoryNamesFromTask(entry.task_id)}
                      </div>
                  </TableCell>
                  <TableCell>{entry.actual_time}</TableCell>
                  <TableCell>
                    {entry.completed_milestone ? (
                        <span className="font-semibold text-primary">{entry.completed_milestone}</span>
                    ) : (
                        <span>{entry.units_completed} units</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    </>
  );
}


export default function Home() {
  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
               <Image src="https://images.squarespace-cdn.com/content/v1/5399ff42e4b070157e072b2f/1413836051573-C6745M5Y879JSYE7NHRP/Base-Vac-Dental-Logo-Box.png?format=1500w" alt="BaseVac Logo" width={140} height={40} className="object-contain" />
                <div className="border-l h-8 border-gray-300"></div>
                <Image src="https://cdn.prod.website-files.com/5c48aeba5b91aa31c708915c/5f7fa351d2ad9cc3995de709_REM%20Equipment%20Logo.svg" alt="REM Logo" width={100} height={30} className="object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                  <Link href="/admin">
                      Admin Portal
                  </Link>
              </Button>
            </div>
        </header>
        
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Daily Production Report</h2>
            <p className="text-muted-foreground mt-2">Submit daily production data for you and your team.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3">
                <ProductionReportForm />
            </div>
            <div className="lg:col-span-2">
                <WeeklyTargets />
            </div>
        </div>

        <div className="lg:col-span-5">
            <RecentEntries />
        </div>
      </div>
    </main>
  );
}
