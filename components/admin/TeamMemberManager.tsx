'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { TeamMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSheetData } from '@/hooks/use-sheet-data';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type MemberFormDialogProps = {
  member?: TeamMember | null;
  onClose: () => void;
  mutate: () => void;
};

function MemberFormDialog({ member, onClose, mutate }: MemberFormDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  React.useEffect(() => {
    setName(member?.name || '');
    setRole(member?.role || '');
    setDepartment(member?.department || '');
    setIsActive(member?.isActive ?? true);
  }, [member])

  const handleSubmit = async () => {
    if (!name || !role || !department) {
        toast({ variant: "destructive", title: "Please fill all fields."});
        return;
    }
    if (!API_URL) {
        toast({ variant: 'destructive', title: 'API URL not configured.' });
        return;
    }
    
    const isEditing = !!member?.id;

    const memberData: Partial<Omit<TeamMember, 'type'>> & { type: string } = {
      name,
      role,
      department,
      isActive,
      type: 'teamMember'
    };

    if (!isEditing) {
      memberData.id = crypto.randomUUID();
    } else {
        memberData.id = member.id;
    }
    
    const action = isEditing ? 'update' : 'create';
    const body = JSON.stringify({ action, data: memberData });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: body,
        });
        if (!response.ok) {
            const errorData = await response.text();
            console.error("API Error:", errorData);
            throw new Error(`Failed to save member. API responded with status ${response.status}`);
        }

        toast({ title: isEditing ? "Team member updated!" : "Team member added!" });
        mutate();
        onClose();
    } catch(e) {
        console.error("Error saving team member: ", e);
        toast({ variant: "destructive", title: "Error saving member."});
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Team Member' : 'Add New Member'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Member Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit}>Save Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function TeamMemberManager() {
  const { teamMembers, dailyEntries, isLoading, mutate } = useSheetData();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const handleAddNew = () => {
    setEditingMember(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleDelete = (member: TeamMember) => {
    const memberHasEntries = (dailyEntries || []).some(entry => entry.memberId === member.id);
    if (memberHasEntries) {
        toast({
            variant: "destructive",
            title: "Cannot Delete Team Member",
            description: "This team member has existing production entries. Please reassign or delete them first."
        });
        return;
    }
    setMemberToDelete(member);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    if (!API_URL) {
        toast({ variant: 'destructive', title: 'API URL not configured.' });
        return;
    }
    
    try {
        const body = JSON.stringify({ action: 'delete', data: { id: memberToDelete.id, type: 'teamMember' } });
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body,
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        
        toast({ title: 'Team member deleted successfully!' });
        mutate();
    } catch(e) {
        console.error("Error deleting member: ", e);
        toast({ variant: 'destructive', title: 'Failed to delete team member.' });
    } finally {
        setMemberToDelete(null);
    }
  };


  if (isLoading) {
      return (
        <div className='space-y-4'>
            <div className='flex justify-end'>
                <Skeleton className='h-10 w-44' />
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(3)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className='h-5 w-24' /></TableCell>
                                <TableCell><Skeleton className='h-5 w-20' /></TableCell>
                                <TableCell><Skeleton className='h-5 w-16' /></TableCell>
                                <TableCell><Skeleton className='h-6 w-14 rounded-full' /></TableCell>
                                <TableCell className='text-right space-x-2'>
                                    <Skeleton className='h-9 w-20 inline-block' />
                                    <Skeleton className='h-9 w-24 inline-block' />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
      )
  }

  return (
    <div className="space-y-4">
      {isDialogOpen && (
        <MemberFormDialog
          member={editingMember}
          onClose={() => setIsDialogOpen(false)}
          mutate={mutate}
        />
      )}
      
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team member "{memberToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-end">
        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Member</Button>
      </div>
      <div className="border rounded-lg max-h-[60vh] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers?.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>{member.department}</TableCell>
                <TableCell>
                  <Badge variant={member.isActive ? 'default' : 'secondary'}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                    Edit
                  </Button>
                   <Button variant="destructive" size="sm" onClick={() => handleDelete(member)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
