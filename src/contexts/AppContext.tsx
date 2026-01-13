import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, Teacher, AttendanceRecord, Report } from '@/types';
import { mockTeachers, classes, schoolInfo } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/hooks/useStudents';
import { useReports } from '@/hooks/useReports';

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
  const { students: dbStudents, isLoading: isLoadingStudents, refetch: refetchStudents } = useStudents();
  const { 
    reports: dbReports, 
    isLoading: isLoadingReports, 
    refetch: refetchReports,
    createReport,
    deleteReport,
    isCreating: isCreatingReport,
  } = useReports();
  
  // Students now come from database via useStudents hook
  const [students, setStudents] = useState<Student[]>([]);
  
  // Reports now come from database via useReports hook
  const [reports, setReports] = useState<Report[]>([]);
  
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
