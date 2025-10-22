
export type WeeklyTarget = {
  weekStartDate: string; // ISO string for the Monday of the week
  target: number;
};

export type Category = {
  id: string;
  name: string;
  isActive: boolean;
  type: 'category';
};

export type SubCategory = {
  id: string;
  name: string;
  categoryId: string;
  trackingMethod: 'units' | 'milestones';
  targets: WeeklyTarget[] | string; // Can be string from sheet
  isActive: boolean;
  type: 'subCategory';
}

export type Task = {
  id: string;
  name: string;
  standardTime: number;
  subCategoryId: string;
  department: string;
  milestones: string[] | string; // Can be string from sheet
  isActive: boolean;
  type: 'task';
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  department: string;
  isActive: boolean;
  type: 'teamMember';
};

export type DailyEntry = {
  id:string;
  date: string; // "YYYY-MM-DD"
  memberId: string;
  taskId: string;
  actualTime: number;
  unitsCompleted: number;
  unitId?: string; // Optional field for tracking specific units/serial numbers
  completedMilestone?: string;
  notes: string;
  submittedBy: string;
  timestamp: string; // ISO String
  type: 'dailyEntry';
};

// A union type for all possible records in the sheet
export type SheetRow = Category | SubCategory | Task | TeamMember | DailyEntry;
