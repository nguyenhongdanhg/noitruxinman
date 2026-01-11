import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Student } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface StudentTableProps {
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string) => void;
}

export function StudentTable({ onEdit, onDelete }: StudentTableProps) {
  const { students, classes } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getClassName = (classId: string) => {
    const classInfo = classes.find((c) => c.id === classId);
    return classInfo?.name || classId;
  };

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

      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Ngày sinh</TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Phòng ở</TableHead>
              <TableHead>Mâm ăn</TableHead>
              <TableHead className="w-24 text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student, index) => (
              <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="text-center font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>
                  {format(new Date(student.dateOfBirth), 'dd/MM/yyyy', { locale: vi })}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {getClassName(student.classId)}
                  </span>
                </TableCell>
                <TableCell>{student.room}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {student.mealGroup}
                  </span>
                </TableCell>
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
        Hiển thị {filteredStudents.length} / {students.length} học sinh
      </div>
    </div>
  );
}
