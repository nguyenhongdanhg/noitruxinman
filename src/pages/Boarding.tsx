import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompactAttendanceForm } from '@/components/attendance/CompactAttendanceForm';
import { ReportHistory } from '@/components/reports/ReportHistory';
import { Home, FileText } from 'lucide-react';

export default function Boarding() {
  return (
    <div className="space-y-4 animate-fade-in">
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
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="attendance" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Điểm danh
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 py-2 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-3">
          <CompactAttendanceForm type="boarding" title="Điểm danh nội trú" />
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <ReportHistory type="boarding" title="Điểm danh nội trú" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
