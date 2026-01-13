import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Report } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface DbReport {
  id: string;
  date: string;
  type: 'evening_study' | 'boarding' | 'meal';
  session: string | null;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | null;
  class_id: string | null;
  total_students: number;
  present_count: number;
  absent_count: number;
  absent_students: {
    studentId: string;
    name: string;
    classId: string;
    room?: string;
    mealGroup?: string;
    reason?: string;
    permission?: 'P' | 'KP';
  }[];
  notes: string | null;
  reporter_id: string;
  reporter_name: string;
  created_at: string;
  updated_at: string;
}

// Convert database format to app format
const dbToAppReport = (dbReport: DbReport): Report => ({
  id: dbReport.id,
  date: dbReport.date,
  type: dbReport.type,
  session: dbReport.session || undefined,
  mealType: dbReport.meal_type || undefined,
  totalStudents: dbReport.total_students,
  presentCount: dbReport.present_count,
  absentCount: dbReport.absent_count,
  absentStudents: dbReport.absent_students || [],
  notes: dbReport.notes || undefined,
  reporterId: dbReport.reporter_id,
  reporterName: dbReport.reporter_name,
  createdAt: dbReport.created_at,
});

// Convert app format to database format
const appToDbReport = (report: Omit<Report, 'id' | 'createdAt'> & { classId?: string }) => ({
  date: report.date,
  type: report.type,
  session: report.session || null,
  meal_type: report.mealType || null,
  class_id: report.classId || null,
  total_students: report.totalStudents,
  present_count: report.presentCount,
  absent_count: report.absentCount,
  absent_students: report.absentStudents,
  notes: report.notes || null,
  reporter_id: report.reporterId,
  reporter_name: report.reporterName,
});

export function useReports() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['attendance-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_reports')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }

      return (data as unknown as DbReport[]).map(dbToAppReport);
    },
  });

  const createReport = useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'createdAt'> & { classId?: string }) => {
      const dbReport = appToDbReport(report);
      
      const { data, error } = await supabase
        .from('attendance_reports')
        .insert(dbReport)
        .select()
        .single();

      if (error) {
        console.error('Error creating report:', error);
        throw error;
      }

      return dbToAppReport(data as unknown as DbReport);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-reports'] });
    },
    onError: (error) => {
      console.error('Failed to save report:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi lưu báo cáo',
        description: 'Không thể lưu báo cáo. Vui lòng thử lại.',
      });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('attendance_reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('Error deleting report:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-reports'] });
      toast({
        title: 'Đã xóa báo cáo',
        description: 'Báo cáo đã được xóa thành công.',
      });
    },
    onError: (error) => {
      console.error('Failed to delete report:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi xóa báo cáo',
        description: 'Không thể xóa báo cáo. Vui lòng thử lại.',
      });
    },
  });

  return {
    reports,
    isLoading,
    refetch,
    createReport: createReport.mutateAsync,
    deleteReport: deleteReport.mutateAsync,
    isCreating: createReport.isPending,
    isDeleting: deleteReport.isPending,
  };
}
