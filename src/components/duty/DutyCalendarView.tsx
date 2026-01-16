import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DutySchedule } from '@/hooks/useDutySchedule';
import { cn } from '@/lib/utils';

interface DutyCalendarViewProps {
  selectedMonth: Date;
  duties: DutySchedule[];
  onDayClick?: (date: Date, duties: DutySchedule[]) => void;
}

export function DutyCalendarView({ selectedMonth, duties, onDayClick }: DutyCalendarViewProps) {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate padding days for the first week
  const firstDayOfWeek = getDay(monthStart);
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0

  const getDutiesForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return duties.filter(d => d.duty_date === dateStr);
  };

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="bg-card rounded-lg border">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              'p-2 text-center text-sm font-medium',
              index === 6 && 'text-destructive' // Sunday
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Padding cells */}
        {Array.from({ length: paddingDays }).map((_, index) => (
          <div key={`pad-${index}`} className="p-2 min-h-[80px] border-b border-r bg-muted/30" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dayDuties = getDutiesForDay(day);
          const isSunday = getDay(day) === 0;
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'p-2 min-h-[80px] border-b border-r cursor-pointer hover:bg-accent/50 transition-colors',
                isSunday && 'bg-destructive/5',
                isCurrentDay && 'bg-primary/10 ring-2 ring-primary ring-inset'
              )}
              onClick={() => onDayClick?.(day, dayDuties)}
            >
              <div className={cn(
                'text-sm font-medium mb-1',
                isSunday && 'text-destructive',
                isCurrentDay && 'text-primary font-bold'
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayDuties.slice(0, 2).map((duty) => (
                  <div
                    key={duty.id}
                    className="text-xs bg-primary/10 text-primary rounded px-1 py-0.5 truncate"
                    title={duty.teacher_name}
                  >
                    {duty.teacher_name}
                  </div>
                ))}
                {dayDuties.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayDuties.length - 2} người khác
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
