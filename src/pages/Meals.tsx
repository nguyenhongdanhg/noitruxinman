import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { ReportHistory } from '@/components/reports/ReportHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, FileText, Clock, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { classes } from '@/data/mockData';

export default function Meals() {
  const { profile, hasRole } = useAuth();
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

      {/* Role Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 sm:pt-6">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h3 className="font-semibold text-sm sm:text-base text-foreground">Quyền truy cập</h3>
          </div>
          {isAdmin ? (
            <p className="text-xs sm:text-sm text-muted-foreground">
              Bạn là <strong>Quản trị viên</strong> - có thể báo cơm cho tất cả các lớp.
            </p>
          ) : isClassTeacher && teacherClassName ? (
            <p className="text-xs sm:text-sm text-muted-foreground">
              Bạn là <strong>GVCN lớp {teacherClassName}</strong> - chỉ có thể báo cơm cho lớp của mình.
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">
              Vui lòng liên hệ quản trị viên để được phân quyền.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deadline Info */}
      <Card>
        <CardContent className="py-3 sm:pt-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h3 className="font-semibold text-sm sm:text-base text-foreground">Thời hạn đăng ký</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            {mealDeadlines.map((item) => (
              <div
                key={item.meal}
                className={`p-2.5 sm:p-4 rounded-lg border ${
                  item.canRegister
                    ? 'bg-success/5 border-success/20'
                    : 'bg-destructive/5 border-destructive/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="font-medium text-sm sm:text-base text-foreground">{item.meal}</span>
                  {item.canRegister ? (
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-success/10 text-success">
                      Đăng ký được
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-destructive/10 text-destructive">
                      Hết hạn
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">{item.deadline}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg bg-muted/50 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              <strong>Lưu ý:</strong> Mỗi bữa ăn trưa và tối tính 0.2kg gạo/HS.
            </p>
          </div>
        </CardContent>
      </Card>

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

        <TabsContent value="attendance" className="mt-4 sm:mt-6">
          <AttendanceForm 
            type="meal" 
            title="Đăng ký bữa ăn" 
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
