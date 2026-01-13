import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Report } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Download, FileText, Calendar, Filter, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

interface ReportHistoryProps {
  type: 'evening_study' | 'boarding' | 'meal';
  title: string;
}

export function ReportHistory({ type, title }: ReportHistoryProps) {
  const { reports, classes, students, setReports } = useApp();
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filteredReports = reports.filter((report) => {
    if (report.type !== type) return false;

    const reportDate = new Date(report.date);
    const filterDate = new Date(selectedDate);

    switch (dateFilter) {
      case 'day':
        return format(reportDate, 'yyyy-MM-dd') === selectedDate;
      case 'week':
        return isWithinInterval(reportDate, {
          start: startOfWeek(filterDate, { weekStartsOn: 1 }),
          end: endOfWeek(filterDate, { weekStartsOn: 1 }),
        });
      case 'month':
        return isWithinInterval(reportDate, {
          start: startOfMonth(filterDate),
          end: endOfMonth(filterDate),
        });
      default:
        return true;
    }
  });

  const getSessionLabel = (session?: string) => {
    const labels: Record<string, string> = {
      morning_exercise: 'Thể dục sáng',
      noon_nap: 'Ngủ trưa',
      evening_sleep: 'Ngủ tối',
      random: 'Đột xuất',
    };
    return session ? labels[session] || session : '';
  };

  const getMealLabel = (mealType?: string) => {
    const labels: Record<string, string> = {
      breakfast: 'Bữa sáng',
      lunch: 'Bữa trưa',
      dinner: 'Bữa tối',
    };
    return mealType ? labels[mealType] || mealType : '';
  };

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || classId;
  };

  const exportToCSV = () => {
    if (filteredReports.length === 0) {
      toast({
        title: 'Không có dữ liệu',
        description: 'Không có báo cáo nào trong khoảng thời gian này',
        variant: 'destructive',
      });
      return;
    }

    let csv = '\ufeff'; // BOM for UTF-8
    
    if (type === 'meal') {
      // Export detailed meal report
      csv += 'STT,Họ tên,Lớp,';
      
      // Get unique dates
      const dates = [...new Set(filteredReports.map(r => r.date))].sort();
      dates.forEach(date => {
        csv += `${format(new Date(date), 'dd/MM')},`;
      });
      csv += 'Tổng bữa sáng,Tổng bữa trưa,Tổng bữa tối,Tổng gạo (kg)\n';

      // Calculate per student
      const studentMeals: Record<string, { breakfast: number; lunch: number; dinner: number }> = {};
      
      students.forEach(student => {
        studentMeals[student.id] = { breakfast: 0, lunch: 0, dinner: 0 };
      });

      filteredReports.forEach(report => {
        const presentIds = new Set(
          students.map(s => s.id).filter(id => 
            !report.absentStudents.some(as => as.studentId === id)
          )
        );
        
        presentIds.forEach(id => {
          if (studentMeals[id] && report.mealType) {
            studentMeals[id][report.mealType as keyof typeof studentMeals[typeof id]]++;
          }
        });
      });

      students.forEach((student, index) => {
        const meals = studentMeals[student.id];
        const riceKg = (meals.lunch + meals.dinner) * 0.2;
        csv += `${index + 1},${student.name},${getClassName(student.classId)},`;
        
        dates.forEach(() => csv += ','); // Placeholder for daily data
        
        csv += `${meals.breakfast},${meals.lunch},${meals.dinner},${riceKg.toFixed(1)}\n`;
      });
    } else {
      csv += 'Ngày,Buổi,Tổng số,Có mặt,Vắng,Người báo cáo,Thời gian báo cáo\n';
      
      filteredReports.forEach(report => {
        const sessionLabel = type === 'boarding' ? getSessionLabel(report.session) : '';
        csv += `${format(new Date(report.date), 'dd/MM/yyyy')},`;
        csv += `${sessionLabel},`;
        csv += `${report.totalStudents},`;
        csv += `${report.presentCount},`;
        csv += `${report.absentCount},`;
        csv += `${report.reporterName},`;
        csv += `${format(new Date(report.createdAt), 'HH:mm dd/MM/yyyy')}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao_cao_${type}_${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Xuất báo cáo thành công',
      description: 'File báo cáo đã được tải xuống',
    });
  };

  const handleDeleteAllReports = () => {
    const remainingReports = reports.filter(r => r.type !== type);
    setReports(remainingReports);
    toast({
      title: 'Xóa thành công',
      description: `Đã xóa tất cả báo cáo ${title}`,
    });
  };

  const reportsByType = reports.filter(r => r.type === type);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Lịch sử báo cáo {title}
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Theo ngày</SelectItem>
                  <SelectItem value="week">Theo tuần</SelectItem>
                  <SelectItem value="month">Theo tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>

            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </Button>
            
            {reportsByType.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Xóa tất cả
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa tất cả báo cáo {title}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc muốn xóa tất cả {reportsByType.length} báo cáo? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllReports} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Xóa tất cả
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredReports.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Ngày</TableHead>
                  {type === 'boarding' && <TableHead>Buổi</TableHead>}
                  {type === 'meal' && <TableHead>Bữa ăn</TableHead>}
                  <TableHead className="text-center">Tổng số</TableHead>
                  <TableHead className="text-center">Có mặt</TableHead>
                  <TableHead className="text-center">Vắng</TableHead>
                  <TableHead>Người báo cáo</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })}
                    </TableCell>
                    {type === 'boarding' && (
                      <TableCell>{getSessionLabel(report.session)}</TableCell>
                    )}
                    {type === 'meal' && (
                      <TableCell>{getMealLabel(report.mealType)}</TableCell>
                    )}
                    <TableCell className="text-center">{report.totalStudents}</TableCell>
                    <TableCell className="text-center text-success font-medium">
                      {report.presentCount}
                    </TableCell>
                    <TableCell className="text-center text-destructive font-medium">
                      {report.absentCount}
                    </TableCell>
                    <TableCell>{report.reporterName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(report.createdAt), 'HH:mm', { locale: vi })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p>Không có báo cáo nào trong khoảng thời gian này</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
