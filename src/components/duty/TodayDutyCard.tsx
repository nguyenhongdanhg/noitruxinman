import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DutySchedule } from '@/hooks/useDutySchedule';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TodayDutyCardProps {
  duties: DutySchedule[] | undefined;
  previousDayDuties?: DutySchedule[] | undefined;
  isLoading: boolean;
}

// Ca trực: 6h00 hôm nay đến 6h00 ngày mai
const SHIFT_START_HOUR = 6;

export function TodayDutyCard({ duties, previousDayDuties, isLoading }: TodayDutyCardProps) {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Xác định ca trực hiện tại dựa trên thời gian thực
  // Nếu trước 6h sáng -> hiện ca trực của ngày hôm qua
  // Nếu từ 6h sáng trở đi -> hiện ca trực của ngày hôm nay
  const isBeforeShiftChange = currentHour < SHIFT_START_HOUR;
  
  const currentShiftDate = useMemo(() => {
    if (isBeforeShiftChange) {
      return subDays(now, 1);
    }
    return now;
  }, [isBeforeShiftChange, now]);

  // Lấy danh sách ca trực đúng theo thời gian
  const currentDuties = useMemo(() => {
    if (isBeforeShiftChange && previousDayDuties) {
      return previousDayDuties;
    }
    return duties;
  }, [isBeforeShiftChange, previousDayDuties, duties]);

  // Tính thời gian kết thúc ca trực
  const shiftEndTime = useMemo(() => {
    const endDate = new Date(currentShiftDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(SHIFT_START_HOUR, 0, 0, 0);
    return endDate;
  }, [currentShiftDate]);

  // Tính thời gian còn lại của ca trực
  const remainingTime = useMemo(() => {
    const diff = shiftEndTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  }, [shiftEndTime, now]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
          <Skeleton className="h-5 w-32 bg-primary-foreground/20" />
          <Skeleton className="h-4 w-48 mt-2 bg-primary-foreground/20" />
        </div>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0);
    }
    return name.charAt(0).toUpperCase();
  };

  const avatarColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ];

  const dutyCount = currentDuties?.length || 0;
  const isFullShift = dutyCount >= 3;

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-4 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10">
          <Sparkles className="h-24 w-24 -mr-4 -mt-4" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary-foreground/90 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Ca trực hiện tại
          </div>
          <div className="text-lg font-semibold mt-1">
            {format(currentShiftDate, "EEEE", { locale: vi })}
          </div>
          <div className="text-primary-foreground/80 text-sm">
            {format(currentShiftDate, "dd/MM/yyyy")}
          </div>
        </div>
      </div>

      {/* Shift time info */}
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Ca trực: <strong className="text-foreground">6:00</strong> ngày {format(currentShiftDate, "dd/MM")} 
            {" → "}
            <strong className="text-foreground">6:00</strong> ngày {format(shiftEndTime, "dd/MM")}
          </span>
        </div>
        <div className="text-muted-foreground">
          Còn <strong className="text-foreground">{remainingTime.hours}h {remainingTime.minutes}p</strong>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {!currentDuties || currentDuties.length === 0 ? (
          <div className="flex items-center gap-3 text-muted-foreground py-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="text-sm italic">Không có ai trực ca này</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                  isFullShift 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}>
                  {dutyCount}/3 người trực
                </span>
              </div>
              {!isFullShift && (
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Thiếu {3 - dutyCount} người</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              {currentDuties.map((duty, index) => (
                <div 
                  key={duty.id} 
                  className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition-colors"
                >
                  <Avatar className={cn("h-8 w-8 text-white text-xs", avatarColors[index % avatarColors.length])}>
                    <AvatarFallback className={cn("text-white text-xs font-medium", avatarColors[index % avatarColors.length])}>
                      {getInitials(duty.teacher_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium leading-tight">{duty.teacher_name}</div>
                    {duty.notes && (
                      <div className="text-xs text-muted-foreground leading-tight">{duty.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
