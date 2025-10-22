
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import type { Category, SubCategory, WeeklyTarget } from '@/lib/types';
import { useSheetData } from '@/hooks/use-sheet-data';
import { Skeleton } from '../ui/skeleton';

export function WeeklyTargets() {
  const { categories, subCategories, isLoading } = useSheetData();

  const currentWeekTargets = useMemo(() => {
    if (!subCategories || !categories) return [];
    
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekStartString = format(weekStart, 'yyyy-MM-dd');
    
    return subCategories
      .filter(sc => sc.isActive)
      .map(sc => {
        let targets: WeeklyTarget[];
        try {
            targets = sc.targets && typeof sc.targets === 'string' ? JSON.parse(sc.targets) : Array.isArray(sc.targets) ? sc.targets : [];
        } catch (e) {
            targets = [];
        }
        
        const target = targets.find((t: { weekStartDate: string; }) => t.weekStartDate === weekStartString);
        
        if (!target || target.target === 0) return null;

        const category = categories.find(c => c.id === sc.categoryId);
        return { 
          categoryName: category?.name,
          subCategoryName: sc.name, 
          target: target.target 
        };
      })
      .filter((t): t is { categoryName: string | undefined, subCategoryName: string, target: number } => t !== null);

  }, [subCategories, categories]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    <CardTitle>This Week's Targets</CardTitle>
                </div>
            </CardHeader>
            <CardContent className='space-y-4'>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (currentWeekTargets.length === 0) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    <CardTitle>This Week's Targets</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className='text-muted-foreground'>No targets set for the current week.</p>
            </CardContent>
        </Card>
    );
  }
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <CardTitle>This Week's Targets</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sub-Category</TableHead>
                <TableHead className="text-right">Target Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentWeekTargets.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                      <div className="font-medium">{item?.subCategoryName}</div>
                      <div className="text-xs text-muted-foreground">{item?.categoryName}</div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">{item?.target}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
