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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, SubCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type TaskFormDialogProps = {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  subCategories: SubCategory[];
  selectedSubCategoryId: string | null;
  mutate: () => void;
};

export function TaskFormDialog({ task, isOpen, onClose, subCategories, selectedSubCategoryId, mutate }: TaskFormDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [department, setDepartment] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [milestones, setMilestones] = useState('');
  const [stdHours, setStdHours] = useState(0);
  const [stdMinutes, setStdMinutes] = useState(0);
  
  const selectedSubCategory = useMemo(() => subCategories.find(sc => sc.id === subCategoryId), [subCategoryId, subCategories]);

  useEffect(() => {
    if (isOpen) {
        setName(task?.name || '');
        setSubCategoryId(task?.subCategoryId || selectedSubCategoryId || '');
        setDepartment(task?.department || '');
        setIsActive(task?.isActive ?? true);
        
        if (task?.standardTime) {
          const hours = Math.floor(task.standardTime);
          const minutes = Math.round((task.standardTime - hours) * 60);
          setStdHours(hours);
          setStdMinutes(minutes);
        } else {
          setStdHours(0);
          setStdMinutes(0);
        }
        
        let initialMilestones = '';
        if (task?.milestones) {
            try {
                initialMilestones = (typeof task.milestones === 'string' ? JSON.parse(task.milestones) : task.milestones).join('\n');
            } catch {
                initialMilestones = Array.isArray(task.milestones) ? task.milestones.join('\n') : '';
            }
        }
        setMilestones(initialMilestones);
    }
  }, [task, isOpen, selectedSubCategoryId]);


  const handleSubmit = async () => {
    if (!name || !subCategoryId || !department) {
        toast({ variant: 'destructive', title: 'Please fill all required fields.' });
        return;
    }
    if (!API_URL) {
        toast({ variant: 'destructive', title: 'API URL not configured.' });
        return;
    }
    
    const isEditing = !!task?.id;
    
    const milestonesArray = selectedSubCategory?.trackingMethod === 'milestones' 
      ? milestones.split('\n').map(m => m.trim()).filter(Boolean) 
      : [];

    const standardTimeDecimal = (stdHours || 0) + ((stdMinutes || 0) / 60);
    
    const taskData: Partial<Omit<Task, 'type'>> & { type: string } = {
      name,
      standardTime: parseFloat(standardTimeDecimal.toFixed(3)),
      subCategoryId,
      department,
      milestones: JSON.stringify(milestonesArray),
      isActive,
      type: 'task',
    };

    if (!isEditing) {
      taskData.id = crypto.randomUUID();
    } else {
      taskData.id = task.id;
    }
    
    const action = isEditing ? 'update' : 'create';
    const body = JSON.stringify({ action, data: taskData });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body,
        });
        if (!response.ok) {
            const errorData = await response.text();
            console.error("API Error:", errorData);
            throw new Error(`Failed to save task. API responded with: ${errorData}`);
        }

        toast({ title: isEditing ? 'Task updated successfully!' : 'Task added successfully!' });
        mutate();
        onClose();
    } catch (error) {
        console.error("Error saving task: ", error);
        toast({ variant: 'destructive', title: 'Error saving task' });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Task Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subCategory">Sub-Category</Label>
            <Select value={subCategoryId} onValueChange={setSubCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sub-category" />
              </SelectTrigger>
              <SelectContent>
                 {subCategories.filter(sc => sc.isActive).map(sc => (
                  <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
           <div className="space-y-2">
            <Label>Standard Time</Label>
            <div className="flex items-center gap-2">
              <div className='flex-1 space-y-1'>
                  <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={stdHours}
                      onChange={(e) => setStdHours(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground ml-1">Hours</p>
              </div>
              <div className='flex-1 space-y-1'>
                  <Input
                      type="number"
                      placeholder="00"
                      min="0"
                      max="59"
                      value={stdMinutes}
                      onChange={(e) => setStdMinutes(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground ml-1">Minutes</p>
              </div>
            </div>
          </div>
           {selectedSubCategory?.trackingMethod === 'milestones' && (
            <div className="space-y-2">
              <Label htmlFor="milestones">Milestones (one per line, in order)</Label>
              <Textarea
                id="milestones"
                value={milestones}
                onChange={(e) => setMilestones(e.target.value)}
                placeholder="e.g.&#10;Frame Built&#10;Wiring Complete&#10;Final QA"
              />
            </div>
           )}
           <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit}>Save Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
