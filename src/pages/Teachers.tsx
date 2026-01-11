import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Teacher } from '@/types';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, UserPlus, Edit, Trash2, Phone, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Teachers() {
  const { teachers, setTeachers } = useApp();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    phone: '',
  });

  const openAddDialog = () => {
    setEditingTeacher(null);
    setFormData({ name: '', subject: '', phone: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      subject: teacher.subject || '',
      phone: teacher.phone || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập họ tên giáo viên',
        variant: 'destructive',
      });
      return;
    }

    if (editingTeacher) {
      setTeachers(teachers.map((t) =>
        t.id === editingTeacher.id ? { ...t, ...formData } : t
      ));
      toast({
        title: 'Cập nhật thành công',
        description: `Đã cập nhật thông tin giáo viên ${formData.name}`,
      });
    } else {
      const newTeacher: Teacher = {
        id: `teacher-${Date.now()}`,
        ...formData,
      };
      setTeachers([...teachers, newTeacher]);
      toast({
        title: 'Thêm thành công',
        description: `Đã thêm giáo viên ${formData.name}`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher && confirm(`Bạn có chắc muốn xóa giáo viên ${teacher.name}?`)) {
      setTeachers(teachers.filter((t) => t.id !== teacherId));
      toast({
        title: 'Xóa thành công',
        description: `Đã xóa giáo viên ${teacher.name}`,
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            Quản lý giáo viên
          </h1>
          <p className="text-muted-foreground mt-1">Danh sách giáo viên trong trường</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 gradient-primary">
          <UserPlus className="h-4 w-4" />
          Thêm giáo viên
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách giáo viên ({teachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Môn giảng dạy</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead className="w-24 text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher, index) => (
                  <TableRow key={teacher.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>
                      {teacher.subject ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          <BookOpen className="h-3 w-3" />
                          {teacher.subject}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacher.phone ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {teacher.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => openEditDialog(teacher)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(teacher.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {teachers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mb-4 opacity-50" />
                <p>Chưa có giáo viên nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTeacher ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin giáo viên bên dưới
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
                Môn giảng dạy
              </label>
              <Input
                placeholder="VD: Toán, Văn, Anh..."
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Số điện thoại
              </label>
              <Input
                placeholder="VD: 0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              {editingTeacher ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
