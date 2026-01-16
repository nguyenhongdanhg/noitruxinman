import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Save, Loader2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDutySchedule, DutySchedule } from '@/hooks/useDutySchedule';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, getDaysInMonth, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DutyScheduleManagerProps {
  selectedMonth: Date;
  onSaveComplete?: () => void;
}

interface UserProfile {
  id: string;
  full_name: string;
}

export function DutyScheduleManager({ selectedMonth, onSaveComplete }: DutyScheduleManagerProps) {
  const { toast } = useToast();
  const { bulkAddDuty, isBulkAdding, useDutyByMonth } = useDutySchedule();
  
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth() + 1;
  const daysInMonth = getDaysInMonth(selectedMonth);
  
  // Fetch existing duties for this month
  const { data: existingDuties = [] } = useDutyByMonth(year, month);
  
  // Fetch all users from profiles
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['profiles-for-duty'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Build initial selections from existing duties
  const initialSelections = useMemo(() => {
    const selections: Record<string, Set<number>> = {};
    users.forEach(user => {
      selections[user.full_name] = new Set();
    });
    existingDuties.forEach(duty => {
      const day = parseInt(duty.duty_date.split('-')[2], 10);
      if (!selections[duty.teacher_name]) {
        selections[duty.teacher_name] = new Set();
      }
      selections[duty.teacher_name].add(day);
    });
    return selections;
  }, [users, existingDuties]);

  const [selections, setSelections] = useState<Record<string, Set<number>>>(initialSelections);
  
  // Update selections when initial data changes
  React.useEffect(() => {
    setSelections(initialSelections);
  }, [initialSelections]);

  // Generate day headers
  const dayHeaders = useMemo(() => {
    const headers: { day: number; isSunday: boolean; label: string }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = getDay(date);
      const isSunday = dayOfWeek === 0;
      headers.push({
        day,
        isSunday,
        label: format(date, 'EEEEEE', { locale: vi }),
      });
    }
    return headers;
  }, [year, month, daysInMonth]);

  const toggleSelection = (teacherName: string, day: number) => {
    setSelections(prev => {
      const userSelections = new Set(prev[teacherName] || []);
      if (userSelections.has(day)) {
        userSelections.delete(day);
      } else {
        userSelections.add(day);
      }
      return { ...prev, [teacherName]: userSelections };
    });
  };

  const handleSave = async () => {
    try {
      const duties: { teacher_name: string; duty_date: string }[] = [];
      
      Object.entries(selections).forEach(([teacherName, days]) => {
        days.forEach(day => {
          const dutyDate = format(new Date(year, month - 1, day), 'yyyy-MM-dd');
          duties.push({
            teacher_name: teacherName,
            duty_date: dutyDate,
          });
        });
      });

      await bulkAddDuty(duties);

      toast({
        title: 'Đã lưu lịch trực',
        description: `Đã lưu ${duties.length} lượt trực cho tháng ${month}/${year}`,
      });

      onSaveComplete?.();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Lỗi lưu lịch trực',
        description: 'Không thể lưu lịch trực. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    // Create header row
    const headers = ['STT', 'Họ và tên'];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isSunday = getDay(date) === 0;
      headers.push(isSunday ? `${day} (CN)` : `${day}`);
    }

    // Create data rows
    const rows: string[] = [];
    
    // Title row
    rows.push(`Lịch trực tháng ${month}/${year}`);
    rows.push('');
    
    // Header row
    rows.push(headers.join(','));
    
    // Day of week row
    const dayLabels = ['', ''];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isSunday = getDay(date) === 0;
      dayLabels.push(isSunday ? 'CN' : format(date, 'EEEEEE', { locale: vi }));
    }
    rows.push(dayLabels.join(','));

    // Teacher rows
    let stt = 1;
    users.forEach(user => {
      const userDays = selections[user.full_name] || new Set();
      const row = [stt.toString(), user.full_name];
      for (let day = 1; day <= daysInMonth; day++) {
        row.push(userDays.has(day) ? 'x' : '');
      }
      rows.push(row.join(','));
      stt++;
    });

    // Also include any non-user teachers from existing duties
    const userNames = new Set(users.map(u => u.full_name));
    Object.entries(selections).forEach(([teacherName, days]) => {
      if (!userNames.has(teacherName) && days.size > 0) {
        const row = [stt.toString(), teacherName];
        for (let day = 1; day <= daysInMonth; day++) {
          row.push(days.has(day) ? 'x' : '');
        }
        rows.push(row.join(','));
        stt++;
      }
    });

    const BOM = '\uFEFF';
    const csvContent = BOM + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lich_truc_thang_${month}_${year}.csv`;
    link.click();

    toast({
      title: 'Đã xuất lịch trực',
      description: 'File lịch trực đã được tải về',
    });
  };

  // Get total duty count per user
  const getDutyCount = (teacherName: string) => {
    return selections[teacherName]?.size || 0;
  };

  // Calculate warnings
  const warnings = useMemo(() => {
    const result: {
      noAssignment: string[];
      tooMany: string[];
      lowStaffDays: number[];
    } = {
      noAssignment: [],
      tooMany: [],
      lowStaffDays: [],
    };

    // Check users with no assignment or too many
    users.forEach(user => {
      const count = selections[user.full_name]?.size || 0;
      if (count === 0) {
        result.noAssignment.push(user.full_name);
      } else if (count > 5) {
        result.tooMany.push(user.full_name);
      }
    });

    // Check days with less than 3 people
    for (let day = 1; day <= daysInMonth; day++) {
      let staffCount = 0;
      Object.values(selections).forEach(days => {
        if (days.has(day)) staffCount++;
      });
      if (staffCount > 0 && staffCount < 3) {
        result.lowStaffDays.push(day);
      }
    }

    return result;
  }, [selections, users, daysInMonth]);

  // Count staff per day for display
  const getStaffCountForDay = (day: number) => {
    let count = 0;
    Object.values(selections).forEach(days => {
      if (days.has(day)) count++;
    });
    return count;
  };

  if (isLoadingUsers) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Đang tải danh sách...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-base">
            Phân công lịch trực tháng {month}/{year}
          </CardTitle>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isBulkAdding}>
              {isBulkAdding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu lịch trực
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Warnings */}
        {(warnings.noAssignment.length > 0 || warnings.tooMany.length > 0 || warnings.lowStaffDays.length > 0) && (
          <div className="space-y-2">
            {warnings.noAssignment.length > 0 && (
              <Alert variant="default" className="py-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Chưa phân công:</strong> {warnings.noAssignment.slice(0, 5).join(', ')}
                  {warnings.noAssignment.length > 5 && ` và ${warnings.noAssignment.length - 5} người khác`}
                </AlertDescription>
              </Alert>
            )}
            {warnings.tooMany.length > 0 && (
              <Alert variant="default" className="py-2 border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-xs text-orange-700 dark:text-orange-400">
                  <strong>Trực quá 5 lần:</strong> {warnings.tooMany.join(', ')}
                </AlertDescription>
              </Alert>
            )}
            {warnings.lowStaffDays.length > 0 && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Thiếu người (cần ít nhất 3):</strong> Ngày {warnings.lowStaffDays.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <ScrollArea className="w-full">
          <div className="min-w-max">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-1 py-1 text-left font-medium sticky left-0 bg-muted/50 z-10 w-8">#</th>
                  <th className="px-1 py-1 text-left font-medium sticky left-8 bg-muted/50 z-10 min-w-[100px] max-w-[120px]">Họ tên</th>
                  <th className="px-1 py-1 text-center font-medium w-7">SL</th>
                  {dayHeaders.map(({ day, isSunday }) => (
                    <th
                      key={day}
                      className={cn(
                        "px-0.5 py-1 text-center font-medium w-6",
                        isSunday && "text-destructive bg-destructive/10"
                      )}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
                <tr className="border-b text-[10px] text-muted-foreground">
                  <td className="sticky left-0 bg-background"></td>
                  <td className="sticky left-8 bg-background"></td>
                  <td></td>
                  {dayHeaders.map(({ day, isSunday, label }) => (
                    <td
                      key={day}
                      className={cn(
                        "px-0.5 text-center",
                        isSunday && "text-destructive bg-destructive/10"
                      )}
                    >
                      {label}
                    </td>
                  ))}
                </tr>
                {/* Staff count row */}
                <tr className="border-b bg-muted/30 text-[10px]">
                  <td className="sticky left-0 bg-muted/30"></td>
                  <td className="sticky left-8 bg-muted/30 px-1 font-medium text-muted-foreground">Số người</td>
                  <td></td>
                  {dayHeaders.map(({ day, isSunday }) => {
                    const staffCount = getStaffCountForDay(day);
                    const isLow = staffCount > 0 && staffCount < 3;
                    return (
                      <td
                        key={day}
                        className={cn(
                          "px-0.5 text-center font-medium",
                          isSunday && "bg-destructive/5",
                          isLow && "text-destructive",
                          staffCount >= 3 && "text-green-600"
                        )}
                      >
                        {staffCount > 0 && staffCount}
                      </td>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const dutyCount = getDutyCount(user.full_name);
                  const hasNoAssignment = dutyCount === 0;
                  const hasTooMany = dutyCount > 5;
                  return (
                    <tr 
                      key={user.id} 
                      className={cn(
                        "border-b hover:bg-muted/30",
                        hasNoAssignment && "bg-amber-50/50 dark:bg-amber-950/10",
                        hasTooMany && "bg-orange-50/50 dark:bg-orange-950/10"
                      )}
                    >
                      <td className="px-1 py-0.5 text-center sticky left-0 bg-inherit z-10 text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-1 py-0.5 sticky left-8 bg-inherit z-10 truncate max-w-[120px]" title={user.full_name}>
                        {user.full_name}
                      </td>
                      <td className="px-1 py-0.5 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center h-4 min-w-[16px] px-0.5 rounded text-[10px] font-medium",
                          dutyCount === 0 && "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
                          dutyCount > 0 && dutyCount <= 5 && "bg-primary/10 text-primary",
                          dutyCount > 5 && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                        )}>
                          {dutyCount}
                        </span>
                      </td>
                      {dayHeaders.map(({ day, isSunday }) => {
                        const isChecked = selections[user.full_name]?.has(day) || false;
                        return (
                          <td
                            key={day}
                            className={cn(
                              "px-0.5 py-0.5 text-center",
                              isSunday && "bg-destructive/5"
                            )}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleSelection(user.full_name, day)}
                              className="h-4 w-4"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScrollArea>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có tài khoản nào. Vui lòng thêm tài khoản trong phần Quản lý người dùng.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
