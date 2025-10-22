'use client';

import React, { useState, useEffect } from 'react';
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
import type { SubCategory, Category, WeeklyTarget } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek } from 'date-fns';
import { XCircle } from 'lucide-react';
import { Switch } from '../ui/switch';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type EditTargetDialogProps = {
  subCategory: SubCategory;
  isOpen: boolean;
  onClose: () => void;
  mutate: () => void;
};

export function EditTargetDialog({ subCategory, isOpen, onClose, mutate }: EditTargetDialogProps) {
  const { toast } = useToast();
  const [targets, setTargets] = useState<WeeklyTarget[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const parsedTargets = subCategory.targets && typeof subCategory.targets === 'string'
          ? JSON.parse(subCategory.targets)
          : Array.isArray(subCategory.targets) ? subCategory.targets : [];
        setTargets(parsedTargets);
      } catch (e) {
        console.error("Failed to parse targets:", subCategory.targets);
        setTargets([]);
      }
    }
  }, [subCategory, isOpen]);
  
  const handleAddTarget = () => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    setTargets([
      ...targets,
      { weekStartDate: format(monday, 'yyyy-MM-dd'), target: 0 },
    ]);
  };

  const handleTargetChange = (index: number, field: keyof WeeklyTarget, value: string | number) => {
    const newTargets = [...targets];
    if (field === 'target') {
      newTargets[index][field] = Number(value);
    } else {
      const date = new Date(value);
      const monday = startOfWeek(date, { weekStartsOn: 1 });
      newTargets[index][field] = format(monday, 'yyyy-MM-dd');
    }
    setTargets(newTargets);
  };
  
  const handleRemoveTarget = (index: number) => {
    const newTargets = targets.filter((_, i) => i !== index);
    setTargets(newTargets);
  }

  const handleSave = async () => {
    if (!API_URL) {
      toast({ variant: 'destructive', title: 'API URL not configured.' });
      return;
    }

    const validTargets = targets.filter(t => t.weekStartDate);
    try {
        const updatedSubCategory = { ...subCategory, targets: JSON.stringify(validTargets), type: 'subCategory' };
        const body = JSON.stringify({ action: 'update', data: updatedSubCategory });

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body,
        });
      if (!response.ok) throw new Error('Failed to update targets');
      
      toast({ title: 'Targets updated successfully!' });
      mutate();
      onClose();
    } catch (error) {
      console.error("Error updating targets: ", error);
      toast({ variant: 'destructive', title: 'Error updating targets' });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Weekly Targets for {subCategory.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {targets.map((target, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <Input
                type="date"
                value={target.weekStartDate ? format(new Date(target.weekStartDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleTargetChange(index, 'weekStartDate', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Target Units"
                value={target.target}
                onChange={(e) => handleTargetChange(index, 'target', e.target.value)}
              />
              <Button variant="ghost" size="icon" onClick={() => handleRemoveTarget(index)}>
                <XCircle className='h-5 w-5 text-destructive'/>
              </Button>
            </div>
          ))}
           <Button variant="outline" size="sm" onClick={handleAddTarget}>
            Add Target Week
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


type SubCategoryFormDialogProps = {
  subCategory?: SubCategory | null;
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId: string | null;
  mutate: () => void;
};

export function SubCategoryFormDialog({ subCategory, isOpen, onClose, categories, selectedCategoryId, mutate }: SubCategoryFormDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [trackingMethod, setTrackingMethod] = useState<'units' | 'milestones'>('units');
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      setName(subCategory?.name || '');
      setCategoryId(subCategory?.categoryId || selectedCategoryId || '');
      setTrackingMethod(subCategory?.trackingMethod || 'units');
      setIsActive(subCategory?.isActive ?? true);
    }
  }, [subCategory, isOpen, selectedCategoryId]);

  const handleSubmit = async () => {
    if (!name || !categoryId) {
        toast({ variant: 'destructive', title: 'Please fill all required fields.' });
        return;
    }
    if (!API_URL) {
        toast({ variant: 'destructive', title: 'API URL not configured.' });
        return;
    }
    
    const isEditing = !!subCategory?.id;

    const subCategoryData: Partial<Omit<SubCategory, 'type'>> & { type: string } = {
      name,
      categoryId,
      trackingMethod,
      isActive,
      type: 'subCategory',
    };

    if (!isEditing) {
      subCategoryData.id = crypto.randomUUID();
      subCategoryData.targets = "[]";
    } else {
        subCategoryData.id = subCategory.id;
        subCategoryData.targets = subCategory.targets; // Preserve existing targets
    }

    const action = isEditing ? 'update' : 'create';
    const body = JSON.stringify({ action, data: subCategoryData });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body,
        });
        if (!response.ok) {
            const errorData = await response.text();
            console.error("API Error:", errorData);
            throw new Error(`Failed to save sub-category. API responded with: ${errorData}`);
        }

        toast({ title: isEditing ? 'Sub-category updated!' : 'Sub-category added!' });
        mutate();
        onClose();
    } catch (error) {
        console.error("Error saving sub-category: ", error);
        toast({ variant: 'destructive', title: 'Error saving sub-category' });
    }
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subCategory ? 'Edit Sub-Category' : 'Add New Sub-Category'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sub-Category Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Parent Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trackingMethod">Tracking Method</Label>
            <Select value={trackingMethod} onValueChange={(v) => setTrackingMethod(v as 'units' | 'milestones')}>
                <SelectTrigger><SelectValue placeholder="Select a tracking method" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="milestones">Milestones</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit}>Save Sub-Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
