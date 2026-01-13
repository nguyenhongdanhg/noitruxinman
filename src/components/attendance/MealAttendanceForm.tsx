import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
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
  const { toast } = useToast();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState<string>(filterClassId || 'all');
  const [notes, setNotes] = useState('');
  
  // Separate state for each meal type
  const [breakfastStudents, setBreakfastStudents] = useState<Set<string>>(new Set());
  const [lunchStudents, setLunchStudents] = useState<Set<string>>(new Set());
  const [dinnerStudents, setDinnerStudents] = useState<Set<string>>(new Set());
  
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

  // Select/Deselect all for each meal
  const selectAllBreakfast = () => {
    setBreakfastStudents(new Set(filteredStudents.map((s) => s.id)));
  };
  const deselectAllBreakfast = () => setBreakfastStudents(new Set());
  
  const selectAllLunch = () => {
    setLunchStudents(new Set(filteredStudents.map((s) => s.id)));
  };
  const deselectAllLunch = () => setLunchStudents(new Set());
  
  const selectAllDinner = () => {
    setDinnerStudents(new Set(filteredStudents.map((s) => s.id)));
  };
  const deselectAllDinner = () => setDinnerStudents(new Set());

  // Select/Deselect all three meals
  const selectAllMeals = () => {
    const allIds = new Set(filteredStudents.map((s) => s.id));
    setBreakfastStudents(allIds);
    setLunchStudents(new Set(allIds));
    setDinnerStudents(new Set(allIds));
  };

  const deselectAllMeals = () => {
    setBreakfastStudents(new Set());
    setLunchStudents(new Set());
    setDinnerStudents(new Set());
  };

  const toggleStudent = (studentId: string, mealType: MealType) => {
    const setter = mealType === 'breakfast' ? setBreakfastStudents : 
                   mealType === 'lunch' ? setLunchStudents : setDinnerStudents;
    const current = mealType === 'breakfast' ? breakfastStudents :
                    mealType === 'lunch' ? lunchStudents : dinnerStudents;
    
    const newSet = new Set(current);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setter(newSet);
  };

  const getAbsentStudents = (mealType: MealType) => {
    const presentSet = mealType === 'breakfast' ? breakfastStudents :
                       mealType === 'lunch' ? lunchStudents : dinnerStudents;
    return filteredStudents.filter((s) => !presentSet.has(s.id));
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

  const canSubmit = (mealType: MealType) => {
    const now = new Date();
    const currentHour = now.getHours();

    if (mealType === 'breakfast') {
      if (currentHour >= 22) return false;
    } else if (mealType === 'lunch') {
      if (currentHour >= 8) return false;
    } else if (mealType === 'dinner') {
      if (currentHour >= 15) return false;
    }
    return true;
  };

  const saveMealReport = async (mealType: MealType) => {
    const presentSet = mealType === 'breakfast' ? breakfastStudents :
                       mealType === 'lunch' ? lunchStudents : dinnerStudents;
    const absentStudents = getAbsentStudents(mealType);

    try {
      await createReport({
        date,
        type: 'meal',
        mealType,
        classId: selectedClass !== 'all' ? selectedClass : (filterClassId || undefined),
        totalStudents: filteredStudents.length,
        presentCount: presentSet.size,
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
      const presentSet = meal === 'breakfast' ? breakfastStudents :
                         meal === 'lunch' ? lunchStudents : dinnerStudents;
      const absentList = getAbsentStudents(meal);
      message += `🍽️ ${getMealLabel(meal)}: ${presentSet.size}/${filteredStudents.length} (Vắng: ${absentList.length})\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://zalo.me/?text=${encodedMessage}`, '_blank');
  };

  const activeAbsentStudents = getAbsentStudents(activeMeal);

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Thông tin đăng ký bữa ăn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Ngày</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

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

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Ghi chú</label>
            <Textarea
              placeholder="Nhập ghi chú nếu có..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Select/Deselect all meals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Utensils className="h-5 w-5 text-primary" />
            Thao tác nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="sm" onClick={selectAllMeals} className="gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Chọn tất cả 3 bữa
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllMeals} className="gap-1">
              <XCircle className="h-4 w-4" />
              Bỏ chọn tất cả 3 bữa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Three Meal Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
          const presentSet = mealType === 'breakfast' ? breakfastStudents :
                             mealType === 'lunch' ? lunchStudents : dinnerStudents;
          const absentCount = filteredStudents.length - presentSet.size;
          
          return (
            <Card key={mealType}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{getMealLabel(mealType)}</CardTitle>
                  <span className={`text-sm font-medium ${absentCount > 0 ? 'text-destructive' : 'text-success'}`}>
                    {presentSet.size}/{filteredStudents.length}
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={mealType === 'breakfast' ? selectAllBreakfast : 
                             mealType === 'lunch' ? selectAllLunch : selectAllDinner}
                    className="flex-1 text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Chọn
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={mealType === 'breakfast' ? deselectAllBreakfast :
                             mealType === 'lunch' ? deselectAllLunch : deselectAllDinner}
                    className="flex-1 text-xs"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Bỏ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[400px] overflow-y-auto space-y-1">
                  {filteredStudents.map((student) => {
                    const isPresent = presentSet.has(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer text-sm ${
                          isPresent
                            ? 'bg-success/10 border-success/30'
                            : 'bg-destructive/5 border-destructive/20'
                        }`}
                        onClick={() => toggleStudent(student.id, mealType)}
                      >
                        <Checkbox
                          checked={isPresent}
                          onCheckedChange={() => toggleStudent(student.id, mealType)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{student.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getClassName(student.classId)} • M.{student.mealGroup}
                          </p>
                        </div>
                        {isPresent ? (
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
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
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{breakfastStudents.size}/{filteredStudents.length}</p>
                <p className="text-xs text-muted-foreground">Bữa sáng</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <p className="text-lg sm:text-2xl font-bold text-green-600">{lunchStudents.size}/{filteredStudents.length}</p>
                <p className="text-xs text-muted-foreground">Bữa trưa</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{dinnerStudents.size}/{filteredStudents.length}</p>
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
