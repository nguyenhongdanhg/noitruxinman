import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DutySchedule } from '@/hooks/useDutySchedule';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TodayDutyCardProps {
  duties: DutySchedule[] | undefined;
  isLoading: boolean;
}

export function TodayDutyCard({ duties, isLoading }: TodayDutyCardProps) {
  const today = new Date();

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
            Lịch trực hôm nay
          </div>
          <div className="text-lg font-semibold mt-1">
            {format(today, "EEEE", { locale: vi })}
          </div>
          <div className="text-primary-foreground/80 text-sm">
            {format(today, "dd/MM/yyyy")}
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        {!duties || duties.length === 0 ? (
          <div className="flex items-center gap-3 text-muted-foreground py-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="text-sm italic">Không có ai trực hôm nay</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{duties.length} người trực</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {duties.map((duty, index) => (
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
