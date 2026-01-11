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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Utensils className="h-7 w-7 text-primary" />
          Báo cáo bữa ăn
        </h1>
        <p className="text-muted-foreground mt-1">
          Đăng ký và quản lý bữa ăn cho học sinh nội trú
        </p>
      </div>

      {/* Role Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Quyền truy cập</h3>
          </div>
          {isAdmin ? (
            <p className="text-sm text-muted-foreground">
              Bạn là <strong>Quản trị viên</strong> - có thể báo cơm cho tất cả các lớp.
            </p>
          ) : isClassTeacher && teacherClassName ? (
            <p className="text-sm text-muted-foreground">
              Bạn là <strong>Giáo viên chủ nhiệm lớp {teacherClassName}</strong> - chỉ có thể báo cơm cho lớp của mình.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vui lòng liên hệ quản trị viên để được phân quyền.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deadline Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Thời hạn đăng ký bữa ăn</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mealDeadlines.map((item) => (
              <div
                key={item.meal}
                className={`p-4 rounded-lg border ${
                  item.canRegister
                    ? 'bg-success/5 border-success/20'
                    : 'bg-destructive/5 border-destructive/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{item.meal}</span>
                  {item.canRegister ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                      Có thể đăng ký
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                      Đã hết hạn
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{item.deadline}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong>Lưu ý:</strong> Mỗi bữa ăn trưa và tối tính 0.2kg gạo/học sinh. Bữa sáng không tính gạo.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="attendance" className="gap-2">
            <Utensils className="h-4 w-4" />
            Đăng ký bữa ăn
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" />
            Lịch sử & Thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceForm 
            type="meal" 
            title="Đăng ký bữa ăn" 
            filterClassId={isAdmin ? undefined : teacherClassId || undefined}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ReportHistory type="meal" title="Báo cáo bữa ăn" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
