'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import type { Category, SubCategory, Task, TeamMember, DailyEntry, WeeklyTarget } from '@/lib/types';

async function fetchAllData() {
  const [
    { data: categories },
    { data: subCategories },
    { data: tasks },
    { data: teamMembers },
    { data: dailyEntries },
    { data: weeklyTargets }
  ] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('sub_categories').select('*').order('name'),
    supabase.from('tasks').select('*').order('name'),
    supabase.from('team_members').select('*').order('name'),
    supabase.from('daily_entries').select('*').order('created_at', { ascending: false }),
    supabase.from('weekly_targets').select('*').order('week_start_date', { ascending: false })
  ]);

  return {
    categories: categories || [],
    subCategories: subCategories || [],
    tasks: tasks || [],
    teamMembers: teamMembers || [],
    dailyEntries: dailyEntries || [],
    weeklyTargets: weeklyTargets || []
  };
}

export function useProductionData() {
  const { data, error, isLoading, mutate } = useSWR(
    'production-data',
    fetchAllData,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    categories: data?.categories || [],
    subCategories: data?.subCategories || [],
    tasks: data?.tasks || [],
    teamMembers: data?.teamMembers || [],
    dailyEntries: data?.dailyEntries || [],
    weeklyTargets: data?.weeklyTargets || [],
    isLoading,
    isError: error,
    mutate,
  };
}
