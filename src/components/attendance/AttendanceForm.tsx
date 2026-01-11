import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Report } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, CheckCircle2, XCircle, Share2, Save, Users } from 'lucide-react';

interface AttendanceFormProps {
  type: 'evening_study' | 'boarding' | 'meal';
  title: string;
}

export function AttendanceForm({ type, title }: AttendanceFormProps) {
  const { students, classes, currentUser, reports, setReports } = useApp();
  const { toast } = useToast();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [session, setSession] = useState<string>('');
  const [mealType, setMealType] = useState<string>('');
  const [presentStudents, setPresentStudents] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  const filteredStudents = useMemo(() => {
    if (selectedClass === 'all') return students;
    return students.filter((s) => s.classId === selectedClass);
  }, [students, selectedClass]);

  const selectAll = () => {
    const allIds = new Set(filteredStudents.map((s) => s.id));
    setPresentStudents(allIds);
  };

  const deselectAll = () => {
    setPresentStudents(new Set());
  };

  const toggleStudent = (studentId: string) => {
    const newSet = new Set(presentStudents);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setPresentStudents(newSet);
  };

  const absentStudents = filteredStudents.filter((s) => !presentStudents.has(s.id));

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || classId;
  };

  const canSubmit = () => {
    if (type === 'meal') {
      const now = new Date();
      const currentHour = now.getHours();
      const selectedDate = new Date(date);
      const isToday = format(now, 'yyyy-MM-dd') === date;
      const isYesterday = format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd') === date;

      if (mealType === 'breakfast') {
        // Bữa sáng: nhập trước 22h ngày hôm trước
        if (isToday && currentHour >= 22) return false;
      } else if (mealType === 'lunch') {
        // Bữa trưa: nhập trước 8h cùng ngày
        if (isToday && currentHour >= 8) return false;
      } else if (mealType === 'dinner') {
        // Bữa tối: nhập trước 15h cùng ngày
        if (isToday && currentHour >= 15) return false;
      }
    }
    return true;
  };

  const saveReport = () => {
    const report: Report = {
      id: `report-${Date.now()}`,
      date,
      type,
      session: type === 'boarding' ? session : undefined,
      mealType: type === 'meal' ? (mealType as 'breakfast' | 'lunch' | 'dinner') : undefined,
      totalStudents: filteredStudents.length,
      presentCount: presentStudents.size,
      absentCount: absentStudents.length,
      absentStudents: absentStudents.map((s) => ({
        studentId: s.id,
        name: s.name,
        classId: s.classId,
        room: s.room,
        reason: reasons[s.id] || '',
      })),
      notes,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setReports([...reports, report]);

    toast({
      title: 'Lưu báo cáo thành công',
      description: `Báo cáo ngày ${format(new Date(date), 'dd/MM/yyyy', { locale: vi })} đã được lưu`,
    });
  };

  const shareToZalo = () => {
    const sessionLabel = session ? ` - ${session}` : '';
    const mealLabel = mealType ? ` - Bữa ${mealType === 'breakfast' ? 'sáng' : mealType === 'lunch' ? 'trưa' : 'tối'}` : '';
    
    let message = `📋 BÁO CÁO ${title.toUpperCase()}${sessionLabel}${mealLabel}\n`;
    message += `📅 Ngày: ${format(new Date(date), 'dd/MM/yyyy', { locale: vi })}\n`;
    message += `👤 Người báo cáo: ${currentUser.name}\n\n`;
    message += `📊 THỐNG KÊ:\n`;
    message += `• Tổng số: ${filteredStudents.length} học sinh\n`;
    message += `• Có mặt: ${presentStudents.size} học sinh\n`;
    message += `• Vắng: ${absentStudents.length} học sinh\n\n`;

    if (absentStudents.length > 0) {
      message += `❌ DANH SÁCH VẮNG:\n`;
      const groupedByClass: Record<string, typeof absentStudents> = {};
      
      absentStudents.forEach((s) => {
        if (!groupedByClass[s.classId]) {
          groupedByClass[s.classId] = [];
        }
        groupedByClass[s.classId].push(s);
      });

      Object.entries(groupedByClass).forEach(([classId, students]) => {
        message += `\n🏫 Lớp ${getClassName(classId)}:\n`;
        students.forEach((s, i) => {
          const reason = reasons[s.id] ? ` (${reasons[s.id]})` : '';
          message += `  ${i + 1}. ${s.name} - Phòng ${s.room}${reason}\n`;
        });
      });
    }

    if (notes) {
      message += `\n📝 Ghi chú: ${notes}`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://zalo.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Thông tin điểm danh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Ngày điểm danh</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {type === 'boarding' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Buổi</label>
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn buổi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning_exercise">Thể dục sáng</SelectItem>
                    <SelectItem value="noon_nap">Ngủ trưa</SelectItem>
                    <SelectItem value="evening_sleep">Ngủ tối</SelectItem>
                    <SelectItem value="random">Đột xuất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === 'meal' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Bữa ăn</label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn bữa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Bữa sáng</SelectItem>
                    <SelectItem value="lunch">Bữa trưa</SelectItem>
                    <SelectItem value="dinner">Bữa tối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Lớp</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
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

          {notes !== undefined && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Ghi chú / Sự việc bất thường</label>
              <Textarea
                placeholder="Nhập ghi chú nếu có..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Danh sách học sinh ({filteredStudents.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Chọn tất cả
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                <XCircle className="h-4 w-4 mr-1" />
                Bỏ chọn
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStudents.map((student) => {
              const isPresent = presentStudents.has(student.id);
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isPresent
                      ? 'bg-success/10 border-success/30'
                      : 'bg-destructive/5 border-destructive/20'
                  }`}
                  onClick={() => toggleStudent(student.id)}
                >
                  <Checkbox
                    checked={isPresent}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Lớp {getClassName(student.classId)} • Phòng {student.room}
                    </p>
                  </div>
                  {isPresent ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Absent Students with Reasons */}
      {absentStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Học sinh vắng ({absentStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {absentStudents.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Lớp {getClassName(student.classId)} • Phòng {student.room}
                    </p>
                  </div>
                  <Input
                    placeholder="Lý do vắng..."
                    value={reasons[student.id] || ''}
                    onChange={(e) => setReasons({ ...reasons, [student.id]: e.target.value })}
                    className="w-48"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary & Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{filteredStudents.length}</p>
                <p className="text-sm text-muted-foreground">Tổng số</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{presentStudents.size}</p>
                <p className="text-sm text-muted-foreground">Có mặt</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">{absentStudents.length}</p>
                <p className="text-sm text-muted-foreground">Vắng</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={saveReport}
                disabled={!canSubmit()}
                className="gap-2 gradient-primary"
              >
                <Save className="h-4 w-4" />
                Lưu báo cáo
              </Button>
              <Button
                variant="outline"
                onClick={shareToZalo}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Chia sẻ Zalo
              </Button>
            </div>
          </div>

          {type === 'meal' && !canSubmit() && (
            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-sm text-warning">
                ⚠️ Đã quá thời gian đăng ký bữa ăn này. Vui lòng liên hệ quản trị viên.
              </p>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Người báo cáo: <span className="font-medium text-foreground">{currentUser.name}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
