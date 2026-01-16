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

      // Tính thống kê theo mâm
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
      };
    };

    return {
      breakfast: calculateStats(getMealReports.breakfastReports, 'breakfast'),
      lunch: calculateStats(getMealReports.lunchReports, 'lunch'),
      dinner: calculateStats(getMealReports.dinnerReports, 'dinner'),
    };
  }, [getMealReports, students]);

  // Tính số gạo cần dùng trong ngày
  const totalRice = useMemo(() => {
    const lunchRice = mealStats.lunch.presentCount * RICE_PER_STUDENT;
    const dinnerRice = mealStats.dinner.presentCount * RICE_PER_STUDENT;
    return lunchRice + dinnerRice;
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

    message += `\n🍚 Số gạo cần dùng: ${totalRice.toFixed(1)} kg\n`;
    
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

    return (
      <div className="space-y-3 p-4 rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getMealIcon(mealType)}</span>
            <span className="font-semibold">{getMealLabel(mealType)}</span>
          </div>
          {stats.hasReports ? (
            <Badge variant={isComplete ? "default" : "secondary"}>
              {isComplete ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Đủ</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Thiếu {stats.missingClasses.length} lớp</>
              )}
            </Badge>
          ) : (
            <Badge variant="destructive">Chưa có báo cáo</Badge>
          )}
        </div>

        {stats.hasReports && (
          <>
            {/* Số liệu */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sỹ số:</span>
              <span className="font-bold text-lg">
                {stats.presentCount}
                <span className="text-muted-foreground font-normal text-base">/{stats.totalStudents}</span>
              </span>
            </div>

            {/* Lớp đã báo */}
            {stats.reportedClasses.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Đã báo ({stats.reportedClasses.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {stats.reportedClasses.map(c => (
                    <Badge key={c.id} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Lớp chưa báo */}
            {stats.missingClasses.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                  Chưa báo ({stats.missingClasses.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {stats.missingClasses.map(c => (
                    <Badge key={c.id} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Danh sách vắng theo mâm */}
            {stats.absentCount > 0 && Object.keys(stats.mealGroupStats).length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-destructive flex items-center gap-1">
                  <Utensils className="h-3 w-3" />
                  Vắng theo mâm: {stats.absentCount} học sinh
                </p>
                <div className="space-y-2">
                  {Object.entries(stats.mealGroupStats)
                    .filter(([_, data]) => data.absent > 0)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([group, data]) => (
                      <div key={group} className="bg-destructive/5 rounded-md p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-destructive">
                            Mâm {group}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200">
                            {data.present}/{data.total}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {data.absentStudents.map((s, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded",
                                s.permission === 'P' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              )}
                            >
                              {s.name} ({s.className}) {s.permission === 'P' ? 'P' : 'KP'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Danh sách vắng không có mâm */}
            {stats.absentCount > 0 && Object.keys(stats.mealGroupStats).length === 0 && (
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs font-medium text-destructive">
                  Vắng: {stats.absentCount} học sinh
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {stats.absentStudents.map((s, idx) => (
                    <div key={idx} className="text-xs flex items-center justify-between p-1.5 rounded bg-destructive/5">
                      <span>{s.name} - {s.className}</span>
                      <span className={cn(
                        "px-1 rounded text-[10px]",
                        s.permission === 'P' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {s.permission === 'P' ? 'P' : 'KP'}
                      </span>
                    </div>
                  ))}
                </div>
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

          {/* Số gạo */}
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <Scale className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-800">
              Số gạo cần dùng trong ngày: <span className="text-xl font-bold">{totalRice.toFixed(1)} kg</span>
            </span>
          </div>

          {/* Tổng hợp */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">
                {mealStats.breakfast.presentCount + mealStats.lunch.presentCount + mealStats.dinner.presentCount}
              </p>
              <p className="text-xs text-blue-600">Tổng lượt ăn</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-2xl font-bold text-red-700">
                {mealStats.breakfast.absentCount + mealStats.lunch.absentCount + mealStats.dinner.absentCount}
              </p>
              <p className="text-xs text-red-600">Tổng lượt vắng</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-2xl font-bold text-green-700">
                {classes.length - Math.max(
                  mealStats.breakfast.missingClasses.length,
                  mealStats.lunch.missingClasses.length,
                  mealStats.dinner.missingClasses.length
                )}
              </p>
              <p className="text-xs text-green-600">Lớp báo đủ</p>
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
