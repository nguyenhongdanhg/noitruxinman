import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { classes } from '@/data/mockData';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Bell, CheckCircle2, AlertTriangle, Clock, Utensils,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';

interface MealDeadline {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  label: string;
  icon: string;
  deadlineHour: number;
  reportDate: string; // Ngày để kiểm tra báo cáo
  displayDate: string; // Ngày hiển thị cho người dùng
  isForTomorrow: boolean;
}

export function MealReportReminder() {
  const { profile, hasRole } = useAuth();
  const { reports } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Cập nhật thời gian mỗi phút
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isClassTeacher = hasRole('class_teacher');
  const teacherClassId = profile?.class_id;
  const teacherClassName = teacherClassId 
    ? classes.find(c => c.id === teacherClassId)?.name 
    : null;

  // Nếu không phải giáo viên chủ nhiệm, không hiển thị
  if (!isClassTeacher || !teacherClassId) {
    return null;
  }

  const today = format(currentTime, 'yyyy-MM-dd');
  const tomorrow = format(addDays(currentTime, 1), 'yyyy-MM-dd');
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Định nghĩa các deadline
  const mealDeadlines: MealDeadline[] = [
    {
      mealType: 'breakfast',
      label: 'Bữa sáng',
      icon: '🌅',
      deadlineHour: 22,
      reportDate: today, // Báo cáo hôm nay cho bữa sáng ngày mai
      displayDate: format(addDays(currentTime, 1), 'dd/MM'),
      isForTomorrow: true,
    },
    {
      mealType: 'lunch',
      label: 'Bữa trưa',
      icon: '☀️',
      deadlineHour: 8,
      reportDate: today,
      displayDate: format(currentTime, 'dd/MM'),
      isForTomorrow: false,
    },
    {
      mealType: 'dinner',
      label: 'Bữa tối',
      icon: '🌙',
      deadlineHour: 15,
      reportDate: today,
      displayDate: format(currentTime, 'dd/MM'),
      isForTomorrow: false,
    },
  ];

  // Kiểm tra trạng thái báo cáo của từng bữa
  const mealStatus = useMemo(() => {
    return mealDeadlines.map(meal => {
      // Tìm báo cáo cho bữa ăn này từ lớp của giáo viên
      const hasReported = reports.some(r => 
        r.type === 'meal' && 
        r.mealType === meal.mealType && 
        r.date === meal.reportDate &&
        r.absentStudents.some(a => a.classId === teacherClassId)
      );

      // Kiểm tra đã hết hạn chưa
      const isExpired = currentHour >= meal.deadlineHour;
      
      // Kiểm tra có gần hết hạn không (còn 1 tiếng)
      const minutesUntilDeadline = (meal.deadlineHour - currentHour) * 60 - currentMinute;
      const isNearDeadline = !isExpired && minutesUntilDeadline <= 60 && minutesUntilDeadline > 0;
      
      // Thời gian còn lại
      const timeRemaining = isExpired ? null : {
        hours: Math.floor(minutesUntilDeadline / 60),
        minutes: minutesUntilDeadline % 60,
      };

      return {
        ...meal,
        hasReported,
        isExpired,
        isNearDeadline,
        timeRemaining,
        canReport: !isExpired,
      };
    });
  }, [reports, teacherClassId, currentHour, currentMinute]);

  // Đếm số bữa cần nhắc nhở
  const pendingCount = mealStatus.filter(m => !m.hasReported && !m.isExpired).length;
  const nearDeadlineCount = mealStatus.filter(m => m.isNearDeadline && !m.hasReported).length;

  const goToMealReport = () => {
    navigate('/meals');
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "border-2 transition-colors",
        nearDeadlineCount > 0 ? "border-amber-400 bg-amber-50/50" : 
        pendingCount > 0 ? "border-blue-200 bg-blue-50/30" : 
        "border-green-200 bg-green-50/30"
      )}>
        <CollapsibleTrigger asChild>
          <CardContent className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {nearDeadlineCount > 0 ? (
                  <Bell className="h-5 w-5 text-amber-500 animate-pulse" />
                ) : pendingCount > 0 ? (
                  <Clock className="h-5 w-5 text-blue-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                <div>
                  <span className="font-medium text-sm">
                    Báo cáo bữa ăn - Lớp {teacherClassName}
                  </span>
                  {nearDeadlineCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs animate-pulse">
                      Sắp hết hạn!
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 ? (
                  <Badge variant="secondary">{pendingCount} bữa chưa báo</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">Đã báo đủ</Badge>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {mealStatus.map(meal => (
                <div
                  key={meal.mealType}
                  className={cn(
                    "p-3 rounded-lg border",
                    meal.hasReported ? "bg-green-50 border-green-200" :
                    meal.isExpired ? "bg-muted border-muted-foreground/20" :
                    meal.isNearDeadline ? "bg-amber-50 border-amber-300" :
                    "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm flex items-center gap-1.5">
                      <span>{meal.icon}</span>
                      {meal.label}
                    </span>
                    {meal.hasReported ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : meal.isExpired ? (
                      <span className="text-xs text-muted-foreground">Hết hạn</span>
                    ) : meal.isNearDeadline ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">
                      {meal.isForTomorrow ? `Cho ngày ${meal.displayDate}` : `Ngày ${meal.displayDate}`}
                    </p>
                    
                    {meal.hasReported ? (
                      <p className="text-green-600 font-medium">✓ Đã báo cáo</p>
                    ) : meal.isExpired ? (
                      <p className="text-destructive">✗ Chưa báo (đã hết hạn)</p>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          Hạn: trước {meal.deadlineHour}:00
                        </p>
                        {meal.timeRemaining && (
                          <p className={cn(
                            "font-medium",
                            meal.isNearDeadline ? "text-amber-600" : "text-blue-600"
                          )}>
                            Còn {meal.timeRemaining.hours > 0 ? `${meal.timeRemaining.hours}h ` : ''}{meal.timeRemaining.minutes}p
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pendingCount > 0 && (
              <Button onClick={goToMealReport} className="w-full gap-2" size="sm">
                <Utensils className="h-4 w-4" />
                Đi đến báo cáo bữa ăn
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              * Bữa sáng được báo trước 22:00 ngày hôm trước
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
