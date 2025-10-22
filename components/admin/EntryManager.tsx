'use client';

import React, { useState, useMemo } from 'react';
import { useSheetData } from '@/hooks/use-sheet-data';
import type { DailyEntry } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isWithinInterval } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProductionReportForm } from '../team-lead/ProductionReportForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Trash2, Edit } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function EntryManager() {
  const { dailyEntries: entries, teamMembers, tasks, subCategories, categories, isLoading, mutate } = useSheetData();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    memberId: '',
    categoryId: '',
    subCategoryId: '',
    taskId: '',
    dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
  });

  const [entryToDelete, setEntryToDelete] = useState<DailyEntry | null>(null);
  const [entryToEdit, setEntryToEdit] = useState<DailyEntry | null>(null);

  const sortedEntries = useMemo(() => {
    return (entries || []).sort((a,b) => {
        try {
            if (!a.timestamp || !b.timestamp) return 0;
            return parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
        } catch {
            return 0;
        }
    });
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return sortedEntries.filter(entry => {
      const task = (tasks || []).find(t => t.id === entry.taskId);
      const subCategory = (subCategories || []).find(sc => sc.id === task?.subCategoryId);
      const category = (categories || []).find(c => c.id === subCategory?.categoryId);

      if (filters.memberId && entry.memberId !== filters.memberId) return false;
      if (filters.taskId && entry.taskId !== filters.taskId) return false;
      if (filters.subCategoryId && subCategory?.id !== filters.subCategoryId) return false;
      if (filters.categoryId && category?.id !== filters.categoryId) return false;
      
      if (filters.dateRange.from && filters.dateRange.to) {
        try {
            if (!entry.date) return false;
            const entryDate = parseISO(entry.date);
            if (!isWithinInterval(entryDate, { start: filters.dateRange.from, end: filters.dateRange.to })) {
              return false;
            }
        } catch {
            return false;
        }
      }
      return true;
    });
  }, [sortedEntries, filters, tasks, subCategories, categories]);
  
  const filteredSubCategories = useMemo(() => {
      if (!filters.categoryId || !subCategories) return (subCategories || []);
      return subCategories.filter(sc => sc.categoryId === filters.categoryId);
  }, [subCategories, filters.categoryId]);

  const filteredTasks = useMemo(() => {
      if (!filters.subCategoryId || !tasks) return (tasks || []);
      return tasks.filter(t => t.subCategoryId === filters.subCategoryId);
  }, [tasks, filters.subCategoryId]);


  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
    setFilters(prev => {
        const newFilters = {...prev, [filterName]: value};
        if (filterName === 'categoryId') {
            newFilters.subCategoryId = '';
            newFilters.taskId = '';
        }
        if (filterName === 'subCategoryId') {
            newFilters.taskId = '';
        }
        return newFilters;
    });
  };
  
  const clearFilters = () => {
    setFilters({
      memberId: '',
      categoryId: '',
      subCategoryId: '',
      taskId: '',
      dateRange: { from: undefined, to: undefined },
    })
  }

  const handleDelete = async () => {
    if (!entryToDelete) return;
    if (!API_URL) {
      toast({ variant: 'destructive', title: 'API URL not configured.' });
      return;
    }

    try {
        const body = JSON.stringify({ action: 'delete', data: { id: entryToDelete.id, type: 'dailyEntry' } });
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body,
        });
      if (!response.ok) throw new Error('Failed to delete entry');
      toast({ title: 'Entry deleted successfully!' });
      mutate();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting entry' });
    } finally {
      setEntryToDelete(null);
    }
  };
  
  const onEditSuccess = () => {
    setEntryToEdit(null);
    mutate();
  }

  const getDetails = (entry: DailyEntry) => {
    const member = (teamMembers || []).find(m => m.id === entry.memberId);
    const task = (tasks || []).find(t => t.id === entry.taskId);
    const subCategory = (subCategories || []).find(sc => sc.id === task?.subCategoryId);
    const category = (categories || []).find(c => c.id === subCategory?.categoryId);
    return { member, task, subCategory, category };
  };

  if (isLoading) {
    return <div>Loading data...</div>;
  }

  return (
    <>
      <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the entry. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!entryToEdit} onOpenChange={() => setEntryToEdit(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Edit Production Entry</DialogTitle>
            </DialogHeader>
            <div className='overflow-y-auto pr-6'>
              {entryToEdit && (
                  <ProductionReportForm 
                      isEditMode={true} 
                      defaultValues={entryToEdit} 
                      onSuccess={onEditSuccess}
                  />
              )}
            </div>
        </DialogContent>
      </Dialog>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select value={filters.categoryId} onValueChange={v => handleFilterChange('categoryId', v)}>
                    <SelectTrigger><SelectValue placeholder="Filter by Category" /></SelectTrigger>
                    <SelectContent>
                        {(categories || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={filters.subCategoryId} onValueChange={v => handleFilterChange('subCategoryId', v)} disabled={!filters.categoryId}>
                    <SelectTrigger><SelectValue placeholder="Filter by Sub-Category" /></SelectTrigger>
                    <SelectContent>
                        {filteredSubCategories.map(sc => <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={filters.taskId} onValueChange={v => handleFilterChange('taskId', v)} disabled={!filters.subCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Filter by Task" /></SelectTrigger>
                    <SelectContent>
                        {filteredTasks.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={filters.memberId} onValueChange={v => handleFilterChange('memberId', v)}>
                    <SelectTrigger><SelectValue placeholder="Filter by Member" /></SelectTrigger>
                    <SelectContent>
                        {(teamMembers || []).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <DatePicker date={filters.dateRange.from} setDate={(d) => handleFilterChange('dateRange', { ...filters.dateRange, from: d })} />
                <DatePicker date={filters.dateRange.to} setDate={(d) => handleFilterChange('dateRange', { ...filters.dateRange, to: d })} />
                <Button variant="outline" onClick={clearFilters} className="col-start-auto">Clear Filters</Button>
            </div>
        </div>

        <div className="border rounded-lg max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader className='sticky top-0 bg-background z-10'>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>Unit ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map(entry => {
                const { member, task, subCategory, category } = getDetails(entry);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{format(parseISO(entry.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{member?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{task?.name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{category?.name} &gt; {subCategory?.name}</div>
                    </TableCell>
                    <TableCell>{entry.actualTime} hrs</TableCell>
                    <TableCell>
                        {entry.completedMilestone ? (
                            <span className="font-semibold text-primary">{entry.completedMilestone}</span>
                        ) : (
                            <span>{entry.unitsCompleted} units</span>
                        )}
                    </TableCell>
                    <TableCell>{entry.unitId}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEntryToEdit(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEntryToDelete(entry)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
