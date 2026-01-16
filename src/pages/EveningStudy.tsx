import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { ReportHistory } from '@/components/reports/ReportHistory';
import { ReportImageExport } from '@/components/reports/ReportImageExport';
import { BookOpen, FileText, Image, Calendar } from 'lucide-react';
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

export default function EveningStudy() {
  const { reports } = useApp();
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedReportId, setSelectedReportId] = useState<string>('');

  // Filter reports for evening study
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.type !== 'evening_study') return false;

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
          <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          Điểm danh tự học tối
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Báo cáo sỹ số học sinh tự học buổi tối
        </p>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="attendance" className="gap-1.5 py-2 text-xs sm:text-sm">
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
          <AttendanceForm type="evening_study" title="Điểm danh tự học" />
        </TabsContent>

        <TabsContent value="history" className="mt-4 sm:mt-6">
          <ReportHistory type="evening_study" title="Điểm danh tự học" />
        </TabsContent>

        <TabsContent value="export" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Xuất ảnh báo cáo điểm danh tự học
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
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Chọn báo cáo để xuất ảnh" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredReports.map((report) => (
                        <SelectItem key={report.id} value={report.id}>
                          {format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })} - {report.presentCount}/{report.totalStudents} có mặt
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Report preview and export */}
              {selectedReport ? (
                <ReportImageExport report={selectedReport} type="study" />
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
