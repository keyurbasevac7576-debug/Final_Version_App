import type { Database } from './database.types';

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export type SubCategory = Database['public']['Tables']['sub_categories']['Row'];
export type SubCategoryInsert = Database['public']['Tables']['sub_categories']['Insert'];
export type SubCategoryUpdate = Database['public']['Tables']['sub_categories']['Update'];

export type WeeklyTarget = Database['public']['Tables']['weekly_targets']['Row'];
export type WeeklyTargetInsert = Database['public']['Tables']['weekly_targets']['Insert'];
export type WeeklyTargetUpdate = Database['public']['Tables']['weekly_targets']['Update'];

export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
export type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];

export type DailyEntry = Database['public']['Tables']['daily_entries']['Row'];
export type DailyEntryInsert = Database['public']['Tables']['daily_entries']['Insert'];
export type DailyEntryUpdate = Database['public']['Tables']['daily_entries']['Update'];
