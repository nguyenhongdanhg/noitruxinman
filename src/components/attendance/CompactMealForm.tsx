import { useState, useMemo, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, CheckCircle2, XCircle, Share2, Save, ChevronDown, ChevronUp, Download, Settings2, Utensils, Coffee, Sun, Moon } from 'lucide-react';
import html2canvas from 'html2canvas';

interface CompactMealFormProps {
  filterClassId?: string;
}

type MealType = 'breakfast' | 'lunch' | 'dinner';

export function CompactMealForm({ filterClassId }: CompactMealFormProps) {
  const { students, classes, currentUser, createReport, isCreatingReport, schoolInfo } = useApp();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const isAdmin = hasRole('admin');
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState<string>(filterClassId || 'all');
  const [notes, setNotes] = useState('');
  
  const [breakfastAbsent, setBreakfastAbsent] = useState<Set<string>>(new Set());
  const [lunchAbsent, setLunchAbsent] = useState<Set<string>>(new Set());
  const [dinnerAbsent, setDinnerAbsent] = useState<Set<string>>(new Set());
  
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [permissions, setPermissions] = useState<Record<string, 'P' | 'KP'>>({});
  
  const [activeMeal, setActiveMeal] = useState<MealType>('breakfast');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [savedMealType, setSavedMealType] = useState<MealType>('breakfast');
  const [isExporting, setIsExporting] = useState(false);

  const availableClasses = useMemo(() => {
    if (filterClassId) {
      return classes.filter(c => c.id === filterClassId);
    }
    return classes;
  }, [classes, filterClassId]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (filterClassId) {
      result = result.filter((s) => s.classId === filterClassId);
    } else if (selectedClass !== 'all') {
      result = result.filter((s) => s.classId === selectedClass);
    }
    return result;
  }, [students, selectedClass, filterClassId]);

  const getAbsentSet = (mealType: MealType) => {
    return mealType === 'breakfast' ? breakfastAbsent :
           mealType === 'lunch' ? lunchAbsent : dinnerAbsent;
  };

  const setAbsentSet = (mealType: MealType, set: Set<string>) => {
    if (mealType === 'breakfast') setBreakfastAbsent(set);
    else if (mealType === 'lunch') setLunchAbsent(set);
    else setDinnerAbsent(set);
  };

  const toggleAbsent = (studentId: string, mealType: MealType) => {
    const current = getAbsentSet(mealType);
    const newSet = new Set(current);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setAbsentSet(mealType, newSet);
  };

  const markAllAbsent = (mealType: MealType) => {
    setAbsentSet(mealType, new Set(filteredStudents.map(s => s.id)));
  };

  const markAllPresent = (mealType: MealType) => {
    setAbsentSet(mealType, new Set());
  };

  const getAbsentStudents = (mealType: MealType) => {
    const absentSet = getAbsentSet(mealType);
    return filteredStudents.filter((s) => absentSet.has(s.id));
  };

  const getPresentCount = (mealType: MealType) => {
    return filteredStudents.length - getAbsentSet(mealType).size;
  };

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || classId;
  };

  const getMealLabel = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast': return 'Bữa sáng';
      case 'lunch': return 'Bữa trưa';
      case 'dinner': return 'Bữa tối';
    }
  };

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast': return <Coffee className="h-4 w-4" />;
      case 'lunch': return <Sun className="h-4 w-4" />;
      case 'dinner': return <Moon className="h-4 w-4" />;
    }
  };

  const isMealExpired = (mealType: MealType) => {
    if (isAdmin) return false;
    const now = new Date();
    const currentHour = now.getHours();
    if (mealType === 'breakfast') return currentHour >= 22;
    if (mealType === 'lunch') return currentHour >= 8;
    if (mealType === 'dinner') return currentHour >= 15;
    return false;
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
      const fileName = `baocao_bua${savedMealType}_${format(new Date(date), 'ddMMyyyy')}.png`;
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
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  const saveMealReport = async (mealType: MealType) => {
    const absentStudents = getAbsentStudents(mealType);
    const presentCount = getPresentCount(mealType);

    try {
      await createReport({
        date,
        type: 'meal',
        mealType,
        classId: selectedClass !== 'all' ? selectedClass : (filterClassId || undefined),
        totalStudents: filteredStudents.length,
        presentCount: presentCount,
        absentCount: absentStudents.length,
        absentStudents: absentStudents.map((s) => ({
          studentId: s.id,
          name: s.name,
          classId: s.classId,
          room: s.room,
          mealGroup: s.mealGroup,
          reason: reasons[`${mealType}_${s.id}`] || '',
          permission: permissions[`${mealType}_${s.id}`] || 'KP',
        })),
        notes,
        reporterId: currentUser.id,
        reporterName: currentUser.name,
      });

      setSavedMealType(mealType);
      setShowReportPreview(true);

      toast({
        title: 'Lưu báo cáo thành công',
        description: `Báo cáo ${getMealLabel(mealType)} ngày ${format(new Date(date), 'dd/MM/yyyy', { locale: vi })} đã được lưu`,
      });
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const resetForm = () => {
    setShowReportPreview(false);
  };

  const shareToZalo = () => {
    let message = `📋 BÁO CÁO BỮA ĂN\n`;
    message += `📅 Ngày: ${format(new Date(date), 'dd/MM/yyyy', { locale: vi })}\n`;
    message += `👤 Người báo cáo: ${currentUser.name}\n\n`;
    
    const meals: MealType[] = ['breakfast', 'lunch', 'dinner'];
    meals.forEach((meal) => {
      const presentCount = getPresentCount(meal);
      const absentList = getAbsentStudents(meal);
      message += `🍽️ ${getMealLabel(meal)}: ${presentCount}/${filteredStudents.length} (Vắng: ${absentList.length})\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://zalo.me/?text=${encodedMessage}`, '_blank');
  };

  const absentStudents = getAbsentStudents(savedMealType);

  // Report Preview
  if (showReportPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Báo cáo {getMealLabel(savedMealType)} đã lưu</h3>
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
              Tiếp tục
            </Button>
          </div>
        </div>

        <div ref={reportRef} className="bg-white p-4 sm:p-6 rounded-lg border" style={{ maxWidth: '800px' }}>
          <div className="text-center mb-4 pb-4 border-b">
            <h2 className="text-sm text-gray-600">{schoolInfo.name}</h2>
            <h1 className="text-lg font-bold text-primary mt-2">
              BÁO CÁO ĐIỂM DANH {getMealLabel(savedMealType).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Ngày {format(new Date(date), 'dd/MM/yyyy', { locale: vi })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{filteredStudents.length}</p>
              <p className="text-xs text-gray-500">Tổng số</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{getPresentCount(savedMealType)}</p>
              <p className="text-xs text-gray-500">Có mặt</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{absentStudents.length}</p>
              <p className="text-xs text-gray-500">Vắng</p>
            </div>
          </div>

          {absentStudents.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-gray-800">Danh sách vắng</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left w-12">STT</th>
                    <th className="border p-2 text-left">Họ tên</th>
                    <th className="border p-2 text-left w-20">Lớp</th>
                    <th className="border p-2 text-center w-16">Mâm</th>
                    <th className="border p-2 text-center w-16">Phép</th>
                  </tr>
                </thead>
                <tbody>
                  {absentStudents.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="border p-2 text-center">{idx + 1}</td>
                      <td className="border p-2">{s.name}</td>
                      <td className="border p-2">{getClassName(s.classId)}</td>
                      <td className="border p-2 text-center">{s.mealGroup}</td>
                      <td className="border p-2 text-center">{permissions[`${savedMealType}_${s.id}`] || 'KP'}</td>
                    </tr>
                  ))}
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
      {/* Compact Header */}
      <Card>
        <CardContent className="py-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Ngày</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

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

      {/* Meal Tabs */}
      <Tabs value={activeMeal} onValueChange={(v) => setActiveMeal(v as MealType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => {
            const absentCount = getAbsentSet(meal).size;
            const expired = isMealExpired(meal);
            return (
              <TabsTrigger 
                key={meal} 
                value={meal} 
                className={`py-2 text-xs sm:text-sm ${expired ? 'opacity-60' : ''}`}
              >
                {getMealIcon(meal)}
                <span className="ml-1">{getMealLabel(meal)}</span>
                {absentCount > 0 && (
                  <span className="ml-1 text-destructive">({absentCount})</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => {
          const absentSet = getAbsentSet(meal);
          const expired = isMealExpired(meal);
          const mealAbsentStudents = getAbsentStudents(meal);
          
          return (
            <TabsContent key={meal} value={meal} className="mt-3 space-y-3">
              {/* Quick actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => markAllPresent(meal)} 
                    disabled={expired}
                    className="h-8 text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Đủ tất cả
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => markAllAbsent(meal)} 
                    disabled={expired}
                    className="h-8 text-xs"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Vắng tất cả
                  </Button>
                </div>
                <span className={`text-sm font-medium ${absentSet.size > 0 ? 'text-destructive' : 'text-success'}`}>
                  {getPresentCount(meal)}/{filteredStudents.length}
                </span>
              </div>

              {/* Student grid - compact, names only */}
              <Card className={expired ? 'opacity-60' : ''}>
                <CardContent className="py-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-[300px] overflow-y-auto">
                    {filteredStudents.map((student) => {
                      const isAbsent = absentSet.has(student.id);
                      return (
                        <div
                          key={student.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                            expired ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'
                          } ${
                            isAbsent
                              ? 'bg-destructive/10 border-destructive/40'
                              : 'bg-muted/30 border-border hover:bg-muted/50'
                          }`}
                          onClick={() => !expired && toggleAbsent(student.id, meal)}
                        >
                          <Checkbox
                            checked={isAbsent}
                            onCheckedChange={() => !expired && toggleAbsent(student.id, meal)}
                            className="h-4 w-4"
                            disabled={expired}
                          />
                          <span className={`text-sm truncate ${isAbsent ? 'text-destructive font-medium' : ''}`}>
                            {student.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Absent detail - collapsible */}
              {mealAbsentStudents.length > 0 && (
                <Collapsible defaultOpen={false}>
                  <Card className="border-destructive/30">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-2 cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-destructive flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Chi tiết vắng ({mealAbsentStudents.length})
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-3 space-y-2">
                        {mealAbsentStudents.map((student) => {
                          const key = `${meal}_${student.id}`;
                          return (
                            <div key={student.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 text-sm">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{student.name}</span>
                                <span className="text-muted-foreground text-xs ml-2">
                                  {getClassName(student.classId)} • M.{student.mealGroup}
                                </span>
                              </div>
                              <Select
                                value={permissions[key] || 'KP'}
                                onValueChange={(value) => setPermissions({ ...permissions, [key]: value as 'P' | 'KP' })}
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
                                value={reasons[key] || ''}
                                onChange={(e) => setReasons({ ...reasons, [key]: e.target.value })}
                                className="w-24 sm:w-32 h-7 text-xs"
                              />
                            </div>
                          );
                        })}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Save button */}
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => saveMealReport(meal)} 
                  disabled={isCreatingReport || expired}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Lưu {getMealLabel(meal)}
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Overall summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="flex items-center gap-1">
                <Coffee className="h-3 w-3" />
                Sáng: <strong className={breakfastAbsent.size > 0 ? 'text-destructive' : ''}>{getPresentCount('breakfast')}/{filteredStudents.length}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Sun className="h-3 w-3" />
                Trưa: <strong className={lunchAbsent.size > 0 ? 'text-destructive' : ''}>{getPresentCount('lunch')}/{filteredStudents.length}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Moon className="h-3 w-3" />
                Tối: <strong className={dinnerAbsent.size > 0 ? 'text-destructive' : ''}>{getPresentCount('dinner')}/{filteredStudents.length}</strong>
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={shareToZalo}>
              <Share2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Zalo</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
