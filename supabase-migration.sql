-- Production Tracking System Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create sub_categories table
CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  tracking_method text NOT NULL CHECK (tracking_method IN ('units', 'milestones')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create weekly_targets table
CREATE TABLE IF NOT EXISTS weekly_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_category_id uuid REFERENCES sub_categories(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  target integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sub_category_id, week_start_date)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sub_category_id uuid REFERENCES sub_categories(id) ON DELETE CASCADE,
  standard_time numeric DEFAULT 0,
  department text DEFAULT '',
  milestones jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text DEFAULT '',
  department text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create daily_entries table
CREATE TABLE IF NOT EXISTS daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  actual_time numeric DEFAULT 0,
  units_completed integer DEFAULT 0,
  unit_id text DEFAULT '',
  completed_milestone text DEFAULT '',
  notes text DEFAULT '',
  submitted_by text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_weekly_targets_sub_category_id ON weekly_targets(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_weekly_targets_week_start_date ON weekly_targets(week_start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_sub_category_id ON tasks(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_member_id ON daily_entries(member_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_task_id ON daily_entries(task_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete categories" ON categories FOR DELETE TO authenticated USING (true);

-- RLS Policies for sub_categories
CREATE POLICY "Anyone can view sub_categories" ON sub_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sub_categories" ON sub_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sub_categories" ON sub_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete sub_categories" ON sub_categories FOR DELETE TO authenticated USING (true);

-- RLS Policies for weekly_targets
CREATE POLICY "Anyone can view weekly_targets" ON weekly_targets FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert weekly_targets" ON weekly_targets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update weekly_targets" ON weekly_targets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete weekly_targets" ON weekly_targets FOR DELETE TO authenticated USING (true);

-- RLS Policies for tasks
CREATE POLICY "Anyone can view tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tasks" ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete tasks" ON tasks FOR DELETE TO authenticated USING (true);

-- RLS Policies for team_members
CREATE POLICY "Anyone can view team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert team_members" ON team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update team_members" ON team_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete team_members" ON team_members FOR DELETE TO authenticated USING (true);

-- RLS Policies for daily_entries
CREATE POLICY "Anyone can view daily_entries" ON daily_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert daily_entries" ON daily_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update daily_entries" ON daily_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete daily_entries" ON daily_entries FOR DELETE TO authenticated USING (true);
