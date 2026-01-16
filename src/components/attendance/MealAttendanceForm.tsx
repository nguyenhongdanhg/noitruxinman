import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { Calendar, CheckCircle2, XCircle, Share2, Save, Users, Utensils } from 'lucide-react';

interface MealAttendanceFormProps {
  filterClassId?: string;
}

type MealType = 'breakfast' | 'lunch' | 'dinner';

export function MealAttendanceForm({ filterClassId }: MealAttendanceFormProps) {
  const { students, classes, currentUser, createReport, isCreatingReport } = useApp();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  
  const isAdmin = hasRole('admin');
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState<string>(filterClassId || 'all');
  const [notes, setNotes] = useState('');
  
  // Absent students per meal - mặc định đủ, chỉ chọn học sinh vắng
  const [breakfastAbsent, setBreakfastAbsent] = useState<Set<string>>(new Set());
  const [lunchAbsent, setLunchAbsent] = useState<Set<string>>(new Set());
  const [dinnerAbsent, setDinnerAbsent] = useState<Set<string>>(new Set());
  
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [permissions, setPermissions] = useState<Record<string, 'P' | 'KP'>>({});
  
  // Active meal tab for viewing absent list
  const [activeMeal, setActiveMeal] = useState<MealType>('breakfast');

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

  // Đánh dấu tất cả vắng theo bữa
  const markAllAbsentBreakfast = () => setBreakfastAbsent(new Set(filteredStudents.map((s) => s.id)));
  const markAllPresentBreakfast = () => setBreakfastAbsent(new Set());
  
  const markAllAbsentLunch = () => setLunchAbsent(new Set(filteredStudents.map((s) => s.id)));
  const markAllPresentLunch = () => setLunchAbsent(new Set());
  
  const markAllAbsentDinner = () => setDinnerAbsent(new Set(filteredStudents.map((s) => s.id)));
  const markAllPresentDinner = () => setDinnerAbsent(new Set());

  // Đánh dấu tất cả vắng cả 3 bữa
  const markAllAbsentAllMeals = () => {
    const allIds = new Set(filteredStudents.map((s) => s.id));
    setBreakfastAbsent(allIds);
    setLunchAbsent(new Set(allIds));
    setDinnerAbsent(new Set(allIds));
  };

  // Đánh dấu tất cả đủ cả 3 bữa
  const markAllPresentAllMeals = () => {
    setBreakfastAbsent(new Set());
    setLunchAbsent(new Set());
    setDinnerAbsent(new Set());
  };

  // Toggle học sinh vắng theo bữa
  const toggleAbsent = (studentId: string, mealType: MealType) => {
    const setter = mealType === 'breakfast' ? setBreakfastAbsent : 
                   mealType === 'lunch' ? setLunchAbsent : setDinnerAbsent;
    const current = mealType === 'breakfast' ? breakfastAbsent :
                    mealType === 'lunch' ? lunchAbsent : dinnerAbsent;
    
    const newSet = new Set(current);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setter(newSet);
  };

  // Lấy danh sách học sinh vắng theo bữa
  const getAbsentStudents = (mealType: MealType) => {
    const absentSet = mealType === 'breakfast' ? breakfastAbsent :
                       mealType === 'lunch' ? lunchAbsent : dinnerAbsent;
    return filteredStudents.filter((s) => absentSet.has(s.id));
  };

  // Lấy số học sinh có mặt theo bữa
  const getPresentCount = (mealType: MealType) => {
    const absentSet = mealType === 'breakfast' ? breakfastAbsent :
                       mealType === 'lunch' ? lunchAbsent : dinnerAbsent;
    return filteredStudents.length - absentSet.size;
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

  // Kiểm tra hết hạn - admin luôn được phép
  const isMealExpired = (mealType: MealType) => {
    if (isAdmin) return false; // Admin không bị giới hạn
    
    const now = new Date();
    const currentHour = now.getHours();

    if (mealType === 'breakfast') {
      return currentHour >= 22;
    } else if (mealType === 'lunch') {
      return currentHour >= 8;
    } else if (mealType === 'dinner') {
      return currentHour >= 15;
    }
    return false;
  };

  const canSubmit = (mealType: MealType) => {
    return !isMealExpired(mealType);
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

      toast({
        title: 'Lưu báo cáo thành công',
        description: `Báo cáo ${getMealLabel(mealType)} ngày ${format(new Date(date), 'dd/MM/yyyy', { locale: vi })} đã được lưu`,
      });
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const saveAllReports = async () => {
    const meals: MealType[] = ['breakfast', 'lunch', 'dinner'];
    for (const meal of meals) {
      await saveMealReport(meal);
    }
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

  const activeAbsentStudents = getAbsentStudents(activeMeal);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Form Header */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Thông tin đăng ký bữa ăn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 sm:mb-2.5 block">Ngày</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 sm:h-10 text-base sm:text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 sm:mb-2.5 block">Lớp</label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
                disabled={!!filterClassId}
              >
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {!filterClassId && <SelectItem value="all" className="py-3 sm:py-2">Tất cả lớp</SelectItem>}
                  {availableClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="py-3 sm:py-2">
                      Lớp {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 sm:mb-2.5 block">Ghi chú</label>
            <Textarea
              placeholder="Nhập ghi chú nếu có..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-base sm:text-sm min-h-[80px] sm:min-h-[60px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Utensils className="h-5 w-5 text-primary" />
            Thao tác nhanh
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            Mặc định tất cả đủ cơm. Nhấn vào học sinh để đánh dấu vắng bữa.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" size="default" onClick={markAllPresentAllMeals} className="gap-2 h-11 sm:h-9 text-sm flex-1 sm:flex-initial">
              <CheckCircle2 className="h-4 w-4" />
              Đủ tất cả 3 bữa
            </Button>
            <Button variant="outline" size="default" onClick={markAllAbsentAllMeals} className="gap-2 h-11 sm:h-9 text-sm flex-1 sm:flex-initial">
              <XCircle className="h-4 w-4" />
              Vắng tất cả 3 bữa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Three Meal Columns - Click để đánh dấu vắng */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
          const absentSet = mealType === 'breakfast' ? breakfastAbsent :
                             mealType === 'lunch' ? lunchAbsent : dinnerAbsent;
          const absentCount = absentSet.size;
          const presentCount = filteredStudents.length - absentCount;
          const expired = isMealExpired(mealType);
          
          return (
            <Card key={mealType} className={expired ? 'opacity-60' : ''}>
              <CardHeader className="pb-3 sm:pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{getMealLabel(mealType)}</CardTitle>
                    {expired && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                        Hết hạn
                      </span>
                    )}
                  </div>
                  <span className={`text-base sm:text-sm font-semibold ${absentCount > 0 ? 'text-destructive' : 'text-success'}`}>
                    {presentCount}/{filteredStudents.length}
                  </span>
                </div>
                <div className="flex gap-2 mt-3 sm:mt-2">
                  <Button 
                    variant="outline" 
                    size="default" 
                    onClick={mealType === 'breakfast' ? markAllPresentBreakfast : 
                             mealType === 'lunch' ? markAllPresentLunch : markAllPresentDinner}
                    className="flex-1 text-sm h-10 sm:h-8"
                    disabled={expired}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Đủ
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default" 
                    onClick={mealType === 'breakfast' ? markAllAbsentBreakfast :
                             mealType === 'lunch' ? markAllAbsentLunch : markAllAbsentDinner}
                    className="flex-1 text-sm h-10 sm:h-8"
                    disabled={expired}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Vắng
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[400px] overflow-y-auto space-y-2 sm:space-y-1.5">
                  {filteredStudents.map((student) => {
                    const isAbsent = absentSet.has(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 sm:gap-2 p-3.5 sm:p-2.5 rounded-xl sm:rounded-lg border-2 sm:border transition-all ${
                          expired 
                            ? 'cursor-not-allowed' 
                            : 'cursor-pointer active:scale-[0.98]'
                        } ${
                          isAbsent
                            ? 'bg-destructive/10 border-destructive/40 sm:border-destructive/30'
                            : 'bg-success/5 border-success/30 sm:border-success/20'
                        }`}
                        onClick={() => !expired && toggleAbsent(student.id, mealType)}
                      >
                        <Checkbox
                          checked={isAbsent}
                          onCheckedChange={() => !expired && toggleAbsent(student.id, mealType)}
                          className="h-5 w-5 sm:h-4 sm:w-4"
                          disabled={expired}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-base sm:text-sm">{student.name}</p>
                          <p className="text-sm sm:text-xs text-muted-foreground truncate mt-0.5">
                            {getClassName(student.classId)} • M.{student.mealGroup}
                          </p>
                        </div>
                        {isAbsent ? (
                          <XCircle className="h-5 w-5 sm:h-4 sm:w-4 text-destructive flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Absent Students Detail */}
      {activeAbsentStudents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-destructive text-base">
                <XCircle className="h-5 w-5" />
                Chi tiết vắng - {getMealLabel(activeMeal)}
              </CardTitle>
              <div className="flex gap-1">
                {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => (
                  <Button
                    key={meal}
                    variant={activeMeal === meal ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveMeal(meal)}
                    className="text-xs"
                  >
                    {getMealLabel(meal)} ({getAbsentStudents(meal).length})
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {activeAbsentStudents.map((student) => {
                const key = `${activeMeal}_${student.id}`;
                return (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getClassName(student.classId)} • P.{student.room} • M.{student.mealGroup}
                      </p>
                    </div>
                    <Select
                      value={permissions[key] || 'KP'}
                      onValueChange={(value) => setPermissions({ ...permissions, [key]: value as 'P' | 'KP' })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="KP">KP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-32"
                      placeholder="Lý do..."
                      value={reasons[key] || ''}
                      onChange={(e) => setReasons({ ...reasons, [key]: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary & Actions */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-4">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center p-2 sm:p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{filteredStudents.length - breakfastAbsent.size}/{filteredStudents.length}</p>
                <p className="text-xs text-muted-foreground">Bữa sáng</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <p className="text-lg sm:text-2xl font-bold text-green-600">{filteredStudents.length - lunchAbsent.size}/{filteredStudents.length}</p>
                <p className="text-xs text-muted-foreground">Bữa trưa</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{filteredStudents.length - dinnerAbsent.size}/{filteredStudents.length}</p>
                <p className="text-xs text-muted-foreground">Bữa tối</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <Button
                onClick={saveAllReports}
                disabled={isCreatingReport}
                className="gap-2 gradient-primary w-full sm:w-auto"
              >
                <Save className="h-4 w-4" />
                {isCreatingReport ? 'Đang lưu...' : 'Lưu tất cả báo cáo'}
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

          <div className="mt-4 text-xs sm:text-sm text-muted-foreground">
            Người báo cáo: <span className="font-medium text-foreground">{currentUser.name}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
