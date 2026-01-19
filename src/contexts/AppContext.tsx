import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, Teacher, AttendanceRecord, Report } from '@/types';
import { mockTeachers, classes, schoolInfo } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  currentUser: { id: string; name: string };
  schoolInfo: typeof schoolInfo;
  classes: typeof classes;
  isLoadingStudents: boolean;
  refetchStudents: () => void;
  isLoadingReports: boolean;
  refetchReports: () => void;
  createReport: (report: Omit<Report, 'id' | 'createdAt'> & { classId?: string }) => Promise<Report>;
  deleteReport: (reportId: string) => Promise<void>;
  isCreatingReport: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  
  // Reports state  
  const [reports, setReports] = useState<Report[]>([]);

  // Fetch students directly in AppContext to avoid circular dependency
  const { data: dbStudents = [], isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        classId: s.class_id,
        isBoarding: s.is_boarding ?? false,
        phone: s.phone ?? undefined,
        parentPhone: s.parent_phone ?? undefined,
        address: s.address ?? undefined,
        gender: s.gender ?? undefined,
        dateOfBirth: s.date_of_birth ?? undefined,
        room: s.room ?? undefined,
        mealGroup: s.meal_group ?? undefined,
        cccd: s.cccd ?? undefined,
      }));
    },
    enabled: !!user,
  });

  // Fetch reports directly in AppContext
  const { data: dbReports = [], isLoading: isLoadingReports, refetch: refetchReports } = useQuery({
    queryKey: ['attendance-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_reports')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((r: any) => ({
        id: r.id,
        type: r.type as 'evening_study' | 'boarding' | 'meal',
        date: r.date,
        session: r.session,
        mealType: r.meal_type,
        totalStudents: r.total_students,
        presentCount: r.present_count,
        absentCount: r.absent_count,
        absentStudents: r.absent_students,
        reporterId: r.reporter_id,
        reporterName: r.reporter_name,
        notes: r.notes,
        createdAt: r.created_at,
        classId: r.class_id,
      }));
    },
    enabled: !!user,
  });

  // Sync students from database
  useEffect(() => {
    if (dbStudents && dbStudents.length > 0) {
      setStudents(dbStudents);
    }
  }, [dbStudents]);

  // Sync reports from database
  useEffect(() => {
    if (dbReports) {
      setReports(dbReports);
    }
  }, [dbReports]);

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('teachers');
    return saved ? JSON.parse(saved) : mockTeachers;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('attendanceRecords');
    return saved ? JSON.parse(saved) : [];
  });

  // Use authenticated user info if available, otherwise fallback
  const currentUser = {
    id: user?.id || '1',
    name: profile?.full_name || 'Nguyễn Hồng Dân'
  };

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'createdAt'> & { classId?: string }) => {
      const { data, error } = await supabase
        .from('attendance_reports')
        .insert({
          type: report.type,
          date: report.date,
          session: report.session,
          meal_type: report.mealType,
          total_students: report.totalStudents,
          present_count: report.presentCount,
          absent_count: report.absentCount,
          absent_students: report.absentStudents,
          reporter_id: report.reporterId,
          reporter_name: report.reporterName,
          notes: report.notes,
          class_id: report.classId,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        type: data.type as 'evening_study' | 'boarding' | 'meal',
        date: data.date,
        session: data.session,
        mealType: data.meal_type as 'breakfast' | 'lunch' | 'dinner' | undefined,
        totalStudents: data.total_students,
        presentCount: data.present_count,
        absentCount: data.absent_count,
        absentStudents: data.absent_students as Report['absentStudents'],
        reporterId: data.reporter_id,
        reporterName: data.reporter_name,
        notes: data.notes,
        createdAt: data.created_at,
        classId: data.class_id,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-reports'] });
      toast({ title: 'Thành công', description: 'Đã lưu báo cáo điểm danh.' });
    },
    onError: (error) => {
      console.error('Error creating report:', error);
      toast({ title: 'Lỗi', description: 'Không thể lưu báo cáo.', variant: 'destructive' });
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('attendance_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-reports'] });
      toast({ title: 'Thành công', description: 'Đã xóa báo cáo.' });
    },
    onError: (error) => {
      console.error('Error deleting report:', error);
      toast({ title: 'Lỗi', description: 'Không thể xóa báo cáo.', variant: 'destructive' });
    },
  });

  const createReport = async (report: Omit<Report, 'id' | 'createdAt'> & { classId?: string }): Promise<Report> => {
    return createReportMutation.mutateAsync(report);
  };

  const deleteReport = async (reportId: string): Promise<void> => {
    return deleteReportMutation.mutateAsync(reportId);
  };

  const isCreatingReport = createReportMutation.isPending;

  // No longer save students or reports to localStorage - they come from database

  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  return (
    <AppContext.Provider
      value={{
        students,
        setStudents,
        teachers,
        setTeachers,
        attendanceRecords,
        setAttendanceRecords,
        reports,
        setReports,
        currentUser,
        schoolInfo,
        classes,
        isLoadingStudents,
        refetchStudents,
        isLoadingReports,
        refetchReports,
        createReport,
        deleteReport,
        isCreatingReport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
