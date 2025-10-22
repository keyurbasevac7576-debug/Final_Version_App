'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { SubCategory, Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '../ui/alert';
import { Copy } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type CopyTasksDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  subCategories: SubCategory[];
  tasks: Task[];
  selectedSubCategoryId: string | null;
  mutate: () => void;
};

export function CopyTasksDialog({
  isOpen,
  onClose,
  subCategories,
  tasks,
  selectedSubCategoryId,
  mutate,
}: CopyTasksDialogProps) {
  const { toast } = useToast();
  const [sourceSubCategoryId, setSourceSubCategoryId] = useState('');
  const [destinationSubCategoryId, setDestinationSubCategoryId] = useState(selectedSubCategoryId || '');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setDestinationSubCategoryId(selectedSubCategoryId || '');
      setSourceSubCategoryId('');
      setSelectedTaskIds(new Set());
    }
  }, [isOpen, selectedSubCategoryId]);

  const sourceTasks = useMemo(() => {
    return tasks.filter(t => t.subCategoryId === sourceSubCategoryId);
  }, [sourceSubCategoryId, tasks]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allTaskIds = new Set(sourceTasks.map(t => t.id));
      setSelectedTaskIds(allTaskIds);
    } else {
      setSelectedTaskIds(new Set());
    }
  };

  const handleTaskSelect = (taskId: string, checked: boolean) => {
    const newSet = new Set(selectedTaskIds);
    if (checked) {
      newSet.add(taskId);
    } else {
      newSet.delete(taskId);
    }
    setSelectedTaskIds(newSet);
  };

  const handleSubmit = async () => {
    if (!sourceSubCategoryId || !destinationSubCategoryId || selectedTaskIds.size === 0) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select source, destination, and at least one task.' });
      return;
    }
    if (sourceSubCategoryId === destinationSubCategoryId) {
      toast({ variant: 'destructive', title: 'Invalid Selection', description: 'Source and destination cannot be the same.' });
      return;
    }
    if (!API_URL) {
      toast({ variant: 'destructive', title: 'API URL not configured.' });
      return;
    }

    const tasksToCopy = tasks.filter(t => selectedTaskIds.has(t.id));
    const newTasks = tasksToCopy.map(task => {
      const { id, subCategoryId, ...rest } = task;
      return {
        ...rest,
        id: crypto.randomUUID(),
        subCategoryId: destinationSubCategoryId,
        type: 'task',
        milestones: JSON.stringify(task.milestones || []),
      };
    });

    try {
        const body = JSON.stringify({ action: 'createMany', data: newTasks });
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body,
        });
      if (!response.ok) throw new Error('Failed to copy tasks');

      toast({ title: 'Tasks Copied!', description: `${newTasks.length} tasks were copied to the new sub-category.` });
      mutate();
      onClose();
    } catch (error) {
      console.error("Error copying tasks: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not copy tasks.' });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copy Tasks Between Sub-Categories</DialogTitle>
          <DialogDescription>Select a source, choose which tasks to copy, and pick a destination.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Source Column */}
          <div className="space-y-2">
            <Label htmlFor="source" className="font-semibold">1. Copy From:</Label>
            <Select value={sourceSubCategoryId} onValueChange={setSourceSubCategoryId}>
              <SelectTrigger id="source">
                <SelectValue placeholder="Select Source Sub-Category" />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map(sc => (
                  <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {sourceSubCategoryId && (
              <>
                <div className="flex items-center justify-between mt-4 border-t pt-4">
                    <Label htmlFor="select-all" className="text-sm font-normal flex items-center gap-2">
                        <Checkbox
                            id="select-all"
                            checked={selectedTaskIds.size === sourceTasks.length && sourceTasks.length > 0}
                            onCheckedChange={handleSelectAll}
                        />
                        Select All Tasks
                    </Label>
                </div>
                <ScrollArea className="h-64 rounded-md border p-2">
                  {sourceTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">No tasks found.</p>
                  ) : (
                    sourceTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={selectedTaskIds.has(task.id)}
                          onCheckedChange={(checked) => handleTaskSelect(task.id, !!checked)}
                        />
                        <Label htmlFor={`task-${task.id}`} className="font-normal flex-1 cursor-pointer">
                          {task.name}
                        </Label>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </>
            )}
          </div>

          {/* Destination Column */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="font-semibold">2. Copy To:</Label>
            <Select value={destinationSubCategoryId} onValueChange={setDestinationSubCategoryId}>
              <SelectTrigger id="destination">
                <SelectValue placeholder="Select Destination Sub-Category" />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map(sc => (
                  <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Alert className="mt-4">
                <Copy className="h-4 w-4" />
                <AlertDescription>
                    {selectedTaskIds.size} task(s) will be copied to <strong>{subCategories.find(sc => sc.id === destinationSubCategoryId)?.name || '...'}</strong>.
                </AlertDescription>
            </Alert>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Confirm & Copy Tasks</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
