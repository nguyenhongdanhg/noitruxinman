import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { classes } from '@/data/mockData';
import { format, parseISO, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Utensils, CheckCircle2, AlertCircle, Image, Share2, 
  Calendar, Loader2, GraduationCap, Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

const RICE_PER_STUDENT = 0.2; // kg gạo/học sinh/bữa trưa hoặc tối

export function MealDailyStats() {
  const { reports, students, schoolInfo } = useApp();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Lấy các báo cáo bữa ăn cho ngày đã chọn
  // Bữa sáng của ngày X là báo cáo của ngày (X-1) với mealType = 'breakfast'
  const getMealReports = useMemo(() => {
    const date = parseISO(selectedDate);
    const previousDay = format(addDays(date, -1), 'yyyy-MM-dd');
    
    // Lọc báo cáo bữa ăn
    const breakfastReports = reports.filter(r => 
      r.type === 'meal' && r.mealType === 'breakfast' && r.date === previousDay
    );
    const lunchReports = reports.filter(r => 
      r.type === 'meal' && r.mealType === 'lunch' && r.date === selectedDate
    );
    const dinnerReports = reports.filter(r => 
      r.type === 'meal' && r.mealType === 'dinner' && r.date === selectedDate
    );

    return { breakfastReports, lunchReports, dinnerReports };
  }, [reports, selectedDate]);

  // Tính toán thống kê cho mỗi bữa
  const mealStats = useMemo(() => {
    const calculateStats = (mealReports: typeof reports, mealType: 'breakfast' | 'lunch' | 'dinner') => {
      // Lấy danh sách các lớp đã báo (theo classId trong báo cáo)
      const reportedClassIds = new Set<string>();
      let totalReported = 0;
      let totalAbsent = 0;
      const absentStudents: Array<{
        name: string;
        className: string;
        mealGroup?: string;
        permission?: 'P' | 'KP';
        reason?: string;
      }> = [];

      mealReports.forEach(report => {
        // Tìm classId từ báo cáo dựa trên học sinh
        const studentIds = new Set(report.absentStudents.map(a => a.studentId));
        const classStudentsMap = new Map<string, number>();
        
        students.forEach(student => {
          if (!classStudentsMap.has(student.classId)) {
            classStudentsMap.set(student.classId, 0);
          }
        });

        // Đánh dấu lớp đã báo nếu có báo cáo cho lớp đó
        report.absentStudents.forEach(absent => {
          reportedClassIds.add(absent.classId);
          absentStudents.push({
            name: absent.name,
            className: classes.find(c => c.id === absent.classId)?.name || absent.classId,
            mealGroup: absent.mealGroup,
            permission: absent.permission,
            reason: absent.reason,
          });
        });

        totalReported += report.presentCount + report.absentCount;
        totalAbsent += report.absentCount;
      });

      // Xác định lớp đã báo dựa trên classId trong absentStudents
      // Hoặc dựa trên việc tổng số = số học sinh của lớp
      const allClasses = classes;
      const missingClasses = allClasses.filter(c => !reportedClassIds.has(c.id));
      const reportedClasses = allClasses.filter(c => reportedClassIds.has(c.id));

      // Lấy tổng số học sinh nội trú (có room)
      const boardingStudents = students.filter(s => s.room);
      const presentCount = totalReported - totalAbsent;

      // Tính thống kê theo mâm (cho bữa trưa/tối)
      const mealGroupStats: Record<string, { total: number; present: number; absent: number; absentStudents: Array<{ name: string; className: string; permission?: 'P' | 'KP' }> }> = {};
      const mealGroups = [...new Set(boardingStudents.map(s => s.mealGroup).filter(Boolean))];
      
      mealGroups.forEach(group => {
        const groupStudents = boardingStudents.filter(s => s.mealGroup === group);
        const absentInGroup = absentStudents.filter(a => a.mealGroup === group);
        const presentInGroup = groupStudents.length - absentInGroup.length;
        mealGroupStats[group] = {
          total: groupStudents.length,
          present: presentInGroup > 0 ? presentInGroup : 0,
          absent: absentInGroup.length,
          absentStudents: absentInGroup.map(a => ({
            name: a.name,
            className: a.className,
            permission: a.permission,
          })),
        };
      });

      // Tính thống kê theo lớp (cho bữa sáng)
      const classStats: Record<string, { total: number; present: number; absent: number; absentStudents: Array<{ name: string; permission?: 'P' | 'KP' }> }> = {};
      const classIds = [...new Set(boardingStudents.map(s => s.classId))];
      
      classIds.forEach(classId => {
        const classStudents = boardingStudents.filter(s => s.classId === classId);
        const absentInClass = absentStudents.filter(a => {
          const student = boardingStudents.find(s => s.name === a.name && s.classId === classId);
          return student !== undefined || (a.className === classes.find(c => c.id === classId)?.name);
        }).filter(a => a.className === classes.find(c => c.id === classId)?.name);
        const presentInClass = classStudents.length - absentInClass.length;
        const className = classes.find(c => c.id === classId)?.name || classId;
        classStats[className] = {
          total: classStudents.length,
          present: presentInClass > 0 ? presentInClass : 0,
          absent: absentInClass.length,
          absentStudents: absentInClass.map(a => ({
            name: a.name,
            permission: a.permission,
          })),
        };
      });

      return {
        reportedClasses,
        missingClasses,
        totalStudents: boardingStudents.length,
        reportedCount: mealReports.length > 0 ? totalReported : 0,
        presentCount: mealReports.length > 0 ? presentCount : 0,
        absentCount: mealReports.length > 0 ? totalAbsent : 0,
        absentStudents,
        hasReports: mealReports.length > 0,
        mealGroupStats,
        classStats,
      };
    };

    return {
      breakfast: calculateStats(getMealReports.breakfastReports, 'breakfast'),
      lunch: calculateStats(getMealReports.lunchReports, 'lunch'),
      dinner: calculateStats(getMealReports.dinnerReports, 'dinner'),
    };
  }, [getMealReports, students]);

  // Tính số gạo cần dùng trong ngày (tách theo bữa)
  const riceStats = useMemo(() => {
    const lunchRice = mealStats.lunch.presentCount * RICE_PER_STUDENT;
    const dinnerRice = mealStats.dinner.presentCount * RICE_PER_STUDENT;
    return {
      lunch: lunchRice,
      dinner: dinnerRice,
      total: lunchRice + dinnerRice,
    };
  }, [mealStats]);

  const getMealLabel = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    switch (mealType) {
      case 'breakfast': return 'Bữa sáng';
      case 'lunch': return 'Bữa trưa';
      case 'dinner': return 'Bữa tối';
    }
  };

  const getMealIcon = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
    }
  };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      const fileName = `thongke_buaan_${selectedDate}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: 'Xuất ảnh thành công',
        description: `Đã tải xuống ${fileName}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Lỗi xuất ảnh',
        description: 'Không thể xuất báo cáo dạng ảnh',
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  const shareToZalo = () => {
    let message = `📊 THỐNG KÊ BỮA ĂN NGÀY ${format(parseISO(selectedDate), 'dd/MM/yyyy')}\n\n`;
    
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      const stats = mealStats[mealType as keyof typeof mealStats];
      message += `${getMealIcon(mealType as 'breakfast' | 'lunch' | 'dinner')} ${getMealLabel(mealType as 'breakfast' | 'lunch' | 'dinner')}: ${stats.presentCount}/${stats.totalStudents}`;
      if (stats.absentCount > 0) {
        message += ` (Vắng: ${stats.absentCount})`;
      }
      message += '\n';
    });

    message += `\n🍚 Số gạo: Trưa ${riceStats.lunch.toFixed(1)}kg + Tối ${riceStats.dinner.toFixed(1)}kg = ${riceStats.total.toFixed(1)}kg\n`;
    
    // Danh sách lớp chưa báo
    const allMissingClasses = new Set([
      ...mealStats.breakfast.missingClasses.map(c => c.name),
      ...mealStats.lunch.missingClasses.map(c => c.name),
      ...mealStats.dinner.missingClasses.map(c => c.name),
    ]);
    
    if (allMissingClasses.size > 0) {
      message += `\n⚠️ Lớp chưa báo đủ: ${[...allMissingClasses].join(', ')}\n`;
    }

    // Danh sách vắng
    const allAbsent = [
      ...mealStats.breakfast.absentStudents.map(s => ({ ...s, meal: 'Sáng' })),
      ...mealStats.lunch.absentStudents.map(s => ({ ...s, meal: 'Trưa' })),
      ...mealStats.dinner.absentStudents.map(s => ({ ...s, meal: 'Tối' })),
    ];

    if (allAbsent.length > 0) {
      message += `\n📝 Danh sách vắng (${allAbsent.length} lượt):\n`;
      allAbsent.forEach((s, i) => {
        const perm = s.permission === 'P' ? '(P)' : '(KP)';
        message += `${i + 1}. ${s.name} - ${s.className} - ${s.meal} ${perm}\n`;
      });
    }
    
    window.open(`https://zalo.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const renderMealCard = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const stats = mealStats[mealType];
    const isComplete = stats.missingClasses.length === 0 && stats.hasReports;
    const isBreakfast = mealType === 'breakfast';

    return (
      <div className="space-y-2 p-3 rounded-lg bg-muted/30 border">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{getMealIcon(mealType)}</span>
            <span className="font-semibold text-sm">{getMealLabel(mealType)}</span>
          </div>
          {stats.hasReports ? (
            <Badge variant={isComplete ? "default" : "secondary"} className="text-[10px] h-5">
              {isComplete ? "Đủ" : `Thiếu ${stats.missingClasses.length}`}
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] h-5">Chưa báo</Badge>
          )}
        </div>

        {stats.hasReports && (
          <>
            {/* Sỹ số compact */}
            <div className="flex items-center justify-between text-sm bg-background/50 rounded px-2 py-1">
              <span className="text-muted-foreground text-xs">Có mặt:</span>
              <span className="font-bold">
                {stats.presentCount}<span className="text-muted-foreground font-normal">/{stats.totalStudents}</span>
              </span>
            </div>

            {/* Lớp đã báo/chưa báo - compact */}
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div className="bg-green-50 rounded p-1.5">
                <p className="font-medium text-green-700 mb-0.5">✓ Đã báo ({stats.reportedClasses.length})</p>
                <p className="text-green-600 truncate">{stats.reportedClasses.map(c => c.name).join(', ') || '-'}</p>
              </div>
              <div className="bg-amber-50 rounded p-1.5">
                <p className="font-medium text-amber-700 mb-0.5">⚠ Chưa báo ({stats.missingClasses.length})</p>
                <p className="text-amber-600 truncate">{stats.missingClasses.map(c => c.name).join(', ') || '-'}</p>
              </div>
            </div>

            {/* Bữa sáng: Vắng theo lớp */}
            {isBreakfast && stats.absentCount > 0 && Object.keys(stats.classStats).length > 0 && (
              <div className="pt-2 border-t space-y-1.5">
                <p className="text-xs font-semibold text-destructive">
                  Vắng theo lớp ({stats.absentCount}):
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(stats.classStats)
                    .filter(([_, data]) => data.absent > 0)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([className, data]) => (
                      <div key={className} className="bg-destructive/5 rounded p-1.5">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-destructive">{className}</span>
                          <span className="text-amber-700 bg-amber-100 px-1.5 rounded text-[10px]">
                            {data.present}/{data.total}
                          </span>
                        </div>
                        <ol className="list-decimal list-inside text-[10px] space-y-0.5 text-muted-foreground">
                          {data.absentStudents.map((s, idx) => (
                            <li key={idx}>
                              <span className="font-medium text-foreground">{s.name}</span>
                              <span className={cn(
                                "ml-1 px-1 rounded",
                                s.permission === 'P' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              )}>
                                {s.permission === 'P' ? 'P' : 'KP'}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Bữa trưa/tối: Vắng theo mâm */}
            {!isBreakfast && stats.absentCount > 0 && Object.keys(stats.mealGroupStats).length > 0 && (
              <div className="pt-2 border-t space-y-1.5">
                <p className="text-xs font-semibold text-destructive">
                  Vắng theo mâm ({stats.absentCount}):
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(stats.mealGroupStats)
                    .filter(([_, data]) => data.absent > 0)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([group, data]) => (
                      <div key={group} className="bg-destructive/5 rounded p-1.5">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-destructive">Mâm {group}</span>
                          <span className="text-amber-700 bg-amber-100 px-1.5 rounded text-[10px]">
                            {data.present}/{data.total}
                          </span>
                        </div>
                        <ol className="list-decimal list-inside text-[10px] space-y-0.5 text-muted-foreground">
                          {data.absentStudents.map((s, idx) => (
                            <li key={idx}>
                              <span className="font-medium text-foreground">{s.name}</span>
                              <span className="text-muted-foreground"> - {s.className}</span>
                              <span className={cn(
                                "ml-1 px-1 rounded",
                                s.permission === 'P' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              )}>
                                {s.permission === 'P' ? 'P' : 'KP'}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Fallback: Danh sách vắng không có mâm/lớp */}
            {stats.absentCount > 0 && 
              ((isBreakfast && Object.keys(stats.classStats).length === 0) || 
               (!isBreakfast && Object.keys(stats.mealGroupStats).length === 0)) && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-destructive mb-1">
                  Vắng ({stats.absentCount}):
                </p>
                <ol className="list-decimal list-inside text-[10px] space-y-0.5 max-h-32 overflow-y-auto">
                  {stats.absentStudents.map((s, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground"> - {s.className}</span>
                      <span className={cn(
                        "ml-1 px-1 rounded text-[10px]",
                        s.permission === 'P' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {s.permission === 'P' ? 'P' : 'KP'}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="h-5 w-5 text-primary" />
            Thống kê bữa ăn theo ngày
          </CardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Báo cáo có thể xuất ảnh */}
        <div ref={reportRef} className="bg-background p-4 rounded-lg space-y-4">
          {/* Header */}
          <div className="text-center pb-3 border-b">
            <p className="text-xs text-muted-foreground">{schoolInfo.name}</p>
            <h3 className="font-bold text-lg">THỐNG KÊ BỮA ĂN</h3>
            <p className="text-sm text-muted-foreground">
              Ngày {format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: vi })}
            </p>
          </div>

          {/* 3 cột bữa ăn */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderMealCard('breakfast')}
            {renderMealCard('lunch')}
            {renderMealCard('dinner')}
          </div>

          {/* Số gạo - tách theo bữa */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-amber-800 text-sm">Số gạo cần dùng</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/50 rounded p-2">
                <p className="text-xs text-amber-600">Bữa trưa</p>
                <p className="font-bold text-amber-800">{riceStats.lunch.toFixed(1)} kg</p>
              </div>
              <div className="bg-white/50 rounded p-2">
                <p className="text-xs text-amber-600">Bữa tối</p>
                <p className="font-bold text-amber-800">{riceStats.dinner.toFixed(1)} kg</p>
              </div>
              <div className="bg-amber-100 rounded p-2">
                <p className="text-xs text-amber-700">Tổng</p>
                <p className="font-bold text-amber-900 text-lg">{riceStats.total.toFixed(1)} kg</p>
              </div>
            </div>
          </div>

          {/* Tổng hợp theo bữa */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-2xl font-bold text-orange-700">
                {mealStats.breakfast.presentCount}
              </p>
              <p className="text-xs text-orange-600">
                Tổng sáng <span className="text-red-500">(vắng {mealStats.breakfast.absentCount})</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">
                {mealStats.lunch.presentCount}
              </p>
              <p className="text-xs text-blue-600">
                Tổng trưa <span className="text-red-500">(vắng {mealStats.lunch.absentCount})</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-2xl font-bold text-purple-700">
                {mealStats.dinner.presentCount}
              </p>
              <p className="text-xs text-purple-600">
                Tổng tối <span className="text-red-500">(vắng {mealStats.dinner.absentCount})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={exportAsImage} disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Image className="h-4 w-4 mr-1" />}
            Tải ảnh
          </Button>
          <Button variant="outline" size="sm" onClick={shareToZalo}>
            <Share2 className="h-4 w-4 mr-1" />
            Chia sẻ Zalo
          </Button>
        </div>

        {/* Ghi chú */}
        <p className="text-xs text-muted-foreground italic">
          * Bữa sáng được báo từ ngày hôm trước. Mỗi bữa trưa/tối tính {RICE_PER_STUDENT} kg gạo/học sinh.
        </p>
      </CardContent>
    </Card>
  );
}
