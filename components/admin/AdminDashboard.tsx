
'use client';

import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  getWeek,
  getYear,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  isSameWeek,
} from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '../ui/date-picker';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import type { DailyEntry, Task, Category, TeamMember, WeeklyTarget, SubCategory } from '@/lib/types';
import { useSheetData } from '@/hooks/use-sheet-data';


type DialogType = 'weekly' | 'monthly' | 'yearly' | 'custom' | null;
type DateRangePreset = 'this_week' | 'this_month' | 'this_year' | 'custom';

const getYearsFromData = (entries: DailyEntry[]) => {
    if (!entries) return [];
    const years = new Set(entries.map(entry => {
        try {
            if (!entry.date) return new Date().getFullYear();
            return getYear(parseISO(entry.date));
        } catch {
            return new Date().getFullYear();
        }
    }));
    return Array.from(years).sort((a,b) => b - a);
}

const getWeeksForYear = (year: number) => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 11, 31));
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(weekStart => ({
        weekNumber: getWeek(weekStart, { weekStartsOn: 1 }),
        startDate: weekStart,
        endDate: endOfWeek(weekStart, { weekStartsOn: 1 }),
    }));
}


export function AdminDashboard() {
  const { dailyEntries, teamMembers, categories, subCategories, tasks } = useSheetData();


  const [dialogOpen, setDialogOpen] = useState<DialogType>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(() => dailyEntries ? (getYearsFromData(dailyEntries)[0] || new Date().getFullYear()) : new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number | null>(getWeek(new Date()));
  
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this_week');
  const [customDateRange, setCustomDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ from: startOfWeek(new Date(), {weekStartsOn: 1}), to: endOfWeek(new Date(), {weekStartsOn: 1}) });
  

  const activeDateRange = useMemo(() => {
    const today = new Date();
    switch (dateRangePreset) {
      case 'this_week':
        return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'this_month':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'this_year':
        return { from: startOfYear(today), to: endOfYear(today) };
      case 'custom':
        return customDateRange;
      default:
        return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
    }
  }, [dateRangePreset, customDateRange]);

  const filteredEntries = useMemo(() => {
    if (!dailyEntries || !activeDateRange.from || !activeDateRange.to) {
      return [];
    }
    return dailyEntries.filter(entry => {
        try {
            if (!entry.date) return false;
            return isWithinInterval(parseISO(entry.date), { start: activeDateRange.from!, end: activeDateRange.to! })
        } catch {
            return false;
        }
    });
  }, [dailyEntries, activeDateRange]);
  
  
  const handleDownload = (filteredData: DailyEntry[], reportName: string) => {
    if (!teamMembers || !categories || !tasks) return;
    const csvHeader = "ID,Date,Member,Category,SubCategory,Task,Time (hrs),Units,Unit ID,Milestone,Notes,Submitted By,Timestamp\n";
    const csvRows = filteredData.map(entry => {
        const member = teamMembers.find(m => m.id === entry.memberId)?.name || 'N/A';
        const task = tasks.find(t => t.id === entry.taskId);
        const subCategory = subCategories.find(sc => sc.id === task?.subCategoryId)
        const category = categories.find(c => c.id === subCategory?.categoryId)?.name || 'N/A';
        return [
            entry.id,
            entry.date,
            `"${member}"`,
            `"${category}"`,
            `"${subCategory?.name || 'N/A'}"`,
            `"${task?.name || 'N/A'}"`,
            entry.actualTime,
            entry.unitsCompleted,
            `"${entry.unitId || ''}"`,
            `"${entry.completedMilestone || ''}"`,
            `"${entry.notes}"`,
            `"${entry.submittedBy}"`,
            entry.timestamp,
        ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${reportName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDialogOpen(null);
  };
  
  const onConfirmDownload = () => {
    if (!dialogOpen || !dailyEntries) return;

    let entriesToDownload: DailyEntry[] = [];
    let reportName = 'production_report';

    if (dialogOpen === 'weekly' && selectedYear && selectedWeek) {
        const weeks = getWeeksForYear(selectedYear);
        const weekInfo = weeks.find(w => w.weekNumber === selectedWeek);
        if (weekInfo) {
            entriesToDownload = dailyEntries.filter(entry => {
                try {
                    if (!entry.date) return false;
                    return isSameWeek(parseISO(entry.date), weekInfo.startDate, { weekStartsOn: 1 })
                } catch { return false; }
            });
            reportName = `weekly_report_${selectedYear}_w${selectedWeek}`;
        }
    } else if (dialogOpen === 'monthly' && selectedYear && selectedMonth !== null) {
        const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
        const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth));
        entriesToDownload = dailyEntries.filter(entry => {
            try {
                if (!entry.date) return false;
                return isWithinInterval(parseISO(entry.date), { start: monthStart, end: monthEnd })
            } catch { return false; }
        });
        reportName = `monthly_report_${selectedYear}_${String(selectedMonth + 1).padStart(2, '0')}`;
    } else if (dialogOpen === 'yearly' && selectedYear) {
        const yearStart = startOfYear(new Date(selectedYear, 0, 1));
        const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
        entriesToDownload = dailyEntries.filter(entry => {
            try {
                if (!entry.date) return false;
                return isWithinInterval(parseISO(entry.date), { start: yearStart, end: yearEnd })
            } catch { return false; }
        });
        reportName = `yearly_report_${selectedYear}`;
    } else if (dialogOpen === 'custom' && customDateRange.from && customDateRange.to) {
        entriesToDownload = dailyEntries.filter(entry => {
            try {
                if (!entry.date) return false;
                return isWithinInterval(parseISO(entry.date), { start: customDateRange.from!, end: customDateRange.to! })
            } catch { return false; }
        });
        reportName = `custom_report_${format(customDateRange.from, 'yyyy-MM-dd')}_to_${format(customDateRange.to, 'yyyy-MM-dd')}`;
    }
    
    if (entriesToDownload.length > 0) {
        handleDownload(entriesToDownload, reportName);
    } else {
        alert("No data found for the selected period.");
    }
  }

  const renderDialogContent = () => {
    const years = dailyEntries ? getYearsFromData(dailyEntries) : [];
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i, name: format(new Date(0, i), 'MMMM') }));
    const weeksInYear = selectedYear ? getWeeksForYear(selectedYear) : [];

    switch (dialogOpen) {
      case 'weekly':
        return (
          <>
            <DialogHeader><DialogTitle>Download Weekly Report</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 my-4">
                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                    <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                    <SelectContent>
                        {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={String(selectedWeek)} onValueChange={(val) => setSelectedWeek(Number(val))} disabled={!selectedYear}>
                    <SelectTrigger><SelectValue placeholder="Select Week" /></SelectTrigger>
                    <SelectContent>
                        {weeksInYear.map(w => 
                            <SelectItem key={w.weekNumber} value={String(w.weekNumber)}>
                                Week {w.weekNumber} ({format(w.startDate, 'MMM d')} - {format(w.endDate, 'MMM d')})
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={onConfirmDownload}>Download</Button>
            </DialogFooter>
          </>
        );
      case 'monthly':
         return (
          <>
            <DialogHeader><DialogTitle>Download Monthly Report</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 my-4">
                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                    <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                    <SelectContent>
                        {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                    <SelectTrigger><SelectValue placeholder="Select Month" /></SelectTrigger>
                    <SelectContent>
                        {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={onConfirmDownload}>Download</Button>
            </DialogFooter>
          </>
        );
      case 'yearly':
        return (
          <>
            <DialogHeader><DialogTitle>Download Yearly Report</DialogTitle></DialogHeader>
            <div className="my-4">
                 <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                    <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                    <SelectContent>
                        {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={onConfirmDownload}>Download</Button>
            </DialogFooter>
          </>
        );
      case 'custom':
         return (
          <>
            <DialogHeader><DialogTitle>Download Custom Range Report</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 my-4">
                <DatePicker date={customDateRange.from} setDate={(d) => setCustomDateRange(prev => ({...prev, from: d}))} />
                <DatePicker date={customDateRange.to} setDate={(d) => setCustomDateRange(prev => ({...prev, to: d}))} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={onConfirmDownload} disabled={!customDateRange.from || !customDateRange.to}>Download</Button>
            </DialogFooter>
          </>
        );
      default:
        return null;
    }
  };

  const targetVsActualData = useMemo(() => {
    if (!tasks || !filteredEntries || !activeDateRange.from || !activeDateRange.to || !subCategories) return [];
    
    return subCategories
      .filter(sc => sc.isActive)
      .map(sc => {
        let targets: WeeklyTarget[];
        try {
            targets = sc.targets && typeof sc.targets === 'string' ? JSON.parse(sc.targets) : Array.isArray(sc.targets) ? sc.targets : [];
        } catch {
            targets = [];
        }

        const relevantTargets = targets.filter(t => {
            try {
                if (!t.weekStartDate) return false;
                return isWithinInterval(parseISO(t.weekStartDate), { start: activeDateRange.from!, end: activeDateRange.to! })
            } catch { return false; }
        });
        
        if (relevantTargets.length === 0) return null;
        
        const totalTarget = relevantTargets.reduce((sum, t) => sum + t.target, 0);
        
        const tasksInSubCategory = tasks.filter(t => t.subCategoryId === sc.id);
        const actualUnits = filteredEntries
          .filter(entry => tasksInSubCategory.some(t => t.id === entry.taskId))
          .reduce((acc, entry) => acc + (Number(entry.unitsCompleted) || 0), 0);

        return {
          name: sc.name,
          Target: totalTarget,
          Actual: actualUnits,
        };
      })
      .filter((item): item is { name: string; Target: number; Actual: number; } => item !== null);
  }, [tasks, subCategories, filteredEntries, activeDateRange]);

  const timeAnalysisData = useMemo(() => {
    if (!tasks || !filteredEntries) return [];
    return tasks.map(task => {
      const entriesForTask = filteredEntries.filter(entry => entry.taskId === task.id && Number(entry.actualTime) > 0);
      if (entriesForTask.length === 0) return null;

      const totalActualTime = entriesForTask.reduce((acc, entry) => acc + Number(entry.actualTime), 0);
      const averageActualTime = totalActualTime / entriesForTask.length;

      return {
        name: task.name,
        'Standard Time': Number(task.standardTime),
        'Average Actual Time': parseFloat(averageActualTime.toFixed(2)),
      };
    }).filter((item): item is { name: string; 'Standard Time': number; 'Average Actual Time': number; } => item !== null);
  }, [tasks, filteredEntries]);


  const milestoneProgressData = useMemo(() => {
    if (!tasks || !filteredEntries || !subCategories) return [];
  
    // 1. Find all milestone-based tasks
    const milestoneTasks = tasks.map(task => {
        const subCategory = subCategories.find(sc => sc.id === task.subCategoryId);
        if (subCategory?.trackingMethod === 'milestones') {
            let milestonesArray: string[];
            try {
                milestonesArray = task.milestones && typeof task.milestones === 'string' ? JSON.parse(task.milestones) : Array.isArray(task.milestones) ? task.milestones : [];
            } catch {
                milestonesArray = [];
            }
            if (milestonesArray.length > 0) {
                return { ...task, milestones: milestonesArray };
            }
        }
        return null;
    }).filter((t): t is Task & { milestones: string[] } => t !== null);

    if (milestoneTasks.length === 0) return [];

    // 2. Process entries for these tasks
    const entriesForMilestoneTasks = filteredEntries.filter(entry => 
      milestoneTasks.some(mt => mt.id === entry.taskId) && entry.unitId
    );

    // 3. For each task, create the funnel data
    return milestoneTasks.flatMap(task => {
      if (!task.milestones || !Array.isArray(task.milestones)) return [];
      
      const unitsByMilestone: Record<string, Set<string>> = {};
      task.milestones.forEach(m => unitsByMilestone[m] = new Set());

      // Get latest milestone for each unitId
      const latestMilestoneForUnit: Record<string, {milestone: string, date: Date}> = {};
      entriesForMilestoneTasks
        .filter(e => e.taskId === task.id && e.completedMilestone)
        .forEach(e => {
            try {
                if (!e.unitId || !e.timestamp) return;
                const entryDate = parseISO(e.timestamp);
                if (!latestMilestoneForUnit[e.unitId] || entryDate > latestMilestoneForUnit[e.unitId].date) {
                    latestMilestoneForUnit[e.unitId] = { milestone: e.completedMilestone!, date: entryDate };
                }
            } catch { /* ignore invalid timestamps */ }
        });

      // Populate unitsByMilestone based on the latest status
      Object.keys(latestMilestoneForUnit).forEach(unitId => {
        const latestMilestone = latestMilestoneForUnit[unitId].milestone;
        const milestoneIndex = task.milestones!.indexOf(latestMilestone);
        if (milestoneIndex > -1) {
          // A unit that reached a milestone has also reached all previous ones
          for (let i = 0; i <= milestoneIndex; i++) {
            unitsByMilestone[task.milestones![i]].add(unitId);
          }
        }
      });
      
      // 4. Format for chart
      return task.milestones.map(milestone => ({
        name: `${task.name} - ${milestone}`,
        'Completed Units': unitsByMilestone[milestone].size,
      }));
    });
  }, [tasks, filteredEntries, subCategories]);


  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className='flex-row items-center justify-between'>
          <div>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Download production entries as a CSV file.</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setDialogOpen('weekly')}>Weekly</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialogOpen('monthly')}>Monthly</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialogOpen('yearly')}>Yearly</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialogOpen('custom')}>Custom Range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
      </Card>
      
      <Dialog open={!!dialogOpen} onOpenChange={(isOpen) => !isOpen && setDialogOpen(null)}>
          <DialogContent>
            {renderDialogContent()}
          </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Displaying data for:{' '}
                {activeDateRange.from && activeDateRange.to ? 
                  `${format(activeDateRange.from, 'MMM dd, yyyy')} - ${format(activeDateRange.to, 'MMM dd, yyyy')}` 
                  : 'all time'}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <Tabs value={dateRangePreset} onValueChange={(value) => setDateRangePreset(value as DateRangePreset)}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="this_week">This Week</TabsTrigger>
                        <TabsTrigger value="this_month">This Month</TabsTrigger>
                        <TabsTrigger value="this_year">This Year</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Button 
                    variant={dateRangePreset === 'custom' ? 'default' : 'outline'} 
                    onClick={() => setDateRangePreset('custom')}
                >
                    Custom Range
                </Button>
            </div>
          </div>
          {dateRangePreset === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 border rounded-lg">
                   <DatePicker 
                        date={customDateRange.from} 
                        setDate={(d) => setCustomDateRange(prev => ({...prev, from: d}))} 
                    />
                    <DatePicker 
                        date={customDateRange.to} 
                        setDate={(d) => setCustomDateRange(prev => ({...prev, to: d}))} 
                    />
              </div>
          )}
        </CardHeader>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Period Target vs. Actual</CardTitle>
            <CardDescription>
              Performance for the selected date range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {targetVsActualData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={targetVsActualData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Target" fill="hsl(var(--secondary))" />
                  <Bar dataKey="Actual" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-muted-foreground text-center py-10'>No targets set for the selected period.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Standard vs. Average Actual Time</CardTitle>
            <CardDescription>
              Efficiency analysis for the selected date range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeAnalysisData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeAnalysisData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Standard Time" fill="hsl(var(--secondary))" />
                  <Bar dataKey="Average Actual Time" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-muted-foreground text-center py-10'>No time entries available for analysis.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milestone Project Progress</CardTitle>
          <CardDescription>
            A funnel view of unique units that have reached each production stage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {milestoneProgressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={milestoneProgressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={200} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Completed Units" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className='text-muted-foreground text-center py-10'>No milestone-based projects have entries in this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
