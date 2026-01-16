import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface DutySchedule {
  id: string;
  user_id: string | null;
  teacher_name: string;
  duty_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useDutySchedule() {
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();

  // Check if user can manage duty schedules
  const { data: canManage = false } = useQuery({
    queryKey: ['canManageDuty', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      // Admin can always manage
      if (hasRole('admin')) return true;
      
      // Check if user is in "Quản lí nội trú" group
      const { data } = await supabase
        .from('user_permission_groups')
        .select(`
          group_id,
          permission_groups!inner(name)
        `)
        .eq('user_id', user.id);
      
      return data?.some((item: any) => item.permission_groups?.name === 'Quản lí nội trú') ?? false;
    },
    enabled: !!user,
  });

  // Fetch duty schedules for a specific month
  const useDutyByMonth = (year: number, month: number) => {
    const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
    const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd');
    
    return useQuery({
      queryKey: ['dutySchedules', year, month],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('duty_schedules')
          .select('*')
          .gte('duty_date', startDate)
          .lte('duty_date', endDate)
          .order('duty_date', { ascending: true });
        
        if (error) throw error;
        return data as DutySchedule[];
      },
    });
  };

  // Fetch today's duty
  const { data: todayDuty, isLoading: isLoadingToday } = useQuery({
    queryKey: ['dutySchedules', 'today'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('duty_schedules')
        .select('*')
        .eq('duty_date', today);
      
      if (error) throw error;
      return data as DutySchedule[];
    },
  });

  // Fetch duty by specific date
  const useDutyByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return useQuery({
      queryKey: ['dutySchedules', 'date', dateStr],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('duty_schedules')
          .select('*')
          .eq('duty_date', dateStr);
        
        if (error) throw error;
        return data as DutySchedule[];
      },
    });
  };

  // Add duty schedule
  const addDutyMutation = useMutation({
    mutationFn: async (duty: { teacher_name: string; duty_date: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('duty_schedules')
        .insert({
          teacher_name: duty.teacher_name,
          duty_date: duty.duty_date,
          notes: duty.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutySchedules'] });
    },
  });

  // Bulk add duty schedules
  const bulkAddDutyMutation = useMutation({
    mutationFn: async (duties: { teacher_name: string; duty_date: string; notes?: string }[]) => {
      // First delete existing schedules for the affected month
      const months = [...new Set(duties.map(d => d.duty_date.substring(0, 7)))];
      
      for (const month of months) {
        const [year, m] = month.split('-').map(Number);
        const startDate = format(new Date(year, m - 1, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(year, m, 0), 'yyyy-MM-dd');
        
        await supabase
          .from('duty_schedules')
          .delete()
          .gte('duty_date', startDate)
          .lte('duty_date', endDate);
      }
      
      // Insert new schedules
      const { data, error } = await supabase
        .from('duty_schedules')
        .insert(
          duties.map(duty => ({
            teacher_name: duty.teacher_name,
            duty_date: duty.duty_date,
            notes: duty.notes || null,
            created_by: user?.id,
          }))
        )
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutySchedules'] });
    },
  });

  // Update duty schedule
  const updateDutyMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DutySchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('duty_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutySchedules'] });
    },
  });

  // Delete duty schedule
  const deleteDutyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('duty_schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutySchedules'] });
    },
  });

  return {
    todayDuty,
    isLoadingToday,
    useDutyByMonth,
    useDutyByDate,
    canManage,
    addDuty: addDutyMutation.mutateAsync,
    bulkAddDuty: bulkAddDutyMutation.mutateAsync,
    updateDuty: updateDutyMutation.mutateAsync,
    deleteDuty: deleteDutyMutation.mutateAsync,
    isAdding: addDutyMutation.isPending,
    isBulkAdding: bulkAddDutyMutation.isPending,
  };
}
