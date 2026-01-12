import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsSummaryCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  date: string;
  total: number;
  present: number;
  absent: number;
  absentList: Array<{
    name: string;
    classId?: string;
    className?: string;
    mealGroup?: string;
    permission?: 'P' | 'KP';
    reason?: string;
  }>;
  isExpanded: boolean;
  onToggle: () => void;
  type?: 'study' | 'boarding' | 'meal';
  mealGroupStats?: Record<string, { total: number; absent: number }>;
  classStats?: Record<string, { total: number; absent: number }>;
  getClassName?: (classId: string) => string;
}

export function StatsSummaryCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  date,
  total,
  present,
  absent,
  absentList,
  isExpanded,
  onToggle,
  type,
  mealGroupStats,
  classStats,
  getClassName,
}: StatsSummaryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className={cn("flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0", iconBg)}>
              <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-semibold text-foreground truncate">{title}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {present}<span className="text-muted-foreground font-normal">/{total}</span>
              </p>
              {absent > 0 && (
                <p className="text-xs text-destructive font-medium">Vắng: {absent}</p>
              )}
            </div>
            {absent > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && absent > 0 && (
          <div className="mt-3 pt-3 border-t space-y-3">
            {/* Meal Group Stats for meal type */}
            {type === 'meal' && mealGroupStats && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(mealGroupStats).map(([group, stats]) => (
                  <div
                    key={group}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      stats.absent > 0 
                        ? "bg-destructive/10 text-destructive border border-destructive/30" 
                        : "bg-success/10 text-success border border-success/30"
                    )}
                  >
                    {group}: {stats.total - stats.absent}/{stats.total}
                    {stats.absent > 0 && ` (vắng ${stats.absent})`}
                  </div>
                ))}
              </div>
            )}

            {/* Class Stats */}
            {classStats && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(classStats).map(([classId, stats]) => (
                  <div
                    key={classId}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      stats.absent > 0 
                        ? "bg-destructive/10 text-destructive border border-destructive/30" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {getClassName ? getClassName(classId) : classId}: {stats.total - stats.absent}/{stats.total}
                    {stats.absent > 0 && ` (vắng ${stats.absent})`}
                  </div>
                ))}
              </div>
            )}
            
            {/* Absent Students List */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Học sinh vắng:</p>
              <div className="space-y-1">
                {absentList.map((student, idx) => (
                  <div 
                    key={idx} 
                    className="text-sm flex flex-wrap items-center gap-1 p-2 rounded bg-muted/50"
                  >
                    <span className="font-medium">{student.name}</span>
                    {student.className && (
                      <span className="text-xs text-muted-foreground">(Lớp: {student.className})</span>
                    )}
                    {student.mealGroup && (
                      <span className="text-xs text-muted-foreground">(Mâm: {student.mealGroup})</span>
                    )}
                    {student.permission && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium",
                        student.permission === 'P' 
                          ? "bg-success/10 text-success" 
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {student.permission === 'P' ? 'Có phép' : 'Không phép'}
                      </span>
                    )}
                    {student.reason && (
                      <span className="text-xs text-muted-foreground italic">- {student.reason}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
