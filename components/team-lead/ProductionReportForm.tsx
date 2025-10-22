"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Plus, Trash2, UploadCloud } from 'lucide-react';
import type { TeamMember, DailyEntry, Category, Task, SubCategory } from '@/lib/types';
import { useSheetData } from '@/hooks/use-sheet-data';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const entrySchema = z.object({
  memberId: z.string().min(1, "Member is required."),
  taskId: z.string().min(1, "Task is required."),
  hours: z.number().min(0, "Hours cannot be negative."),
  minutes: z.number().min(0, "Minutes cannot be negative.").max(59, "Minutes must be less than 60."),
  unitsCompleted: z.number().optional(),
  unitId: z.string().optional(),
  completedMilestone: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => data.hours > 0 || data.minutes > 0, {
    message: "Total time must be greater than 0.",
    path: ["hours"],
});


const reportSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  entry: entrySchema,
});

type ReportFormData = z.infer<typeof reportSchema>;

export function ProductionReportForm({ isEditMode = false, defaultValues, onSuccess }: { isEditMode?: boolean, defaultValues?: DailyEntry, onSuccess?: () => void }) {
  const { teamMembers, tasks, categories, subCategories, mutate, localEntries, setLocalEntries } = useSheetData();
  const { toast } = useToast();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');

  const activeTeamMembers = useMemo(() => (teamMembers || []).filter(tm => tm.isActive), [teamMembers]);
  const activeCategories = useMemo(() => (categories || []).filter(c => c.isActive), [categories]);
  const activeSubCategories = useMemo(() => (subCategories || []).filter(sc => sc.isActive), [subCategories]);
  const activeTasks = useMemo(() => (tasks || []).filter(t => t.isActive), [tasks]);
  
    useEffect(() => {
    if (defaultValues && activeTasks.length > 0 && activeSubCategories.length > 0) {
      const task = activeTasks.find(t => t.id === defaultValues.taskId);
      if (task) {
        const subCategory = activeSubCategories.find(sc => sc.id === task.subCategoryId);
        if (subCategory) {
          setSelectedCategoryId(subCategory.categoryId);
          setSelectedSubCategoryId(subCategory.id);
        }
      }
    }
  }, [defaultValues, activeTasks, activeSubCategories]);


  const filteredSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    return activeSubCategories.filter(sc => sc.categoryId === selectedCategoryId);
  }, [selectedCategoryId, activeSubCategories]);

  const filteredTasks = useMemo(() => {
    if (!selectedSubCategoryId) return [];
    return activeTasks.filter(t => t.subCategoryId === selectedSubCategoryId);
  }, [selectedSubCategoryId, activeTasks]);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: useMemo(() => {
      if (isEditMode && defaultValues) {
        const hours = Math.floor(defaultValues.actualTime);
        const minutes = Math.round((defaultValues.actualTime - hours) * 60);
        return {
          date: new Date(defaultValues.date),
          entry: {
            memberId: defaultValues.memberId,
            taskId: defaultValues.taskId,
            hours: hours,
            minutes: minutes,
            unitsCompleted: defaultValues.unitsCompleted,
            unitId: defaultValues.unitId,
            completedMilestone: defaultValues.completedMilestone,
            notes: defaultValues.notes,
          }
        }
      }
      return {
        date: new Date(),
        entry: {
          memberId: '',
          taskId: '',
          hours: 0,
          minutes: 0,
          unitsCompleted: 0,
          unitId: '',
          completedMilestone: '',
          notes: '',
        }
      }
    }, [isEditMode, defaultValues])
  });

  const taskId = form.watch('entry.taskId');
  const selectedTask = useMemo(() => tasks.find(t => t.id === taskId), [taskId, tasks]);
  const selectedSubCategoryFromTask = useMemo(() => subCategories.find(sc => sc.id === selectedTask?.subCategoryId), [selectedTask, subCategories]);
  
  const getTaskMilestones = (task: Task) => {
    if (!task.milestones) return [];
    try {
        if (typeof task.milestones === 'string') return JSON.parse(task.milestones);
        if (Array.isArray(task.milestones)) return task.milestones;
    } catch {
        return [];
    }
    return [];
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId('');
    form.setValue('entry.taskId', '');
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    setSelectedSubCategoryId(subCategoryId);
    form.setValue('entry.taskId', '');
  };

  const onSubmit = async (data: ReportFormData) => {
    const { date, entry } = data;
    
    if (selectedSubCategoryFromTask?.trackingMethod === 'milestones' && !entry.completedMilestone) {
        form.setError('entry.completedMilestone', { type: 'manual', message: 'Milestone is required.' });
        return;
    }
     if (selectedSubCategoryFromTask?.trackingMethod === 'milestones' && !entry.unitId) {
        form.setError('entry.unitId', { type: 'manual', message: 'Unit ID is required.' });
        return;
    }

    if (!API_URL) {
      toast({ variant: 'destructive', title: 'API URL not configured.' });
      return;
    }

    const totalHours = entry.hours + (entry.minutes / 60);

    const commonEntryData: Omit<DailyEntry, 'id' | 'submittedBy' | 'timestamp'> = {
        date: format(date, 'yyyy-MM-dd'),
        memberId: entry.memberId,
        taskId: entry.taskId,
        actualTime: parseFloat(totalHours.toFixed(3)),
        unitsCompleted: entry.unitsCompleted ?? 0,
        unitId: entry.unitId ?? '',
        completedMilestone: entry.completedMilestone ?? '',
        notes: entry.notes ?? '',
        type: 'dailyEntry',
    };

    if (isEditMode && defaultValues) {
        try {
            const body = JSON.stringify({ action: 'update', data: {...commonEntryData, id: defaultValues.id} });
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: body,
            });
            if (!response.ok) throw new Error('Failed to update entry');
            toast({ title: "Entry updated successfully!" });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Update failed', description: 'Could not save changes.' });
        }
        return;
    }

    const newEntry: DailyEntry = {
        ...(commonEntryData as Omit<DailyEntry, 'id'|'timestamp'|'submittedBy'>),
        id: crypto.randomUUID(),
        submittedBy: 'Team Lead',
        timestamp: new Date().toISOString(),
    };
    
    setLocalEntries([...localEntries, newEntry]);
    form.reset({
        date: data.date,
        entry: {
            memberId: '',
            taskId: '',
            hours: 0,
            minutes: 0,
            unitsCompleted: 0,
            unitId: '',
            completedMilestone: '',
            notes: '',
        }
    });
    setSelectedCategoryId('');
    setSelectedSubCategoryId('');
    form.clearErrors();
    toast({ title: "Entry added to queue." });
  };
  
  const handleRemoveFromQueue = (id: string) => {
    setLocalEntries(localEntries.filter(entry => entry.id !== id));
  }

  const handleSubmitAll = async () => {
    if (localEntries.length === 0) return;
    if (!API_URL) {
      toast({ variant: 'destructive', title: 'API URL not configured.' });
      return;
    }

    try {
        const body = JSON.stringify({ action: 'createMany', data: localEntries });
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: body,
        });
        if (!response.ok) throw new Error('Failed to submit entries');
        
        toast({ title: "Submission successful!", description: `${localEntries.length} entries have been saved.` });
        setLocalEntries([]);
        mutate();
    } catch (error) {
        console.error("Error submitting entries: ", error);
        toast({ variant: 'destructive', title: 'Submission failed', description: 'Could not save entries. They are still in the queue.' });
    }
  }

  return (
    <>
      <Card className={isEditMode ? '' : 'lg:col-span-3'}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <CardTitle>{isEditMode ? 'Edit Production Entry' : 'New Production Entry'}</CardTitle>
          </div>
          {!isEditMode && <CardDescription>Fill out the form to add entries to the submission queue below.</CardDescription>}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Date of Work</FormLabel> <DatePicker date={field.value} setDate={field.onChange} /> <FormMessage /> </FormItem> )} />
                
                <FormField
                    control={form.control}
                    name="entry.memberId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Team Member</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {activeTeamMembers.map(member => (
                            <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={handleCategoryChange} value={selectedCategoryId}>
                          <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {activeCategories.map(c => ( <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem> ))}
                          </SelectContent>
                      </Select>
                  </FormItem>
                  <FormItem>
                      <FormLabel>Sub-Category</FormLabel>
                      <Select onValueChange={handleSubCategoryChange} value={selectedSubCategoryId} disabled={!selectedCategoryId}>
                          <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select a sub-category" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {filteredSubCategories.map(sc => ( <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem> ))}
                          </SelectContent>
                      </Select>
                  </FormItem>
                  <FormField
                      control={form.control}
                      name="entry.taskId"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Task</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubCategoryId}>
                              <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Select a task" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  {filteredTasks.map(t => ( <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem> ))}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                </div>
                
                {taskId && (
                   <div className="space-y-4 border-t pt-4">
                      <FormItem>
                          <FormLabel>Time Spent</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormField
                                    control={form.control}
                                    name="entry.hours"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                                            </FormControl>
                                            <FormLabel className="text-xs text-muted-foreground ml-1">Hours</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <span className="font-bold text-lg">:</span>
                                <FormField
                                    control={form.control}
                                    name="entry.minutes"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input type="number" placeholder="00" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                                            </FormControl>
                                            <FormLabel className="text-xs text-muted-foreground ml-1">Minutes</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                          <FormMessage>{form.formState.errors.entry?.hours?.message}</FormMessage>
                      </FormItem>
                      
                      {selectedSubCategoryFromTask?.trackingMethod === 'units' ? (
                          <FormField
                              control={form.control}
                              name="entry.unitsCompleted"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Units Completed</FormLabel>
                                      <FormControl>
                                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                      ) : selectedSubCategoryFromTask?.trackingMethod === 'milestones' && selectedTask ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="entry.unitId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit ID / Serial #</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="entry.completedMilestone"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Milestone Completed</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a milestone" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {getTaskMilestones(selectedTask).map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                          </div>
                      ) : null}

                     <FormField
                          control={form.control}
                          name="entry.notes"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                      <Textarea {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                   </div>
                )}
            
                <div className='flex flex-col sm:flex-row gap-2 pt-4'>
                    <Button type="submit" className="w-full" size="lg" disabled={!taskId}>
                        {isEditMode ? 'Save Changes' : <><Plus className="mr-2 h-4 w-4" /> Add to Queue</>}
                    </Button>
                </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {!isEditMode && localEntries.length > 0 && (
          <Card className="mt-8 lg:col-span-5">
              <CardHeader>
                  <CardTitle>Submission Queue</CardTitle>
                  <CardDescription>These entries are waiting to be submitted. Review them and click "Submit All".</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="border rounded-lg mb-4">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Member</TableHead>
                                  <TableHead>Task</TableHead>
                                  <TableHead>Time</TableHead>
                                  <TableHead>Output</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {localEntries.map((entry) => (
                                  <TableRow key={entry.id}>
                                      <TableCell>{(teamMembers || []).find(m => m.id === entry.memberId)?.name}</TableCell>
                                      <TableCell>{(tasks || []).find(t => t.id === entry.taskId)?.name}</TableCell>
                                      <TableCell>{entry.actualTime} hrs</TableCell>
                                      <TableCell>
                                          {entry.completedMilestone 
                                              ? `${entry.unitId} - ${entry.completedMilestone}`
                                              : `${entry.unitsCompleted} units`
                                          }
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" onClick={() => handleRemoveFromQueue(entry.id)}>
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
                  <Button onClick={handleSubmitAll} className="w-full" size="lg">
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Submit All to Sheet
                  </Button>
              </CardContent>
          </Card>
      )}
    </>
  );
}
