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
import { AbsentStudentRow } from './AbsentStudentRow';

interface AttendanceFormProps {
  type: 'evening_study' | 'boarding' | 'meal';
  title: string;
  filterClassId?: string;
}

export function AttendanceForm({ type, title, filterClassId }: AttendanceFormProps) {
  const { students, classes, currentUser, createReport, isCreatingReport } = useApp();
  const { toast } = useToast();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  // If filterClassId is set, default to that class
  const [selectedClass, setSelectedClass] = useState<string>(filterClassId || 'all');
  const [session, setSession] = useState<string>('');
  const [mealType, setMealType] = useState<string>('');
  // Absent students - mặc định đủ, chỉ chọn học sinh vắng
  const [absentStudentIds, setAbsentStudentIds] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [permissions, setPermissions] = useState<Record<string, 'P' | 'KP'>>({});
  const [notes, setNotes] = useState('');
  // Lọc lớp trong danh sách chọn vắng (riêng biệt với lớp trong báo cáo)
  const [viewClassFilter, setViewClassFilter] = useState<string>('all');

  // Classes available for selection (filtered for class teachers)
  const availableClasses = useMemo(() => {
    if (filterClassId) {
      return classes.filter(c => c.id === filterClassId);
    }
    return classes;
  }, [classes, filterClassId]);

  // Học sinh theo lớp được chọn cho báo cáo (dùng để tính toán và lưu)
  const reportStudents = useMemo(() => {
    let result = students;
    // If filterClassId is set (for class teachers), only show their class
    if (filterClassId) {
      result = result.filter((s) => s.classId === filterClassId);
    } else if (selectedClass !== 'all') {
      result = result.filter((s) => s.classId === selectedClass);
    }
    return result;
  }, [students, selectedClass, filterClassId]);

  // Học sinh hiển thị trong danh sách (có thể lọc theo lớp để dễ chọn)
  const displayStudents = useMemo(() => {
    if (viewClassFilter === 'all') {
      return reportStudents;
    }
    return reportStudents.filter((s) => s.classId === viewClassFilter);
  }, [reportStudents, viewClassFilter]);

  // Lấy các lớp có trong danh sách báo cáo
  const classesInReport = useMemo(() => {
    const classIds = new Set(reportStudents.map((s) => s.classId));
    return classes.filter((c) => classIds.has(c.id));
  }, [reportStudents, classes]);

  // Đánh dấu tất cả vắng (chỉ học sinh đang hiển thị)
  const markAllAbsent = () => {
    const newSet = new Set(absentStudentIds);
    displayStudents.forEach((s) => newSet.add(s.id));
    setAbsentStudentIds(newSet);
  };

  // Đánh dấu tất cả đủ (chỉ học sinh đang hiển thị)
  const markAllPresent = () => {
    const newSet = new Set(absentStudentIds);
    displayStudents.forEach((s) => newSet.delete(s.id));
    setAbsentStudentIds(newSet);
  };

  // Toggle học sinh vắng
  const toggleAbsent = (studentId: string) => {
    const newSet = new Set(absentStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setAbsentStudentIds(newSet);
  };

  // Học sinh vắng = những người được đánh dấu vắng (trong danh sách báo cáo)
  const absentStudents = reportStudents.filter((s) => absentStudentIds.has(s.id));
  // Số học sinh có mặt = tổng - vắng
  const presentCount = reportStudents.length - absentStudents.length;
  // Số vắng đang hiển thị
  const displayAbsentCount = displayStudents.filter((s) => absentStudentIds.has(s.id)).length;

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

  const saveReport = async () => {
    try {
      await createReport({
        date,
        type,
        session: type === 'boarding' ? session : undefined,
        mealType: type === 'meal' ? (mealType as 'breakfast' | 'lunch' | 'dinner') : undefined,
        classId: selectedClass !== 'all' ? selectedClass : (filterClassId || undefined),
        totalStudents: reportStudents.length,
        presentCount: presentCount,
        absentCount: absentStudents.length,
        absentStudents: absentStudents.map((s) => ({
          studentId: s.id,
          name: s.name,
          classId: s.classId,
          room: s.room,
          mealGroup: s.mealGroup,
          reason: reasons[s.id] || '',
          permission: permissions[s.id] || 'KP',
        })),
        notes,
        reporterId: currentUser.id,
        reporterName: currentUser.name,
      });

      toast({
        title: 'Lưu báo cáo thành công',
        description: `Báo cáo ngày ${format(new Date(date), 'dd/MM/yyyy', { locale: vi })} đã được lưu vào hệ thống`,
      });

      // Reset form after successful save
      setAbsentStudentIds(new Set());
      setReasons({});
      setPermissions({});
      setNotes('');
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const shareToZalo = () => {
    const sessionLabel = session ? ` - ${session}` : '';
    const mealLabel = mealType ? ` - Bữa ${mealType === 'breakfast' ? 'sáng' : mealType === 'lunch' ? 'trưa' : 'tối'}` : '';
    
    let message = `📋 BÁO CÁO ${title.toUpperCase()}${sessionLabel}${mealLabel}\n`;
    message += `📅 Ngày: ${format(new Date(date), 'dd/MM/yyyy', { locale: vi })}\n`;
    message += `👤 Người báo cáo: ${currentUser.name}\n\n`;
    message += `📊 THỐNG KÊ:\n`;
    message += `• Tổng số: ${reportStudents.length} học sinh\n`;
    message += `• Có mặt: ${presentCount} học sinh\n`;
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

      Object.entries(groupedByClass).forEach(([classId, classStudents]) => {
        message += `\n🏫 Lớp ${getClassName(classId)}:\n`;
        classStudents.forEach((s, i) => {
          const reason = reasons[s.id] ? ` - ${reasons[s.id]}` : '';
          const perm = permissions[s.id] === 'P' ? '(Có phép)' : '(Không phép)';
          message += `  ${i + 1}. ${s.name} - Phòng ${s.room} ${perm}${reason}\n`;
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
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
                disabled={!!filterClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {!filterClassId && <SelectItem value="all">Tất cả lớp</SelectItem>}
                  {availableClasses.map((c) => (
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

      {/* Student List - Click để đánh dấu vắng */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-5 w-5 text-primary" />
                Chọn học sinh vắng ({absentStudents.length}/{reportStudents.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent} className="flex-1 sm:flex-initial">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Đủ tất cả</span>
                  <span className="sm:hidden">Đủ</span>
                </Button>
                <Button variant="outline" size="sm" onClick={markAllAbsent} className="flex-1 sm:flex-initial">
                  <XCircle className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Vắng tất cả</span>
                  <span className="sm:hidden">Vắng</span>
                </Button>
              </div>
            </div>
            
            {/* Lọc theo lớp */}
            {classesInReport.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={viewClassFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewClassFilter('all')}
                  className="text-xs h-7"
                >
                  Tất cả ({reportStudents.length})
                </Button>
                {classesInReport.map((c) => {
                  const classStudentCount = reportStudents.filter((s) => s.classId === c.id).length;
                  const classAbsentCount = reportStudents.filter((s) => s.classId === c.id && absentStudentIds.has(s.id)).length;
                  return (
                    <Button
                      key={c.id}
                      variant={viewClassFilter === c.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewClassFilter(c.id)}
                      className="text-xs h-7"
                    >
                      {c.name} {classAbsentCount > 0 && <span className="text-destructive ml-1">({classAbsentCount})</span>}
                    </Button>
                  );
                })}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Mặc định tất cả đủ. Click vào học sinh để đánh dấu vắng.
              {viewClassFilter !== 'all' && ` Đang hiển thị: ${displayStudents.length} học sinh`}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-0 sm:pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {displayStudents.map((student) => {
              const isAbsent = absentStudentIds.has(student.id);
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
                    isAbsent
                      ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-success/5 border-success/20'
                  }`}
                  onClick={() => toggleAbsent(student.id)}
                >
                  <Checkbox
                    checked={isAbsent}
                    onCheckedChange={() => toggleAbsent(student.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm sm:text-base">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getClassName(student.classId)} • P.{student.room} • M.{student.mealGroup}
                    </p>
                  </div>
                  {isAbsent ? (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
              const isAbsent = absentStudentIds.has(student.id);
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
                    isAbsent
                      ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-success/5 border-success/20'
                  }`}
                  onClick={() => toggleAbsent(student.id)}
                >
                  <Checkbox
                    checked={isAbsent}
                    onCheckedChange={() => toggleAbsent(student.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm sm:text-base">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getClassName(student.classId)} • P.{student.room} • M.{student.mealGroup}
                    </p>
                  </div>
                  {isAbsent ? (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
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
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
              <XCircle className="h-5 w-5" />
              Học sinh vắng ({absentStudents.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              P = Có phép, KP = Không phép
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {absentStudents.map((student) => (
                <AbsentStudentRow
                  key={student.id}
                  student={student}
                  getClassName={getClassName}
                  reason={reasons[student.id] || ''}
                  permission={permissions[student.id] || 'KP'}
                  onReasonChange={(value) => setReasons({ ...reasons, [student.id]: value })}
                  onPermissionChange={(value) => setPermissions({ ...permissions, [student.id]: value })}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary & Actions */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-4">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
              <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                <p className="text-xl sm:text-3xl font-bold text-foreground">{reportStudents.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Tổng số</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-success/10">
                <p className="text-xl sm:text-3xl font-bold text-success">{presentCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Có mặt</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-destructive/10">
                <p className="text-xl sm:text-3xl font-bold text-destructive">{absentStudents.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Vắng</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <Button
                onClick={saveReport}
                disabled={!canSubmit() || isCreatingReport}
                className="gap-2 gradient-primary w-full sm:w-auto"
              >
                <Save className="h-4 w-4" />
                {isCreatingReport ? 'Đang lưu...' : 'Lưu báo cáo'}
              </Button>
              <Button
                variant="outline"
                onClick={shareToZalo}
                className="gap-2 w-full sm:w-auto"
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

          <div className="mt-4 text-xs sm:text-sm text-muted-foreground">
            Người báo cáo: <span className="font-medium text-foreground">{currentUser.name}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
