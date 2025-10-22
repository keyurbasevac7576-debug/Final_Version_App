
'use client'

import React, { useState, useMemo } from 'react';
import { useSheetData } from '@/hooks/use-sheet-data';
import type { Category, SubCategory, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryFormDialog } from './CategoryManager';
import { SubCategoryFormDialog, EditTargetDialog } from './SubCategoryManager';
import { TaskFormDialog } from './TaskManager';
import { CopyTasksDialog } from './CopyTasksDialog';
import { Skeleton } from '../ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const formatDecimalTime = (decimalHours: number) => {
    if (typeof decimalHours !== 'number' || isNaN(decimalHours)) return 'N/A';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
}

export function StructureManager() {
  const { categories, subCategories, tasks, isLoading, mutate } = useSheetData();
  const { toast } = useToast();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  
  // Dialog States
  const [isCategoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubCategoryDialog, setSubCategoryDialog] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [isTaskDialog, setTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTargetDialog, setTargetDialog] = useState(false);
  const [isCopyTaskDialogOpen, setCopyTaskDialogOpen] = useState(false);
  
  // Deletion States
  const [itemToDelete, setItemToDelete] = useState<{type: 'category' | 'subCategory' | 'task', data: any} | null>(null);

  const filteredSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    return subCategories.filter(sc => sc.categoryId === selectedCategoryId);
  }, [subCategories, selectedCategoryId]);

  const filteredTasks = useMemo(() => {
    if (!selectedSubCategoryId) return [];
    return tasks.filter(t => t.subCategoryId === selectedSubCategoryId);
  }, [tasks, selectedSubCategoryId]);
  
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(null);
  }
  
  // --- Delete Handlers ---
  const handleDeleteClick = (type: 'category' | 'subCategory' | 'task', data: any) => {
    if (type === 'category') {
      const hasChildren = subCategories.some(sc => sc.categoryId === data.id);
      if (hasChildren) {
        toast({ variant: 'destructive', title: 'Cannot Delete Category', description: 'Please delete or re-assign its sub-categories first.'});
        return;
      }
    }
    if (type === 'subCategory') {
      const hasChildren = tasks.some(t => t.subCategoryId === data.id);
      if (hasChildren) {
        toast({ variant: 'destructive', title: 'Cannot Delete Sub-Category', description: 'Please delete or re-assign its tasks first.'});
        return;
      }
    }
    setItemToDelete({ type, data });
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    if (!API_URL) {
      toast({ variant: 'destructive', title: 'API URL not configured.' });
      return;
    }
    
    try {
        const body = JSON.stringify({ action: 'delete', data: { id: itemToDelete.data.id, type: itemToDelete.type } });
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body,
        });

      if (!response.ok) throw new Error('Failed to delete item.');

      toast({ title: `${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} deleted.`});
      
      // Reset selections if the deleted item was selected
      if (itemToDelete.type === 'category' && selectedCategoryId === itemToDelete.data.id) {
          setSelectedCategoryId(null);
          setSelectedSubCategoryId(null);
      }
      if (itemToDelete.type === 'subCategory' && selectedSubCategoryId === itemToDelete.data.id) {
          setSelectedSubCategoryId(null);
      }

      mutate();
    } catch (error) {
      console.error("Delete error: ", error);
      toast({ variant: 'destructive', title: 'Error deleting item.'});
    } finally {
      setItemToDelete(null);
    }
  }


  if (isLoading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
        </div>
    );
  }

  return (
    <>
      {/* Dialogs */}
      <CategoryFormDialog 
        isOpen={isCategoryDialog}
        category={editingCategory}
        onClose={() => { setCategoryDialog(false); setEditingCategory(null); }}
        mutate={mutate}
      />
      <SubCategoryFormDialog 
        isOpen={isSubCategoryDialog}
        subCategory={editingSubCategory}
        onClose={() => { setSubCategoryDialog(false); setEditingSubCategory(null); }}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        mutate={mutate}
      />
      <TaskFormDialog
        isOpen={isTaskDialog}
        task={editingTask}
        onClose={() => { setTaskDialog(false); setEditingTask(null); }}
        subCategories={subCategories}
        selectedSubCategoryId={selectedSubCategoryId}
        mutate={mutate}
      />
       <CopyTasksDialog
        isOpen={isCopyTaskDialogOpen}
        onClose={() => setCopyTaskDialogOpen(false)}
        subCategories={subCategories}
        tasks={tasks}
        selectedSubCategoryId={selectedSubCategoryId}
        mutate={mutate}
      />
      {editingSubCategory && (
        <EditTargetDialog
          isOpen={isTargetDialog}
          subCategory={editingSubCategory}
          onClose={() => { setTargetDialog(false); setEditingSubCategory(null); }}
          mutate={mutate}
        />
      )}
      
      {/* Deletion confirmation */}
       <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item: <strong>{itemToDelete?.data.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categories Column */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Categories</CardTitle>
              <Button size="sm" onClick={() => { setEditingCategory(null); setCategoryDialog(true); }}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-96 overflow-y-auto space-y-2 pr-2">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={cn(
                    "group flex justify-between items-center p-3 rounded-lg cursor-pointer border",
                    selectedCategoryId === cat.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                  )}
                >
                  <span className="font-medium">{cat.name}</span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategory(cat); setCategoryDialog(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteClick('category', cat)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sub-Categories Column */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Sub-Categories</CardTitle>
              <Button size="sm" disabled={!selectedCategoryId} onClick={() => { setEditingSubCategory(null); setSubCategoryDialog(true); }}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-96 overflow-y-auto space-y-2 pr-2">
              {!selectedCategoryId && <p className="text-sm text-muted-foreground text-center pt-10">Select a category to see its sub-categories.</p>}
              {selectedCategoryId && filteredSubCategories.map(sc => (
                <div
                  key={sc.id}
                  onClick={() => setSelectedSubCategoryId(sc.id)}
                  className={cn(
                    "group p-3 rounded-lg cursor-pointer border",
                    selectedSubCategoryId === sc.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                  )}
                >
                  <div className='flex justify-between items-center'>
                      <span className="font-medium">{sc.name}</span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingSubCategory(sc); setSubCategoryDialog(true); }}>
                              <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteClick('subCategory', sc)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </div>
                  </div>
                  <div className='text-xs text-muted-foreground mt-2 flex justify-between items-center'>
                      <span>Tracking: {sc.trackingMethod}</span>
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={(e) => {e.stopPropagation(); setEditingSubCategory(sc); setTargetDialog(true)}}>Manage Targets</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Column */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Tasks</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!selectedSubCategoryId} onClick={() => setCopyTaskDialogOpen(true)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
                <Button size="sm" disabled={!selectedSubCategoryId} onClick={() => { setEditingTask(null); setTaskDialog(true); }}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-96 overflow-y-auto space-y-2 pr-2">
              {!selectedSubCategoryId && <p className="text-sm text-muted-foreground text-center pt-10">Select a sub-category to see its tasks.</p>}
              {selectedSubCategoryId && filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="group p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className='flex justify-between items-center'>
                      <span className="font-medium">{task.name}</span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTask(task); setTaskDialog(true) }}>
                              <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteClick('task', task)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </div>
                  </div>
                  <div className='text-xs text-muted-foreground mt-2'>
                      Dept: {task.department} | Std. Time: {formatDecimalTime(task.standardTime)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
