import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents, Student } from '@/hooks/useStudents';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface StudentTableProps {
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string) => void;
}

export function StudentTable({ onEdit, onDelete }: StudentTableProps) {
  const { classes } = useApp();
  const { students, isLoading, deleteStudent } = useStudents();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // Chỉ admin hoặc class_teacher mới có quyền sửa/xóa
  const canEditDelete = hasRole('admin') || hasRole('class_teacher');

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getClassName = (classId: string) => {
    const classInfo = classes.find((c) => c.id === classId);
    return classInfo?.name || classId;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    const count = selectedIds.size;
    setIsDeletingSelected(true);
    try {
      // Delete each selected student
      for (const id of selectedIds) {
        await deleteStudent(id);
      }
      setSelectedIds(new Set());
      toast({
        title: 'Xóa thành công',
        description: `Đã xóa ${count} học sinh`,
      });
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));
  const isSomeSelected = filteredStudents.some(s => selectedIds.has(s.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && canEditDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2" disabled={isDeletingSelected}>
                  {isDeletingSelected ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Xóa đã chọn ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa học sinh?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa {selectedIds.size} học sinh đã chọn? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Chọn lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  Lớp {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">
                <Checkbox 
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Chọn tất cả"
                  className={isSomeSelected && !isAllSelected ? "opacity-50" : ""}
                />
              </TableHead>
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Giới tính</TableHead>
              <TableHead>SĐT Phụ huynh</TableHead>
              {canEditDelete && <TableHead className="w-24 text-center">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student, index) => (
              <TableRow 
                key={student.id} 
                className={`hover:bg-muted/30 transition-colors ${selectedIds.has(student.id) ? 'bg-primary/5' : ''}`}
              >
                <TableCell className="text-center">
                  <Checkbox 
                    checked={selectedIds.has(student.id)}
                    onCheckedChange={(checked) => handleSelectOne(student.id, checked as boolean)}
                    aria-label={`Chọn ${student.name}`}
                  />
                </TableCell>
                <TableCell className="text-center font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {getClassName(student.classId)}
                  </span>
                </TableCell>
                <TableCell>{student.gender || '-'}</TableCell>
                <TableCell>{student.parentPhone || '-'}</TableCell>
                {canEditDelete && (
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onEdit?.(student)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete?.(student.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>Không tìm thấy học sinh nào</p>
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedIds.size > 0 && (
          <span className="text-primary font-medium mr-2">Đã chọn {selectedIds.size} học sinh</span>
        )}
        Hiển thị {filteredStudents.length} / {students.length} học sinh
      </div>
    </div>
  );
}
