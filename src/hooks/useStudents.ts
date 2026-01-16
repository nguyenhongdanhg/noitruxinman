import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DbStudent {
  id: string;
  name: string;
  class_id: string;
  date_of_birth: string | null;
  room: string | null;
  meal_group: string | null;
  gender: string | null;
  parent_phone: string | null;
  phone: string | null;
  address: string | null;
  cccd: string | null;
  is_boarding: boolean;
  created_at: string;
  updated_at: string;
}

// Interface for the app to use (matching existing Student type format)
export interface Student {
  id: string;
  name: string;
  classId: string;
  dateOfBirth: string;
  room: string;
  mealGroup: string;
  gender?: string;
  parentPhone?: string;
  phone?: string;
  address?: string;
  cccd?: string;
  isBoarding?: boolean;
}

// Convert DB student to app format
function dbToAppStudent(dbStudent: DbStudent): Student {
  return {
    id: dbStudent.id,
    name: dbStudent.name,
    classId: dbStudent.class_id,
    dateOfBirth: dbStudent.date_of_birth || '',
    room: dbStudent.room || '',
    mealGroup: dbStudent.meal_group || 'M1',
    gender: dbStudent.gender || undefined,
    parentPhone: dbStudent.parent_phone || undefined,
    phone: dbStudent.phone || undefined,
    address: dbStudent.address || undefined,
    cccd: dbStudent.cccd || undefined,
    isBoarding: dbStudent.is_boarding,
  };
}

// Type for insert operations (requires name and class_id)
interface DbStudentInsert {
  name: string;
  class_id: string;
  date_of_birth?: string | null;
  room?: string | null;
  meal_group?: string | null;
  gender?: string | null;
  parent_phone?: string | null;
  phone?: string | null;
  address?: string | null;
  cccd?: string | null;
  is_boarding?: boolean;
}

// Type for update operations (all fields optional)
interface DbStudentUpdate {
  name?: string;
  class_id?: string;
  date_of_birth?: string | null;
  room?: string | null;
  meal_group?: string | null;
  gender?: string | null;
  parent_phone?: string | null;
  phone?: string | null;
  address?: string | null;
  cccd?: string | null;
  is_boarding?: boolean;
}

// Convert app student to DB format for insert
function appToDbStudentInsert(student: Omit<Student, 'id'>): DbStudentInsert {
  return {
    name: student.name,
    class_id: student.classId,
    date_of_birth: student.dateOfBirth || null,
    room: student.room || null,
    meal_group: student.mealGroup || 'M1',
    gender: student.gender || null,
    parent_phone: student.parentPhone || null,
    phone: student.phone || null,
    address: student.address || null,
    cccd: student.cccd || null,
    is_boarding: student.isBoarding || false,
  };
}

// Convert app student to DB format for update
function appToDbStudentUpdate(student: Partial<Student>): DbStudentUpdate {
  const result: DbStudentUpdate = {};
  
  if (student.name !== undefined) result.name = student.name;
  if (student.classId !== undefined) result.class_id = student.classId;
  if (student.dateOfBirth !== undefined) result.date_of_birth = student.dateOfBirth || null;
  if (student.room !== undefined) result.room = student.room || null;
  if (student.mealGroup !== undefined) result.meal_group = student.mealGroup || null;
  if (student.gender !== undefined) result.gender = student.gender;
  if (student.parentPhone !== undefined) result.parent_phone = student.parentPhone;
  if (student.phone !== undefined) result.phone = student.phone;
  if (student.address !== undefined) result.address = student.address;
  if (student.cccd !== undefined) result.cccd = student.cccd;
  if (student.isBoarding !== undefined) result.is_boarding = student.isBoarding;
  
  return result;
}

export function useStudents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch students from database
  const { data: students = [], isLoading, error, refetch } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data || []).map(dbToAppStudent);
    },
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (student: Omit<Student, 'id'>) => {
      const dbData = appToDbStudentInsert(student);
      const { data, error } = await supabase
        .from('students')
        .insert(dbData)
        .select()
        .single();
      
      if (error) throw error;
      return dbToAppStudent(data);
    },
    onSuccess: (newStudent) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Thêm thành công',
        description: `Đã thêm học sinh ${newStudent.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Student> & { id: string }) => {
      const dbData = appToDbStudentUpdate(updates);
      const { data, error } = await supabase
        .from('students')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return dbToAppStudent(data);
    },
    onSuccess: (updatedStudent) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Cập nhật thành công',
        description: `Đã cập nhật thông tin học sinh ${updatedStudent.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Xóa thành công',
        description: 'Đã xóa học sinh',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete all students mutation
  const deleteAllStudentsMutation = useMutation({
    mutationFn: async () => {
      // Delete all students - need to fetch IDs first due to RLS
      const { data: allStudents } = await supabase.from('students').select('id');
      if (allStudents && allStudents.length > 0) {
        const { error } = await supabase
          .from('students')
          .delete()
          .in('id', allStudents.map(s => s.id));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Xóa thành công',
        description: 'Đã xóa tất cả học sinh',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Bulk add students (for Excel import)
  const bulkAddStudentsMutation = useMutation({
    mutationFn: async (newStudents: Omit<Student, 'id'>[]) => {
      const dbData = newStudents.map(s => appToDbStudentInsert(s));
      const { data, error } = await supabase
        .from('students')
        .insert(dbData)
        .select();
      
      if (error) throw error;
      return (data || []).map(dbToAppStudent);
    },
    onSuccess: (addedStudents) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: 'Import thành công',
        description: `Đã thêm ${addedStudents.length} học sinh`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi import',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    students,
    isLoading,
    error,
    refetch,
    addStudent: addStudentMutation.mutateAsync,
    updateStudent: updateStudentMutation.mutateAsync,
    deleteStudent: deleteStudentMutation.mutateAsync,
    deleteAllStudents: deleteAllStudentsMutation.mutateAsync,
    bulkAddStudents: bulkAddStudentsMutation.mutateAsync,
    isAdding: addStudentMutation.isPending,
    isUpdating: updateStudentMutation.isPending,
    isDeleting: deleteStudentMutation.isPending,
  };
}
