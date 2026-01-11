import { useApp } from '@/contexts/AppContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, Home, Utensils, BookOpen, TrendingUp, Calendar, School } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function Dashboard() {
  const { students, teachers, classes, reports, schoolInfo } = useApp();

  const todayReports = reports.filter(
    (r) => format(new Date(r.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const eveningStudyToday = todayReports.find((r) => r.type === 'evening_study');
  const boardingToday = todayReports.filter((r) => r.type === 'boarding');
  const mealToday = todayReports.filter((r) => r.type === 'meal');

  const classStats = classes.map((c) => ({
    ...c,
    studentCount: students.filter((s) => s.classId === c.id).length,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="rounded-2xl gradient-primary p-6 text-primary-foreground shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-5 -bottom-5 h-24 w-24 rounded-full bg-white/5" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <School className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{schoolInfo.name}</h1>
              <p className="text-primary-foreground/80">Hệ thống quản lý học sinh nội trú</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-primary-foreground/70">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), "EEEE, 'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng số học sinh"
          value={students.length}
          subtitle={`${classes.length} lớp`}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Giáo viên"
          value={teachers.length}
          subtitle="Đang hoạt động"
          icon={GraduationCap}
          variant="accent"
        />
        <StatCard
          title="Điểm danh tự học hôm nay"
          value={eveningStudyToday ? `${eveningStudyToday.presentCount}/${eveningStudyToday.totalStudents}` : 'Chưa có'}
          subtitle={eveningStudyToday ? `Vắng: ${eveningStudyToday.absentCount}` : 'Chưa điểm danh'}
          icon={BookOpen}
          variant="success"
        />
        <StatCard
          title="Điểm danh nội trú"
          value={boardingToday.length}
          subtitle="Báo cáo hôm nay"
          icon={Home}
        />
      </div>

      {/* Class Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Thống kê theo lớp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {classStats.map((classInfo, index) => (
              <div
                key={classInfo.id}
                className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-primary">Lớp {classInfo.name}</span>
                  <span className="text-xs text-muted-foreground">Khối {classInfo.grade}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{classInfo.studentCount}</p>
                <p className="text-sm text-muted-foreground">học sinh</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Reports Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Báo cáo nội trú hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            {boardingToday.length > 0 ? (
              <div className="space-y-3">
                {boardingToday.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">
                        {report.session === 'morning_exercise' && 'Thể dục sáng'}
                        {report.session === 'noon_nap' && 'Ngủ trưa'}
                        {report.session === 'evening_sleep' && 'Ngủ tối'}
                        {report.session === 'random' && 'Đột xuất'}
                      </p>
                      <p className="text-sm text-muted-foreground">Báo cáo bởi: {report.reporterName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">{report.presentCount}/{report.totalStudents}</p>
                      <p className="text-sm text-destructive">Vắng: {report.absentCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Home className="h-10 w-10 mb-2 opacity-50" />
                <p>Chưa có báo cáo nội trú hôm nay</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Báo cáo bữa ăn hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mealToday.length > 0 ? (
              <div className="space-y-3">
                {mealToday.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">
                        {report.mealType === 'breakfast' && 'Bữa sáng'}
                        {report.mealType === 'lunch' && 'Bữa trưa'}
                        {report.mealType === 'dinner' && 'Bữa tối'}
                      </p>
                      <p className="text-sm text-muted-foreground">Báo cáo bởi: {report.reporterName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">{report.presentCount}</p>
                      <p className="text-sm text-muted-foreground">học sinh đăng ký</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Utensils className="h-10 w-10 mb-2 opacity-50" />
                <p>Chưa có báo cáo bữa ăn hôm nay</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Credit */}
      <div className="text-center py-4 border-t">
        <p className="text-sm text-muted-foreground">
          Thiết kế bởi <span className="font-medium text-primary">Thầy giáo Nguyễn Hồng Dân</span> - Zalo: <span className="font-medium">0888 770 699</span>
        </p>
      </div>
    </div>
  );
}
