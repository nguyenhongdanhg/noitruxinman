import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Download, Calendar, Book, Moon, Utensils, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { StatsSummaryCard } from '@/components/statistics/StatsSummaryCard';

export default function Statistics() {
  const { reports, students, classes } = useApp();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
  const monthEnd = endOfMonth(monthStart);

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || classId;
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter reports by month
  const monthReports = useMemo(() => {
    return reports.filter((r) => {
      const reportDate = new Date(r.date);
      return isWithinInterval(reportDate, { start: monthStart, end: monthEnd });
    });
  }, [reports, monthStart, monthEnd]);

  // Group reports by type and date
  const groupedReports = useMemo(() => {
    const eveningStudy: typeof monthReports = [];
    const boarding: typeof monthReports = [];
    const meals: typeof monthReports = [];

    monthReports.forEach(r => {
      if (r.type === 'evening_study') eveningStudy.push(r);
      else if (r.type === 'boarding') boarding.push(r);
      else if (r.type === 'meal') meals.push(r);
    });

    // Sort by date descending
    const sortByDate = (a: typeof monthReports[0], b: typeof monthReports[0]) => 
      new Date(b.date).getTime() - new Date(a.date).getTime();

    return {
      eveningStudy: eveningStudy.sort(sortByDate),
      boarding: boarding.sort(sortByDate),
      meals: meals.sort(sortByDate),
    };
  }, [monthReports]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const stats = {
      eveningStudy: { total: 0, present: 0, absent: 0 },
      boarding: { total: 0, present: 0, absent: 0 },
      meals: { total: 0, present: 0, absent: 0 },
    };

    monthReports.forEach((report) => {
      if (report.type === 'evening_study') {
        stats.eveningStudy.total += report.totalStudents;
        stats.eveningStudy.present += report.presentCount;
        stats.eveningStudy.absent += report.absentCount;
      } else if (report.type === 'boarding') {
        stats.boarding.total += report.totalStudents;
        stats.boarding.present += report.presentCount;
        stats.boarding.absent += report.absentCount;
      } else if (report.type === 'meal') {
        stats.meals.total += report.totalStudents;
        stats.meals.present += report.presentCount;
        stats.meals.absent += report.absentCount;
      }
    });

    return stats;
  }, [monthReports]);

  // Calculate meal group stats for a report
  const getMealGroupStats = (report: typeof monthReports[0]) => {
    const stats: Record<string, { total: number; absent: number }> = {};
    const mealGroups = [...new Set(students.map(s => s.mealGroup))];
    
    mealGroups.forEach(group => {
      const groupStudents = students.filter(s => s.mealGroup === group);
      const absentInGroup = report.absentStudents.filter(a => {
        const student = students.find(s => s.id === a.studentId);
        return student?.mealGroup === group;
      });
      stats[group] = {
        total: groupStudents.length,
        absent: absentInGroup.length,
      };
    });

    return stats;
  };

  // Calculate class stats for a report
  const getClassStats = (report: typeof monthReports[0]) => {
    const stats: Record<string, { total: number; absent: number }> = {};
    const classIds = [...new Set(report.absentStudents.map(a => a.classId))];
    
    classIds.forEach(classId => {
      const classStudents = students.filter(s => s.classId === classId);
      const absentInClass = report.absentStudents.filter(a => a.classId === classId);
      stats[classId] = {
        total: classStudents.length,
        absent: absentInClass.length,
      };
    });

    return stats;
  };

  const getMealTypeLabel = (mealType?: string) => {
    switch (mealType) {
      case 'breakfast': return 'Bữa sáng';
      case 'lunch': return 'Bữa trưa';
      case 'dinner': return 'Bữa tối';
      default: return '';
    }
  };

  const getSessionLabel = (session?: string) => {
    switch (session) {
      case 'morning_exercise': return 'Thể dục sáng';
      case 'noon_nap': return 'Ngủ trưa';
      case 'evening_sleep': return 'Ngủ tối';
      case 'random': return 'Đột xuất';
      default: return '';
    }
  };

  const exportReport = () => {
    let csv = '\ufeff';
    csv += `Báo cáo thống kê tháng ${format(monthStart, 'MM/yyyy')}\n\n`;
    
    csv += `THỐNG KÊ TỰ HỌC\n`;
    csv += `Tổng số lượt điểm danh,Có mặt,Vắng\n`;
    csv += `${summaryStats.eveningStudy.total},${summaryStats.eveningStudy.present},${summaryStats.eveningStudy.absent}\n\n`;
    
    csv += `THỐNG KÊ NỘI TRÚ\n`;
    csv += `Tổng số lượt điểm danh,Có mặt,Vắng\n`;
    csv += `${summaryStats.boarding.total},${summaryStats.boarding.present},${summaryStats.boarding.absent}\n\n`;
    
    csv += `THỐNG KÊ BỮA ĂN\n`;
    csv += `Tổng số lượt,Có mặt,Vắng\n`;
    csv += `${summaryStats.meals.total},${summaryStats.meals.present},${summaryStats.meals.absent}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thong_ke_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Xuất báo cáo thành công',
      description: 'File báo cáo đã được tải xuống',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Thống kê tổng hợp
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem thống kê điểm danh và bữa ăn
          </p>
        </div>
        <Button onClick={exportReport} variant="outline" className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Month Filter */}
      <Card>
        <CardContent className="py-3 sm:py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Giờ tự học</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {summaryStats.eveningStudy.present}/{summaryStats.eveningStudy.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Moon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Nội trú/Ngủ</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {summaryStats.boarding.present}/{summaryStats.boarding.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Utensils className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Bữa ăn</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {summaryStats.meals.present}/{summaryStats.meals.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports by Category */}
      <Tabs defaultValue="study" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="study" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Book className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tự học</span>
            <span className="sm:hidden">Tự học</span>
          </TabsTrigger>
          <TabsTrigger value="boarding" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Nội trú</span>
            <span className="sm:hidden">Ngủ</span>
          </TabsTrigger>
          <TabsTrigger value="meals" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Bữa ăn</span>
            <span className="sm:hidden">Ăn</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="study" className="mt-4 space-y-3">
          {groupedReports.eveningStudy.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Book className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có báo cáo tự học trong tháng này</p>
              </CardContent>
            </Card>
          ) : (
            groupedReports.eveningStudy.map((report) => (
              <StatsSummaryCard
                key={report.id}
                icon={Book}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                title={`Giờ tự học tối`}
                date={format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })}
                total={report.totalStudents}
                present={report.presentCount}
                absent={report.absentCount}
                absentList={report.absentStudents.map(a => ({
                  name: a.name,
                  className: getClassName(a.classId),
                  permission: a.permission,
                  reason: a.reason,
                }))}
                isExpanded={expandedCards[report.id] || false}
                onToggle={() => toggleCard(report.id)}
                type="study"
                classStats={getClassStats(report)}
                getClassName={getClassName}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="boarding" className="mt-4 space-y-3">
          {groupedReports.boarding.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Moon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có báo cáo nội trú trong tháng này</p>
              </CardContent>
            </Card>
          ) : (
            groupedReports.boarding.map((report) => (
              <StatsSummaryCard
                key={report.id}
                icon={Moon}
                iconColor="text-accent"
                iconBg="bg-accent/10"
                title={getSessionLabel(report.session) || 'Điểm danh nội trú'}
                date={format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })}
                total={report.totalStudents}
                present={report.presentCount}
                absent={report.absentCount}
                absentList={report.absentStudents.map(a => ({
                  name: a.name,
                  className: getClassName(a.classId),
                  permission: a.permission,
                  reason: a.reason,
                }))}
                isExpanded={expandedCards[report.id] || false}
                onToggle={() => toggleCard(report.id)}
                type="boarding"
                classStats={getClassStats(report)}
                getClassName={getClassName}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="meals" className="mt-4 space-y-3">
          {groupedReports.meals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có báo cáo bữa ăn trong tháng này</p>
              </CardContent>
            </Card>
          ) : (
            groupedReports.meals.map((report) => (
              <StatsSummaryCard
                key={report.id}
                icon={Utensils}
                iconColor="text-success"
                iconBg="bg-success/10"
                title={getMealTypeLabel(report.mealType)}
                date={`Ngày ${format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })}`}
                total={report.totalStudents}
                present={report.presentCount}
                absent={report.absentCount}
                absentList={report.absentStudents.map(a => ({
                  name: a.name,
                  className: getClassName(a.classId),
                  mealGroup: a.mealGroup,
                  permission: a.permission,
                  reason: a.reason,
                }))}
                isExpanded={expandedCards[report.id] || false}
                onToggle={() => toggleCard(report.id)}
                type="meal"
                mealGroupStats={getMealGroupStats(report)}
                classStats={getClassStats(report)}
                getClassName={getClassName}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
