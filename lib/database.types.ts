export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      sub_categories: {
        Row: {
          id: string
          name: string
          category_id: string
          tracking_method: 'units' | 'milestones'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id: string
          tracking_method: 'units' | 'milestones'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string
          tracking_method?: 'units' | 'milestones'
          is_active?: boolean
          created_at?: string
        }
      }
      weekly_targets: {
        Row: {
          id: string
          sub_category_id: string
          week_start_date: string
          target: number
          created_at: string
        }
        Insert: {
          id?: string
          sub_category_id: string
          week_start_date: string
          target?: number
          created_at?: string
        }
        Update: {
          id?: string
          sub_category_id?: string
          week_start_date?: string
          target?: number
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          name: string
          sub_category_id: string
          standard_time: number
          department: string
          milestones: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sub_category_id: string
          standard_time?: number
          department?: string
          milestones?: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sub_category_id?: string
          standard_time?: number
          department?: string
          milestones?: string[]
          is_active?: boolean
          created_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          name: string
          role: string
          department: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role?: string
          department?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          department?: string
          is_active?: boolean
          created_at?: string
        }
      }
      daily_entries: {
        Row: {
          id: string
          date: string
          member_id: string
          task_id: string
          actual_time: number
          units_completed: number
          unit_id: string
          completed_milestone: string
          notes: string
          submitted_by: string
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          member_id: string
          task_id: string
          actual_time?: number
          units_completed?: number
          unit_id?: string
          completed_milestone?: string
          notes?: string
          submitted_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          member_id?: string
          task_id?: string
          actual_time?: number
          units_completed?: number
          unit_id?: string
          completed_milestone?: string
          notes?: string
          submitted_by?: string
          created_at?: string
        }
      }
    }
  }
}
