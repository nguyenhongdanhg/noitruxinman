import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { ReportHistory } from '@/components/reports/ReportHistory';
import { ReportImageExport } from '@/components/reports/ReportImageExport';
import { Home, FileText, Image, Calendar } from 'lucide-react';
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
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function Boarding() {
  const { reports } = useApp();
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedReportId, setSelectedReportId] = useState<string>('');

  const getSessionLabel = (session?: string) => {
    const labels: Record<string, string> = {
      morning_exercise: 'Thể dục sáng',
      noon_nap: 'Ngủ trưa',
      evening_sleep: 'Ngủ tối',
      random: 'Đột xuất',
    };
    return session ? labels[session] || session : '';
  };

  // Filter reports for boarding
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.type !== 'boarding') return false;

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
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, dateFilter, selectedDate]);

  const selectedReport = useMemo(() => {
    return filteredReports.find(r => r.id === selectedReportId);
  }, [filteredReports, selectedReportId]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Home className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          Điểm danh nội trú
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Báo cáo sỹ số nội trú theo các buổi
        </p>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="attendance" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Điểm danh</span>
            <span className="sm:hidden">Điểm danh</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 py-2 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Lịch sử</span>
            <span className="sm:hidden">Lịch sử</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Xuất ảnh</span>
            <span className="sm:hidden">Xuất ảnh</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4 sm:mt-6">
          <AttendanceForm type="boarding" title="Điểm danh nội trú" />
        </TabsContent>

        <TabsContent value="history" className="mt-4 sm:mt-6">
          <ReportHistory type="boarding" title="Điểm danh nội trú" />
        </TabsContent>

        <TabsContent value="export" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Xuất ảnh báo cáo điểm danh nội trú
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
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

                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />

                {filteredReports.length > 0 && (
                  <Select value={selectedReportId} onValueChange={setSelectedReportId}>
                    <SelectTrigger className="w-72">
                      <SelectValue placeholder="Chọn báo cáo để xuất ảnh" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredReports.map((report) => (
                        <SelectItem key={report.id} value={report.id}>
                          {format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })} - {getSessionLabel(report.session)} ({report.presentCount}/{report.totalStudents})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Report preview and export */}
              {selectedReport ? (
                <ReportImageExport report={selectedReport} type="boarding" />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mb-4 opacity-50" />
                  {filteredReports.length === 0 ? (
                    <p>Không có báo cáo nào trong khoảng thời gian này</p>
                  ) : (
                    <p>Vui lòng chọn báo cáo để xuất ảnh</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
