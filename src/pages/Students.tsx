import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { StudentTable } from '@/components/students/StudentTable';
import { ExcelImport } from '@/components/students/ExcelImport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Student } from '@/types';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Students() {
  const { students, setStudents, classes } = useApp();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    classId: '',
    room: '',
    mealGroup: 'M1',
  });

  // Chỉ admin hoặc class_teacher mới có quyền sửa/xóa
  const canEditDelete = hasRole('admin') || hasRole('class_teacher');

  const openAddDialog = () => {
    setEditingStudent(null);
    setFormData({ name: '', dateOfBirth: '', classId: '', room: '', mealGroup: 'M1' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      dateOfBirth: student.dateOfBirth,
      classId: student.classId,
      room: student.room,
      mealGroup: student.mealGroup,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.dateOfBirth || !formData.classId || !formData.room) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    if (editingStudent) {
      setStudents(students.map((s) =>
        s.id === editingStudent.id ? { ...s, ...formData } : s
      ));
      toast({
        title: 'Cập nhật thành công',
        description: `Đã cập nhật thông tin học sinh ${formData.name}`,
      });
    } else {
      const newStudent: Student = {
        id: `student-${Date.now()}`,
        ...formData,
      };
      setStudents([...students, newStudent]);
      toast({
        title: 'Thêm thành công',
        description: `Đã thêm học sinh ${formData.name}`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (student && confirm(`Bạn có chắc muốn xóa học sinh ${student.name}?`)) {
      setStudents(students.filter((s) => s.id !== studentId));
      toast({
        title: 'Xóa thành công',
        description: `Đã xóa học sinh ${student.name}`,
      });
    }
  };

  const handleDeleteAll = () => {
    setStudents([]);
    toast({
      title: 'Xóa thành công',
      description: 'Đã xóa tất cả học sinh',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Quản lý học sinh
          </h1>
          <p className="text-muted-foreground mt-1">Danh sách và thông tin học sinh nội trú</p>
        </div>
        {canEditDelete && (
          <div className="flex gap-2">
            {students.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Xóa tất cả
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa tất cả học sinh?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc muốn xóa tất cả {students.length} học sinh? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Xóa tất cả
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={openAddDialog} className="gap-2 gradient-primary">
              <UserPlus className="h-4 w-4" />
              Thêm học sinh
            </Button>
          </div>
        )}
      </div>

      {canEditDelete && <ExcelImport />}

      <StudentTable onEdit={canEditDelete ? openEditDialog : undefined} onDelete={canEditDelete ? handleDelete : undefined} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin học sinh bên dưới
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Họ và tên <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Nhập họ và tên"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Ngày sinh <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Lớp <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.classId}
                onValueChange={(v) => setFormData({ ...formData, classId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      Lớp {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Phòng ở <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VD: P101"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Mâm ăn
              </label>
              <Select
                value={formData.mealGroup}
                onValueChange={(v) => setFormData({ ...formData, mealGroup: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M1">Mâm 1</SelectItem>
                  <SelectItem value="M2">Mâm 2</SelectItem>
                  <SelectItem value="M3">Mâm 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              {editingStudent ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
