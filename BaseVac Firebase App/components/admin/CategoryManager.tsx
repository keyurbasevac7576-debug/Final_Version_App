'use client';

import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


type CategoryFormDialogProps = {
  category?: Category | null;
  isOpen: boolean;
  onClose: () => void;
  mutate: () => void;
};

export function CategoryFormDialog({ category, isOpen, onClose, mutate }: CategoryFormDialogProps) {
    const { toast } = useToast();
    const [name, setName] = useState(category?.name || '');
    const [isActive, setIsActive] = useState(category?.isActive ?? true);

    // Effect to reset form state when the dialog props change
    React.useEffect(() => {
        if (isOpen) {
            setName(category?.name || '');
            setIsActive(category?.isActive ?? true);
        }
    }, [isOpen, category]);

    const handleSubmit = async () => {
        if (!name) return;
        if (!API_URL) {
            toast({ variant: 'destructive', title: 'API URL not configured.' });
            return;
        }

        const isEditing = !!category?.id;
        
        const categoryData: Partial<Omit<Category, 'type'>> & { type: string } = { 
            name, 
            isActive,
            type: 'category'
        };
        
        if (!isEditing) {
            categoryData.id = crypto.randomUUID();
        } else {
            categoryData.id = category.id;
        }

        const action = isEditing ? 'update' : 'create';
        const body = JSON.stringify({ action, data: categoryData });

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: body,
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("API Error:", errorData);
                throw new Error(`Failed to save category. API responded with: ${errorData}`);
            }

            toast({ title: isEditing ? "Category updated!" : "Category added!" });
            mutate();
            onClose();
        } catch (error) {
            console.error("Error saving category: ", error);
            toast({ variant: 'destructive', title: 'Error saving category' });
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Category Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                        <Label htmlFor="isActive">Active</Label>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit}>Save Category</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
