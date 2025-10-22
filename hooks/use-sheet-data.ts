'use client';

import useSWR from 'swr';
import type { SheetRow, DailyEntry, Category, SubCategory, Task, TeamMember } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const fetcher = (url: string) => fetch(url).then(async (res) => {
    if (!res.ok) {
        const errorText = await res.text();
        console.error("Fetch error:", errorText);
        throw new Error(`Failed to fetch data: ${errorText}`);
    }
    const text = await res.text();
    try {
        const json = JSON.parse(text);
        return json;
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Received non-JSON response from server");
    }
});


export function useSheetData() {
  const { data: rawData = [], error, isLoading, mutate } = useSWR<SheetRow[]>(API_URL, API_URL ? fetcher : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  
  const [localEntries, setLocalEntries] = useState<DailyEntry[]>([]);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem('basevac-local-entries');
      if (storedEntries) {
        setLocalEntries(JSON.parse(storedEntries));
      }
    } catch (e) {
      console.error("Could not load local entries from localStorage", e);
    }
  }, []);

  const handleSetLocalEntries = (entries: DailyEntry[]) => {
      try {
        localStorage.setItem('basevac-local-entries', JSON.stringify(entries));
        setLocalEntries(entries);
      } catch (e) {
        console.error("Could not save local entries to localStorage", e);
      }
  }

  const processedData = useMemo(() => {
    const data = {
      categories: [] as Category[],
      subCategories: [] as SubCategory[],
      tasks: [] as Task[],
      teamMembers: [] as TeamMember[],
      sheetEntries: [] as DailyEntry[],
    };

    if (!Array.isArray(rawData)) {
        console.warn("Raw data is not an array:", rawData);
        return data;
    }

    rawData.forEach(row => {
      if (!row || typeof row !== 'object' || !row.type) return;

      const rowType = String(row.type).trim().toLowerCase();
      
      switch (rowType) {
        case 'category':
          data.categories.push(row as Category);
          break;
        case 'subcategory':
          data.subCategories.push(row as SubCategory);
          break;
        case 'task':
          data.tasks.push(row as Task);
          break;
        case 'teammember':
          data.teamMembers.push(row as TeamMember);
          break;
        case 'dailyentry':
          data.sheetEntries.push(row as DailyEntry);
          break;
      }
    });
    
    return data;
  }, [rawData]);

  const dailyEntries = useMemo(() => 
    [...processedData.sheetEntries, ...localEntries], 
    [processedData.sheetEntries, localEntries]
  );

  return {
    categories: processedData.categories,
    subCategories: processedData.subCategories,
    tasks: processedData.tasks,
    teamMembers: processedData.teamMembers,
    dailyEntries,
    allSheetData: rawData,
    isLoading,
    isError: error,
    mutate,
    localEntries,
    setLocalEntries: handleSetLocalEntries,
  };
}
