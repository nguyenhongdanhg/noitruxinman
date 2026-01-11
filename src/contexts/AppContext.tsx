import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, Teacher, AttendanceRecord, Report } from '@/types';
import { mockStudents, mockTeachers, classes, schoolInfo } from '@/data/mockData';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('students');
    return saved ? JSON.parse(saved) : mockStudents;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('teachers');
    return saved ? JSON.parse(saved) : mockTeachers;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('attendanceRecords');
    return saved ? JSON.parse(saved) : [];
  });

  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem('reports');
    return saved ? JSON.parse(saved) : [];
  });

  const currentUser = { id: '1', name: 'Nguyễn Hồng Dân' };

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('reports', JSON.stringify(reports));
  }, [reports]);

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
