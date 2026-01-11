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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart3, Download, Calendar, TrendingUp, Users, Utensils } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function Statistics() {
  const { reports, students, classes } = useApp();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const filteredStudents = useMemo(() => {
    if (selectedClass === 'all') return students;
    return students.filter((s) => s.classId === selectedClass);
  }, [students, selectedClass]);

  const mealStats = useMemo(() => {
    const stats: Record<string, { breakfast: number; lunch: number; dinner: number }> = {};
    
    filteredStudents.forEach((student) => {
      stats[student.id] = { breakfast: 0, lunch: 0, dinner: 0 };
    });

    const monthReports = reports.filter((r) => {
      if (r.type !== 'meal') return false;
      const reportDate = new Date(r.date);
      return isWithinInterval(reportDate, { start: monthStart, end: monthEnd });
    });

    monthReports.forEach((report) => {
      const presentIds = new Set(
        filteredStudents.map((s) => s.id).filter((id) =>
          !report.absentStudents.some((as) => as.studentId === id)
        )
      );

      presentIds.forEach((id) => {
        if (stats[id] && report.mealType) {
          stats[id][report.mealType as keyof typeof stats[typeof id]]++;
        }
      });
    });

    return stats;
  }, [reports, filteredStudents, monthStart, monthEnd]);

  const attendanceStats = useMemo(() => {
    const stats = {
      eveningStudy: { total: 0, present: 0, absent: 0 },
      boarding: { total: 0, present: 0, absent: 0 },
    };

    const monthReports = reports.filter((r) => {
      const reportDate = new Date(r.date);
      return isWithinInterval(reportDate, { start: monthStart, end: monthEnd });
    });

    monthReports.forEach((report) => {
      if (report.type === 'evening_study') {
        stats.eveningStudy.total += report.totalStudents;
        stats.eveningStudy.present += report.presentCount;
        stats.eveningStudy.absent += report.absentCount;
      } else if (report.type === 'boarding') {
        stats.boarding.total += report.totalStudents;
        stats.boarding.present += report.presentCount;
        stats.boarding.absent += report.absentCount;
      }
    });

    return stats;
  }, [reports, monthStart, monthEnd]);

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || classId;
  };

  const exportMealReport = () => {
    let csv = '\ufeff'; // BOM for UTF-8
    csv += `Báo cáo bữa ăn tháng ${format(monthStart, 'MM/yyyy')}\n\n`;
    csv += 'STT,Họ tên,Lớp,Phòng,Mâm ăn,';
    
    daysInMonth.forEach((day) => {
      csv += `${format(day, 'dd')},`;
    });
    csv += 'Tổng sáng,Tổng trưa,Tổng tối,Tổng gạo (kg)\n';

    filteredStudents.forEach((student, index) => {
      const meals = mealStats[student.id] || { breakfast: 0, lunch: 0, dinner: 0 };
      const riceKg = (meals.lunch + meals.dinner) * 0.2;
      
      csv += `${index + 1},${student.name},${getClassName(student.classId)},${student.room},${student.mealGroup},`;
      
      daysInMonth.forEach(() => csv += ',');
      
      csv += `${meals.breakfast},${meals.lunch},${meals.dinner},${riceKg.toFixed(1)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao_cao_bua_an_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Xuất báo cáo thành công',
      description: 'File báo cáo bữa ăn đã được tải xuống',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          Thống kê tổng hợp
        </h1>
        <p className="text-muted-foreground mt-1">
          Xem thống kê điểm danh và bữa ăn theo tháng
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lớp</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      Lớp {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Điểm danh tự học</p>
                <p className="text-xl font-bold text-foreground">
                  {attendanceStats.eveningStudy.present}/{attendanceStats.eveningStudy.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Điểm danh nội trú</p>
                <p className="text-xl font-bold text-foreground">
                  {attendanceStats.boarding.present}/{attendanceStats.boarding.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Utensils className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng bữa ăn</p>
                <p className="text-xl font-bold text-foreground">
                  {Object.values(mealStats).reduce(
                    (sum, m) => sum + m.breakfast + m.lunch + m.dinner,
                    0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <BarChart3 className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng gạo (kg)</p>
                <p className="text-xl font-bold text-foreground">
                  {(Object.values(mealStats).reduce(
                    (sum, m) => sum + (m.lunch + m.dinner) * 0.2,
                    0
                  )).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meal Report Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Báo cáo bữa ăn theo học sinh - Tháng {format(monthStart, 'MM/yyyy', { locale: vi })}
            </CardTitle>
            <Button onClick={exportMealReport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center sticky left-0 bg-muted/50">STT</TableHead>
                  <TableHead className="min-w-[150px] sticky left-12 bg-muted/50">Họ tên</TableHead>
                  <TableHead className="w-16">Lớp</TableHead>
                  <TableHead className="w-16">Phòng</TableHead>
                  <TableHead className="text-center">Bữa sáng</TableHead>
                  <TableHead className="text-center">Bữa trưa</TableHead>
                  <TableHead className="text-center">Bữa tối</TableHead>
                  <TableHead className="text-center">Gạo (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => {
                  const meals = mealStats[student.id] || { breakfast: 0, lunch: 0, dinner: 0 };
                  const riceKg = (meals.lunch + meals.dinner) * 0.2;
                  
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/30">
                      <TableCell className="text-center font-medium sticky left-0 bg-card">{index + 1}</TableCell>
                      <TableCell className="font-medium sticky left-12 bg-card">{student.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {getClassName(student.classId)}
                        </span>
                      </TableCell>
                      <TableCell>{student.room}</TableCell>
                      <TableCell className="text-center">{meals.breakfast}</TableCell>
                      <TableCell className="text-center">{meals.lunch}</TableCell>
                      <TableCell className="text-center">{meals.dinner}</TableCell>
                      <TableCell className="text-center font-medium text-accent">{riceKg.toFixed(1)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredStudents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>Không có dữ liệu học sinh</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
