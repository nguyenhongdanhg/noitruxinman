export interface Student {
  id: string;
  name: string;
  dateOfBirth: string;
  classId: string;
  room: string;
  mealGroup: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject?: string;
  phone?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  type: 'evening_study' | 'boarding' | 'meal';
  session?: 'morning_exercise' | 'noon_nap' | 'evening_sleep' | 'random';
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  isPresent: boolean;
  reason?: string;
  reporterId: string;
  reporterName: string;
  createdAt: string;
}

export interface Report {
  id: string;
  date: string;
  type: 'evening_study' | 'boarding' | 'meal';
  session?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  absentStudents: { studentId: string; name: string; classId: string; room?: string; mealGroup?: string; reason?: string; permission?: 'P' | 'KP' }[];
  notes?: string;
  reporterId: string;
  reporterName: string;
  createdAt: string;
}

export interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}
