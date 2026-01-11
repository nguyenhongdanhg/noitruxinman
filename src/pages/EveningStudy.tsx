import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { ReportHistory } from '@/components/reports/ReportHistory';
import { BookOpen, FileText } from 'lucide-react';

export default function EveningStudy() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          Điểm danh giờ tự học buổi tối
        </h1>
        <p className="text-muted-foreground mt-1">
          Báo cáo sỹ số học sinh tự học buổi tối
        </p>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="attendance" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Điểm danh
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" />
            Lịch sử & Thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceForm type="evening_study" title="Điểm danh tự học" />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ReportHistory type="evening_study" title="Điểm danh tự học" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
