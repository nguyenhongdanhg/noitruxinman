import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Save, Loader2, AlertTriangle, AlertCircle, Info, EyeOff, Eye, Copy, Trash2, RefreshCw, Users, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDutySchedule, DutySchedule } from '@/hooks/useDutySchedule';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, getDaysInMonth, getDay, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DutyScheduleManagerProps {
  selectedMonth: Date;
  onSaveComplete?: () => void;
}

interface UserProfile {
  id: string;
  full_name: string;
}

const DUTY_LIST_STORAGE_KEY = 'duty-schedule-user-list';

// Load saved duty list from localStorage
const loadSavedDutyList = (): UserProfile[] => {
  try {
    const saved = localStorage.getItem(DUTY_LIST_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading saved duty list:', e);
  }
  return [];
};

// Save duty list to localStorage
const saveDutyList = (users: UserProfile[]) => {
  try {
    localStorage.setItem(DUTY_LIST_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving duty list:', e);
  }
};

export function DutyScheduleManager({ selectedMonth, onSaveComplete }: DutyScheduleManagerProps) {
  const { toast } = useToast();
  const { bulkAddDuty, isBulkAdding, useDutyByMonth } = useDutySchedule();
  
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth() + 1;
  const daysInMonth = getDaysInMonth(selectedMonth);
  
  // Hidden users state (ẩn tạm thời trong dropdown)
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());
  
  // Active duty list users (only users that are in the duty list) - load from localStorage on init
  const [dutyListUsers, setDutyListUsers] = useState<UserProfile[]>(() => loadSavedDutyList());
  
  // Fetch existing duties for this month
  const { data: existingDuties = [] } = useDutyByMonth(year, month);

  // Calculate previous month
  const previousMonth = subMonths(selectedMonth, 1);
  const prevYear = previousMonth.getFullYear();
  const prevMonthNum = previousMonth.getMonth() + 1;
  const prevDaysInMonth = getDaysInMonth(previousMonth);

  // Fetch previous month's duties for copy feature
  const { data: prevMonthDuties = [] } = useDutyByMonth(prevYear, prevMonthNum);
  
  // Fetch all users from profiles (for loading)
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
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

  // Filter visible users (exclude hidden)
  const visibleUsers = useMemo(() => {
    return dutyListUsers.filter(user => !hiddenUsers.has(user.id));
  }, [dutyListUsers, hiddenUsers]);

  // Build initial selections from existing duties
  const initialSelections = useMemo(() => {
    const selections: Record<string, Set<number>> = {};
    dutyListUsers.forEach(user => {
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
  }, [dutyListUsers, existingDuties]);

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

  const toggleHideUser = (userId: string) => {
    setHiddenUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const showAllUsers = () => {
    setHiddenUsers(new Set());
  };

  // Remove user from duty list (not from system) and save
  const removeUserFromDutyList = (userId: string, userName: string) => {
    setDutyListUsers(prev => {
      const newList = prev.filter(u => u.id !== userId);
      saveDutyList(newList);
      return newList;
    });
    // Also clear their selections
    setSelections(prev => {
      const next = { ...prev };
      delete next[userName];
      return next;
    });
    toast({
      title: 'Đã xóa khỏi danh sách',
      description: `${userName} đã được xóa khỏi danh sách phân công trực.`,
    });
  };

  // Load all users from account list and save
  const loadFromAccountList = () => {
    const newList = [...allUsers];
    setDutyListUsers(newList);
    saveDutyList(newList);
    setHiddenUsers(new Set());
    // Initialize selections for new users
    setSelections(prev => {
      const next = { ...prev };
      allUsers.forEach(user => {
        if (!next[user.full_name]) {
          next[user.full_name] = new Set();
        }
      });
      // Also include existing duties
      existingDuties.forEach(duty => {
        const day = parseInt(duty.duty_date.split('-')[2], 10);
        if (!next[duty.teacher_name]) {
          next[duty.teacher_name] = new Set();
        }
        next[duty.teacher_name].add(day);
      });
      return next;
    });
    toast({
      title: 'Đã tải danh sách',
      description: `Đã thêm ${allUsers.length} người vào danh sách phân công.`,
    });
  };

  // Copy from previous month function
  const copyFromPreviousMonth = () => {
    if (prevMonthDuties.length === 0) {
      toast({
        title: 'Không có dữ liệu',
        description: `Tháng ${prevMonthNum}/${prevYear} chưa có lịch trực để sao chép.`,
        variant: 'destructive',
      });
      return;
    }

    // Build a map: teacher_name -> set of day-of-week they were on duty
    // We'll match by day-of-week pattern
    const newSelections: Record<string, Set<number>> = {};
    
    // Initialize with empty sets for all users
    dutyListUsers.forEach(user => {
      newSelections[user.full_name] = new Set();
    });

    // For each teacher in previous month, find matching days-of-week in current month
    prevMonthDuties.forEach(duty => {
      const prevDate = new Date(duty.duty_date);
      const prevDayOfMonth = prevDate.getDate();
      
      // Find corresponding day in current month
      // Option 1: Same day of month (if exists)
      if (prevDayOfMonth <= daysInMonth) {
        if (!newSelections[duty.teacher_name]) {
          newSelections[duty.teacher_name] = new Set();
        }
        newSelections[duty.teacher_name].add(prevDayOfMonth);
      }
    });

    setSelections(prev => {
      // Merge with existing selections or replace
      const merged = { ...prev };
      Object.entries(newSelections).forEach(([name, days]) => {
        if (days.size > 0) {
          merged[name] = new Set([...(merged[name] || []), ...days]);
        }
      });
      return merged;
    });

    toast({
      title: 'Đã sao chép lịch trực',
      description: `Đã sao chép ${prevMonthDuties.length} lượt trực từ tháng ${prevMonthNum}/${prevYear}`,
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
    const headers = ['STT', 'Họ và tên'];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isSunday = getDay(date) === 0;
      headers.push(isSunday ? `${day} (CN)` : `${day}`);
    }

    const rows: string[] = [];
    rows.push(`Lịch trực tháng ${month}/${year}`);
    rows.push('');
    rows.push(headers.join(','));
    
    const dayLabels = ['', ''];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isSunday = getDay(date) === 0;
      dayLabels.push(isSunday ? 'CN' : format(date, 'EEEEEE', { locale: vi }));
    }
    rows.push(dayLabels.join(','));

    let stt = 1;
    dutyListUsers.forEach(user => {
      const userDays = selections[user.full_name] || new Set();
      const row = [stt.toString(), user.full_name];
      for (let day = 1; day <= daysInMonth; day++) {
        row.push(userDays.has(day) ? 'x' : '');
      }
      rows.push(row.join(','));
      stt++;
    });

    const userNames = new Set(dutyListUsers.map(u => u.full_name));
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

  const getDutyCount = (teacherName: string) => {
    return selections[teacherName]?.size || 0;
  };

  // Calculate warnings (only for visible users)
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

    visibleUsers.forEach(user => {
      const count = selections[user.full_name]?.size || 0;
      if (count === 0) {
        result.noAssignment.push(user.full_name);
      } else if (count > 5) {
        result.tooMany.push(user.full_name);
      }
    });

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
  }, [selections, visibleUsers, daysInMonth]);

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

  // Show empty state with load button if list is empty
  if (dutyListUsers.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Phân công lịch trực tháng {month}/{year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Users className="h-16 w-16 text-muted-foreground/50" />
            <div className="text-center space-y-2">
              <h3 className="font-medium text-lg">Chưa có danh sách phân công</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Nhấn nút bên dưới để tải danh sách người trực từ danh sách tài khoản. 
                Bạn có thể xóa bớt người không cần thiết sau khi tải.
              </p>
            </div>
            <Button size="lg" onClick={loadFromAccountList} className="mt-4">
              <RefreshCw className="h-5 w-5 mr-2" />
              Tải danh sách từ tài khoản ({allUsers.length} người)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base">
            Phân công lịch trực tháng {month}/{year}
          </CardTitle>
          
          <div className="flex flex-wrap gap-2">
            {/* Reload from account list button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Tải lại DS</span>
                  <span className="sm:hidden">Tải lại</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tải lại danh sách</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có muốn tải lại danh sách từ danh sách tài khoản? Danh sách hiện tại sẽ được thay thế.
                    <span className="block mt-2 text-foreground font-medium">
                      Có {allUsers.length} người trong danh sách tài khoản.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={loadFromAccountList}>
                    Tải lại
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Hide/show users dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {hiddenUsers.size > 0 ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Đã ẩn {hiddenUsers.size}
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Ẩn/Hiện
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-auto bg-background">
                <DropdownMenuLabel>Ẩn người trực (tạm thời)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hiddenUsers.size > 0 && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-xs" 
                      onClick={showAllUsers}
                    >
                      Hiện tất cả
                    </Button>
                    <DropdownMenuSeparator />
                  </>
                )}
                {dutyListUsers.map(user => (
                  <DropdownMenuCheckboxItem
                    key={user.id}
                    checked={hiddenUsers.has(user.id)}
                    onCheckedChange={() => toggleHideUser(user.id)}
                    className="text-xs"
                  >
                    {user.full_name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Sao chép T{prevMonthNum}</span>
                  <span className="sm:hidden">Chép</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sao chép lịch trực</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có muốn sao chép lịch trực từ tháng {prevMonthNum}/{prevYear} sang tháng {month}/{year}?
                    {prevMonthDuties.length > 0 ? (
                      <span className="block mt-2 text-foreground font-medium">
                        Có {prevMonthDuties.length} lượt trực sẽ được sao chép.
                      </span>
                    ) : (
                      <span className="block mt-2 text-destructive font-medium">
                        Tháng trước chưa có lịch trực.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={copyFromPreviousMonth}
                    disabled={prevMonthDuties.length === 0}
                  >
                    Sao chép
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isBulkAdding}>
              {isBulkAdding ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              <span className="hidden sm:inline">Lưu lịch trực</span>
              <span className="sm:hidden">Lưu</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 px-2 sm:px-6">
        {/* Info about visual mode */}
        <Alert variant="default" className="py-2 border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs text-primary">
            <strong>Hướng dẫn:</strong> Click trực tiếp vào ô để chọn/bỏ chọn ngày trực. 
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
              = đã chọn
            </span>
          </AlertDescription>
        </Alert>

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

        {/* Table with proper horizontal scroll */}
        <div className="relative border rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: `${200 + daysInMonth * 32}px` }}>
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-1 py-1.5 text-left font-medium sticky left-0 bg-muted/50 z-20 w-8 border-r">#</th>
                  <th className="px-2 py-1.5 text-left font-medium sticky left-8 bg-muted/50 z-20 w-40 min-w-[160px] border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Họ tên</th>
                  <th className="px-1 py-1.5 text-center font-medium w-8">SL</th>
                  {dayHeaders.map(({ day, isSunday }) => (
                    <th
                      key={day}
                      className={cn(
                        "px-0 py-1.5 text-center font-medium w-8",
                        isSunday && "text-destructive bg-destructive/10"
                      )}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
                <tr className="border-b text-[10px] text-muted-foreground bg-muted/30">
                  <td className="sticky left-0 bg-muted/30 z-20 border-r"></td>
                  <td className="sticky left-8 bg-muted/30 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></td>
                  <td></td>
                  {dayHeaders.map(({ day, isSunday, label }) => (
                    <td
                      key={day}
                      className={cn(
                        "px-0 text-center",
                        isSunday && "text-destructive bg-destructive/10"
                      )}
                    >
                      {label}
                    </td>
                  ))}
                </tr>
                <tr className="border-b bg-muted/20 text-[10px]">
                  <td className="sticky left-0 bg-muted/20 z-20 border-r"></td>
                  <td className="sticky left-8 bg-muted/20 z-20 px-2 font-medium text-muted-foreground border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Số người</td>
                  <td></td>
                  {dayHeaders.map(({ day, isSunday }) => {
                    const staffCount = getStaffCountForDay(day);
                    const isLow = staffCount > 0 && staffCount < 3;
                    const isExact = staffCount === 3;
                    return (
                      <td
                        key={day}
                        className={cn(
                          "px-0 text-center font-medium",
                          isSunday && "bg-destructive/5",
                          isLow && "text-destructive",
                          isExact && "text-green-600",
                          staffCount > 3 && "text-amber-600"
                        )}
                      >
                        {staffCount > 0 && staffCount}
                      </td>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user, index) => {
                  const dutyCount = getDutyCount(user.full_name);
                  const hasNoAssignment = dutyCount === 0;
                  const hasTooMany = dutyCount > 5;
                  const rowBg = hasNoAssignment 
                    ? 'bg-amber-50/50 dark:bg-amber-950/10' 
                    : hasTooMany 
                      ? 'bg-orange-50/50 dark:bg-orange-950/10'
                      : 'bg-background';
                  
                  return (
                    <tr 
                      key={user.id} 
                      className={cn(
                        "border-b hover:bg-muted/30",
                        hasNoAssignment && "bg-amber-50/50 dark:bg-amber-950/10",
                        hasTooMany && "bg-orange-50/50 dark:bg-orange-950/10"
                      )}
                    >
                      <td className={cn("px-1 py-0.5 text-center sticky left-0 z-20 text-muted-foreground border-r w-8", rowBg)}>
                        {index + 1}
                      </td>
                      <td 
                        className={cn("px-2 py-0.5 sticky left-8 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group w-40", rowBg)} 
                        title={user.full_name}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{user.full_name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => removeUserFromDutyList(user.id, user.full_name)}
                            title="Xóa khỏi danh sách"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-1 py-0.5 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center h-5 min-w-[18px] px-1 rounded text-[11px] font-medium",
                          dutyCount === 0 && "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
                          dutyCount > 0 && dutyCount <= 5 && "bg-primary/10 text-primary",
                          dutyCount > 5 && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                        )}>
                          {dutyCount}
                        </span>
                      </td>
                      {dayHeaders.map(({ day, isSunday }) => {
                        const isChecked = selections[user.full_name]?.has(day) || false;
                        const staffCount = getStaffCountForDay(day);
                        const isLowStaff = staffCount > 0 && staffCount < 3 && isChecked;
                        
                        return (
                          <td
                            key={day}
                            className={cn(
                              "px-0 py-0.5 text-center",
                              isSunday && "bg-destructive/5"
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => toggleSelection(user.full_name, day)}
                              className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 mx-auto",
                                "hover:ring-2 hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary",
                                isChecked 
                                  ? "bg-primary text-primary-foreground shadow-sm" 
                                  : "bg-muted/30 hover:bg-muted/60 text-transparent",
                                isLowStaff && "ring-2 ring-destructive/50"
                              )}
                              title={isChecked ? 'Bỏ chọn' : 'Chọn trực'}
                            >
                              {isChecked && <Check className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {visibleUsers.length === 0 && dutyListUsers.length > 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tất cả người dùng đang bị ẩn</p>
            <Button variant="link" size="sm" onClick={showAllUsers}>
              Hiện tất cả
            </Button>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}
