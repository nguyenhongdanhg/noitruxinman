import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DutySchedule } from '@/hooks/useDutySchedule';
import { Skeleton } from '@/components/ui/skeleton';

interface TodayDutyCardProps {
  duties: DutySchedule[] | undefined;
  isLoading: boolean;
}

export function TodayDutyCard({ duties, isLoading }: TodayDutyCardProps) {
  const today = new Date();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Lịch trực hôm nay
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-2">
          {format(today, "EEEE, 'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi })}
        </div>
        
        {!duties || duties.length === 0 ? (
          <div className="text-muted-foreground italic">
            Không có ai trực hôm nay
          </div>
        ) : (
          <div className="space-y-2">
            {duties.map((duty) => (
              <div key={duty.id} className="flex items-center gap-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {duty.teacher_name}
                </Badge>
                {duty.notes && (
                  <span className="text-sm text-muted-foreground">
                    - {duty.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
