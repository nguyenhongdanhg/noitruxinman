import { useState, useMemo, useRef } from 'react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, CheckCircle2, XCircle, Share2, Save, Users, ChevronDown, ChevronUp, Image, Download, Settings2 } from 'lucide-react';
import { AbsentStudentRow } from './AbsentStudentRow';
import html2canvas from 'html2canvas';

interface CompactAttendanceFormProps {
  type: 'evening_study' | 'boarding';
  title: string;
  filterClassId?: string;
}

export function CompactAttendanceForm({ type, title, filterClassId }: CompactAttendanceFormProps) {
  const { students, classes, currentUser, createReport, isCreatingReport, schoolInfo } = useApp();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState<string>(filterClassId || 'all');
  const [session, setSession] = useState<string>('');
  const [absentStudentIds, setAbsentStudentIds] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [permissions, setPermissions] = useState<Record<string, 'P' | 'KP'>>({});
  const [notes, setNotes] = useState('');
  const [viewClassFilter, setViewClassFilter] = useState<string>('all');
  
  // UI States
  const [isStudentListOpen, setIsStudentListOpen] = useState(true);
  const [isAbsentDetailOpen, setIsAbsentDetailOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const availableClasses = useMemo(() => {
    if (filterClassId) {
      return classes.filter(c => c.id === filterClassId);
    }
    return classes;
  }, [classes, filterClassId]);

  const reportStudents = useMemo(() => {
    let result = students;
    if (filterClassId) {
      result = result.filter((s) => s.classId === filterClassId);
    } else if (selectedClass !== 'all') {
      result = result.filter((s) => s.classId === selectedClass);
    }
    return result;
  }, [students, selectedClass, filterClassId]);

  const displayStudents = useMemo(() => {
    if (viewClassFilter === 'all') {
      return reportStudents;
    }
    return reportStudents.filter((s) => s.classId === viewClassFilter);
  }, [reportStudents, viewClassFilter]);

  const classesInReport = useMemo(() => {
    const classIds = new Set(reportStudents.map((s) => s.classId));
    return classes.filter((c) => classIds.has(c.id));
  }, [reportStudents, classes]);

  const markAllAbsent = () => {
    const newSet = new Set(absentStudentIds);
    displayStudents.forEach((s) => newSet.add(s.id));
    setAbsentStudentIds(newSet);
  };

  const markAllPresent = () => {
    const newSet = new Set(absentStudentIds);
    displayStudents.forEach((s) => newSet.delete(s.id));
    setAbsentStudentIds(newSet);
  };

  const toggleAbsent = (studentId: string) => {
    const newSet = new Set(absentStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setAbsentStudentIds(newSet);
  };

  const absentStudents = reportStudents.filter((s) => absentStudentIds.has(s.id));
  const presentCount = reportStudents.length - absentStudents.length;

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || classId;
  };

  const getSessionLabel = (s?: string) => {
    switch (s) {
      case 'morning_exercise': return 'Thể dục sáng';
      case 'noon_nap': return 'Ngủ trưa';
      case 'evening_sleep': return 'Ngủ tối';
      case 'random': return 'Đột xuất';
      default: return '';
    }
  };

  // Group absent by class
  const getAbsentByClass = () => {
    const grouped: Record<string, typeof absentStudents> = {};
    absentStudents.forEach((a) => {
      if (!grouped[a.classId]) grouped[a.classId] = [];
      grouped[a.classId].push(a);
    });
    return grouped;
  };

  // Group absent by room for boarding
  const getAbsentByRoom = () => {
    const grouped: Record<string, typeof absentStudents> = {};
    absentStudents.forEach((a) => {
      const room = a.room || 'Chưa xếp';
      if (!grouped[room]) grouped[room] = [];
      grouped[room].push(a);
    });
    return grouped;
  };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      const typeLabel = type === 'evening_study' ? 'tuhoc' : 'noitru';
      const fileName = `baocao_${typeLabel}_${format(new Date(date), 'ddMMyyyy')}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: 'Xuất ảnh thành công',
        description: `Đã tải xuống ${fileName}`,
      });
    } catch (error) {
      toast({
        title: 'Lỗi xuất ảnh',
        description: 'Không thể xuất báo cáo dạng ảnh',
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  const saveReport = async () => {
    try {
      await createReport({
        date,
        type,
        session: type === 'boarding' ? session : undefined,
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

      setShowReportPreview(true);

      toast({
        title: 'Lưu báo cáo thành công',
        description: `Báo cáo ngày ${format(new Date(date), 'dd/MM/yyyy', { locale: vi })} đã được lưu`,
      });

    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const resetForm = () => {
    setAbsentStudentIds(new Set());
    setReasons({});
    setPermissions({});
    setNotes('');
    setShowReportPreview(false);
  };

  const shareToZalo = () => {
    const sessionLabel = session ? ` - ${getSessionLabel(session)}` : '';
    
    let message = `📋 BÁO CÁO ${title.toUpperCase()}${sessionLabel}\n`;
    message += `📅 Ngày: ${format(new Date(date), 'dd/MM/yyyy', { locale: vi })}\n`;
    message += `👤 Người báo cáo: ${currentUser.name}\n\n`;
    message += `📊 THỐNG KÊ:\n`;
    message += `• Tổng số: ${reportStudents.length} HS\n`;
    message += `• Có mặt: ${presentCount} HS\n`;
    message += `• Vắng: ${absentStudents.length} HS\n`;

    if (absentStudents.length > 0) {
      message += `\n❌ DANH SÁCH VẮNG:\n`;
      const groupedByClass = getAbsentByClass();
      Object.entries(groupedByClass).forEach(([classId, classStudents]) => {
        message += `\n🏫 Lớp ${getClassName(classId)}:\n`;
        classStudents.forEach((s, i) => {
          const reason = reasons[s.id] ? ` - ${reasons[s.id]}` : '';
          const perm = permissions[s.id] === 'P' ? '(P)' : '(KP)';
          message += `${i + 1}. ${s.name} ${perm}${reason}\n`;
        });
      });
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://zalo.me/?text=${encodedMessage}`, '_blank');
  };

  const absentByClass = getAbsentByClass();
  const absentByRoom = getAbsentByRoom();

  // Report Preview Modal Content
  if (showReportPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Báo cáo đã lưu</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportAsImage} disabled={isExporting}>
              <Download className="h-4 w-4 mr-1" />
              Tải ảnh
            </Button>
            <Button variant="outline" size="sm" onClick={shareToZalo}>
              <Share2 className="h-4 w-4 mr-1" />
              Zalo
            </Button>
            <Button size="sm" onClick={resetForm}>
              Báo cáo mới
            </Button>
          </div>
        </div>

        {/* Report Image Preview */}
        <div ref={reportRef} className="bg-white p-4 sm:p-6 rounded-lg border" style={{ maxWidth: '800px' }}>
          <div className="text-center mb-4 pb-4 border-b">
            <h2 className="text-sm text-gray-600">{schoolInfo.name}</h2>
            <h1 className="text-lg font-bold text-primary mt-2">
              {type === 'evening_study' ? 'BÁO CÁO ĐIỂM DANH GIỜ TỰ HỌC' : 
               `BÁO CÁO ĐIỂM DANH NỘI TRÚ (${getSessionLabel(session)})`}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Ngày {format(new Date(date), 'dd/MM/yyyy', { locale: vi })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{reportStudents.length}</p>
              <p className="text-xs text-gray-500">Tổng số</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-gray-500">Có mặt</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{absentStudents.length}</p>
              <p className="text-xs text-gray-500">Vắng</p>
            </div>
          </div>

          {absentStudents.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-gray-800">
                Danh sách vắng {type === 'boarding' ? 'theo phòng' : 'theo lớp'}
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left w-12">STT</th>
                    <th className="border p-2 text-left w-20">Lớp</th>
                    {type === 'boarding' && <th className="border p-2 text-left w-20">Phòng</th>}
                    <th className="border p-2 text-center w-16">SL</th>
                    <th className="border p-2 text-left">Tên vắng (P/KP)</th>
                  </tr>
                </thead>
                <tbody>
                  {type === 'evening_study' ? (
                    Object.entries(absentByClass).map(([classId, classStudents], idx) => (
                      <tr key={classId}>
                        <td className="border p-2 text-center">{idx + 1}</td>
                        <td className="border p-2">{getClassName(classId)}</td>
                        <td className="border p-2 text-center">{classStudents.length}</td>
                        <td className="border p-2">
                          {classStudents.map((s, i) => (
                            <span key={s.id}>
                              {s.name} ({permissions[s.id] || 'KP'})
                              {i < classStudents.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    Object.entries(absentByRoom).map(([room, roomStudents], idx) => {
                      const byClassInRoom: Record<string, typeof roomStudents> = {};
                      roomStudents.forEach((s) => {
                        if (!byClassInRoom[s.classId]) byClassInRoom[s.classId] = [];
                        byClassInRoom[s.classId].push(s);
                      });
                      return Object.entries(byClassInRoom).map(([classId, classStudents], classIdx) => (
                        <tr key={`${room}-${classId}`}>
                          <td className="border p-2 text-center">{idx + classIdx + 1}</td>
                          <td className="border p-2">{getClassName(classId)}</td>
                          <td className="border p-2">{room}</td>
                          <td className="border p-2 text-center">{classStudents.length}</td>
                          <td className="border p-2">
                            {classStudents.map((s, i) => (
                              <span key={s.id}>
                                {s.name} ({permissions[s.id] || 'KP'})
                                {i < classStudents.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ));
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-sm text-gray-500 flex justify-between">
            <span>Người báo cáo: {currentUser.name}</span>
            <span>Lúc {format(new Date(), 'HH:mm dd/MM/yyyy', { locale: vi })}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact Header Card */}
      <Card>
        <CardContent className="py-3 sm:py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Ngày</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {type === 'boarding' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Buổi</label>
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger className="h-9 text-sm">
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

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Lớp</label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
                disabled={!!filterClassId}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {!filterClassId && <SelectItem value="all">Tất cả lớp</SelectItem>}
                  {availableClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>Lớp {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-full">
                    <Settings2 className="h-4 w-4 mr-1" />
                    Ghi chú
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[300px]">
                  <SheetHeader>
                    <SheetTitle>Ghi chú báo cáo</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <Textarea
                      placeholder="Nhập ghi chú nếu có..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={6}
                      className="text-sm"
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List - Collapsible */}
      <Collapsible open={isStudentListOpen} onOpenChange={setIsStudentListOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Chọn vắng ({absentStudents.length}/{reportStudents.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); markAllPresent(); }} className="h-7 px-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />Đủ
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); markAllAbsent(); }} className="h-7 px-2 text-xs">
                      <XCircle className="h-3 w-3 mr-1" />Vắng
                    </Button>
                  </div>
                  {isStudentListOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-3">
              {/* Class filter chips */}
              {classesInReport.length > 1 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  <Button
                    variant={viewClassFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewClassFilter('all')}
                    className="h-7 text-xs px-2"
                  >
                    Tất cả
                  </Button>
                  {classesInReport.map((c) => (
                    <Button
                      key={c.id}
                      variant={viewClassFilter === c.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewClassFilter(c.id)}
                      className="h-7 text-xs px-2"
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Student grid - Compact, only names */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                {displayStudents.map((student) => {
                  const isAbsent = absentStudentIds.has(student.id);
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer active:scale-[0.98] ${
                        isAbsent
                          ? 'bg-destructive/10 border-destructive/40'
                          : 'bg-muted/30 border-border hover:bg-muted/50'
                      }`}
                      onClick={() => toggleAbsent(student.id)}
                    >
                      <Checkbox
                        checked={isAbsent}
                        onCheckedChange={() => toggleAbsent(student.id)}
                        className="h-4 w-4"
                      />
                      <span className={`text-sm truncate ${isAbsent ? 'text-destructive font-medium' : ''}`}>
                        {student.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Absent Detail - Collapsible */}
      {absentStudents.length > 0 && (
        <Collapsible open={isAbsentDetailOpen} onOpenChange={setIsAbsentDetailOpen}>
          <Card className="border-destructive/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-destructive">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    Chi tiết vắng ({absentStudents.length})
                  </CardTitle>
                  {isAbsentDetailOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-3 space-y-2">
                {absentStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {getClassName(student.classId)} • P.{student.room} • M.{student.mealGroup}
                      </span>
                    </div>
                    <Select
                      value={permissions[student.id] || 'KP'}
                      onValueChange={(value) => setPermissions({ ...permissions, [student.id]: value as 'P' | 'KP' })}
                    >
                      <SelectTrigger className="w-16 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="KP">KP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Lý do"
                      value={reasons[student.id] || ''}
                      onChange={(e) => setReasons({ ...reasons, [student.id]: e.target.value })}
                      className="w-24 sm:w-32 h-7 text-xs"
                    />
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Summary & Actions */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span>Tổng: <strong>{reportStudents.length}</strong></span>
              <span className="text-success">Đủ: <strong>{presentCount}</strong></span>
              <span className="text-destructive">Vắng: <strong>{absentStudents.length}</strong></span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={shareToZalo}>
                <Share2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Zalo</span>
              </Button>
              <Button size="sm" onClick={saveReport} disabled={isCreatingReport}>
                <Save className="h-4 w-4 mr-1" />
                Lưu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
