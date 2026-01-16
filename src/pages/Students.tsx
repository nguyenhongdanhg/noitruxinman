import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents, Student } from '@/hooks/useStudents';
import { StudentTable } from '@/components/students/StudentTable';
import { ExcelImport } from '@/components/students/ExcelImport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { UserPlus, Users, Trash2, Loader2 } from 'lucide-react';
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
  const { classes } = useApp();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const { 
    students, 
    isLoading, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    deleteAllStudents,
    isAdding,
    isUpdating,
    isDeleting 
  } = useStudents();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    classId: '',
    cccd: '',
    phone: '',
    address: '',
    room: '',
    mealGroup: 'M1',
    parentPhone: '',
  });

  // Chỉ admin hoặc class_teacher mới có quyền sửa/xóa
  const canEditDelete = hasRole('admin') || hasRole('class_teacher');

  const openAddDialog = () => {
    setEditingStudent(null);
    setFormData({ 
      name: '', 
      dateOfBirth: '', 
      gender: '',
      classId: '', 
      cccd: '',
      phone: '',
      address: '',
      room: '', 
      mealGroup: 'M1',
      parentPhone: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender || '',
      classId: student.classId,
      cccd: student.cccd || '',
      phone: student.phone || '',
      address: student.address || '',
      room: student.room,
      mealGroup: student.mealGroup,
      parentPhone: student.parentPhone || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.classId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền họ tên và lớp',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingStudent) {
        await updateStudent({ id: editingStudent.id, ...formData });
      } else {
        await addStudent(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (student && confirm(`Bạn có chắc muốn xóa học sinh ${student.name}?`)) {
      await deleteStudent(studentId);
    }
  };

  const handleDeleteAll = async () => {
    await deleteAllStudents();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin học sinh bên dưới
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>
                  Họ và tên <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nhập họ và tên"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Ngày sinh</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Giới tính</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => setFormData({ ...formData, gender: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Lớp <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.classId}
                  onValueChange={(v) => setFormData({ ...formData, classId: v })}
                >
                  <SelectTrigger className="mt-1.5">
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
                <Label>CCCD</Label>
                <Input
                  placeholder="Số CCCD"
                  value={formData.cccd}
                  onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Điện thoại học sinh</Label>
                <Input
                  placeholder="SĐT học sinh"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>SĐT phụ huynh</Label>
                <Input
                  placeholder="SĐT phụ huynh"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Địa chỉ</Label>
                <Input
                  placeholder="Địa chỉ thường trú"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Thông tin nội trú */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-primary">Thông tin nội trú</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phòng KTX</Label>
                  <Input
                    placeholder="VD: P101"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Mâm ăn</Label>
                  <Select
                    value={formData.mealGroup}
                    onValueChange={(v) => setFormData({ ...formData, mealGroup: v })}
                  >
                    <SelectTrigger className="mt-1.5">
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
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} className="gradient-primary" disabled={isAdding || isUpdating}>
              {(isAdding || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingStudent ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
