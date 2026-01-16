import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Save, Loader2 } from 'lucide-react';
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
      
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-max">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium sticky left-0 bg-muted/50 z-10 min-w-[40px]">STT</th>
                  <th className="p-2 text-left font-medium sticky left-[40px] bg-muted/50 z-10 min-w-[150px]">Họ và tên</th>
                  <th className="p-2 text-center font-medium min-w-[40px]">SL</th>
                  {dayHeaders.map(({ day, isSunday }) => (
                    <th
                      key={day}
                      className={cn(
                        "p-1 text-center font-medium min-w-[32px]",
                        isSunday && "text-destructive bg-destructive/10"
                      )}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
                <tr className="border-b text-xs text-muted-foreground">
                  <td className="sticky left-0 bg-background"></td>
                  <td className="sticky left-[40px] bg-background"></td>
                  <td></td>
                  {dayHeaders.map(({ day, isSunday, label }) => (
                    <td
                      key={day}
                      className={cn(
                        "p-1 text-center",
                        isSunday && "text-destructive bg-destructive/10"
                      )}
                    >
                      {label}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const dutyCount = getDutyCount(user.full_name);
                  return (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 text-center sticky left-0 bg-background z-10">
                        {index + 1}
                      </td>
                      <td className="p-2 sticky left-[40px] bg-background z-10 whitespace-nowrap">
                        {user.full_name}
                      </td>
                      <td className="p-2 text-center font-medium">
                        {dutyCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary/10 text-primary text-xs">
                            {dutyCount}
                          </span>
                        )}
                      </td>
                      {dayHeaders.map(({ day, isSunday }) => {
                        const isChecked = selections[user.full_name]?.has(day) || false;
                        return (
                          <td
                            key={day}
                            className={cn(
                              "p-1 text-center",
                              isSunday && "bg-destructive/5"
                            )}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleSelection(user.full_name, day)}
                              className="mx-auto"
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
