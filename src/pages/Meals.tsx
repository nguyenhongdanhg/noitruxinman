import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompactMealForm } from '@/components/attendance/CompactMealForm';
import { ReportHistory } from '@/components/reports/ReportHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, FileText, Clock, AlertCircle, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { classes } from '@/data/mockData';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Meals() {
  const { profile, hasRole } = useAuth();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const now = new Date();
  const currentHour = now.getHours();
  
  const isAdmin = hasRole('admin');
  const isClassTeacher = hasRole('class_teacher');
  const teacherClassId = profile?.class_id;
  const teacherClassName = teacherClassId 
    ? classes.find(c => c.id === teacherClassId)?.name 
    : null;

  const mealDeadlines = [
    { meal: 'Bữa sáng', deadline: 'Trước 22:00 ngày hôm trước', canRegister: currentHour < 22 },
    { meal: 'Bữa trưa', deadline: 'Trước 08:00 cùng ngày', canRegister: currentHour < 8 },
    { meal: 'Bữa tối', deadline: 'Trước 15:00 cùng ngày', canRegister: currentHour < 15 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Utensils className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          Báo cáo bữa ăn
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Đăng ký và quản lý bữa ăn cho học sinh nội trú
        </p>
      </div>

      {/* Collapsible Info Section */}
      <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <Card className="border-primary/20 bg-primary/5">
          <CollapsibleTrigger asChild>
            <CardContent className="py-2 cursor-pointer hover:bg-primary/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">
                    {isAdmin ? 'Quản trị viên' : isClassTeacher && teacherClassName ? `GVCN lớp ${teacherClassName}` : 'Chưa phân quyền'}
                  </span>
                  <span className="text-muted-foreground text-xs">• Nhấn để xem chi tiết</span>
                </div>
                {isInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-3">
              {/* Deadline Info */}
              <div className="mt-2 pt-2 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-sm text-foreground">Thời hạn đăng ký</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {mealDeadlines.map((item) => (
                    <div
                      key={item.meal}
                      className={`p-2 rounded-lg border text-center ${
                        item.canRegister
                          ? 'bg-success/5 border-success/20'
                          : 'bg-destructive/5 border-destructive/20'
                      }`}
                    >
                      <span className="font-medium text-xs">{item.meal}</span>
                      <span className={`ml-1 text-[10px] ${item.canRegister ? 'text-success' : 'text-destructive'}`}>
                        {item.canRegister ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Mỗi bữa trưa/tối tính 0.2kg gạo/HS
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="attendance" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Đăng ký bữa ăn</span>
            <span className="sm:hidden">Đăng ký</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 py-2 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Lịch sử & Thống kê</span>
            <span className="sm:hidden">Lịch sử</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-3">
          <CompactMealForm 
            filterClassId={isAdmin ? undefined : teacherClassId || undefined}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4 sm:mt-6">
          <ReportHistory 
            type="meal" 
            title="Báo cáo bữa ăn" 
            filterClassId={isAdmin ? undefined : teacherClassId || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
