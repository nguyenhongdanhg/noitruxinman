import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { ReportHistory } from '@/components/reports/ReportHistory';
import { Home, FileText } from 'lucide-react';

export default function Boarding() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Home className="h-7 w-7 text-primary" />
          Điểm danh nội trú
        </h1>
        <p className="text-muted-foreground mt-1">
          Báo cáo sỹ số nội trú theo các buổi trong ngày
        </p>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="attendance" className="gap-2">
            <Home className="h-4 w-4" />
            Điểm danh
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" />
            Lịch sử & Thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceForm type="boarding" title="Điểm danh nội trú" />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ReportHistory type="boarding" title="Điểm danh nội trú" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
