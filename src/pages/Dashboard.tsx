import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, GraduationCap, Home, Utensils, BookOpen, Calendar, School, 
  CheckCircle2, Clock, AlertCircle, TrendingUp, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { MealReportReminder } from '@/components/meals/MealReportReminder';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { students, teachers, classes, reports, schoolInfo } = useApp();

  const todayReports = reports.filter(
    (r) => format(new Date(r.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  // Get latest reports for each type (school-wide)
  const latestStats = useMemo(() => {
    const eveningStudyReports = reports.filter(r => r.type === 'evening_study').sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestEveningStudy = eveningStudyReports[0];

    const boardingReports = reports.filter(r => r.type === 'boarding').sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestBoardingSessions: Record<string, typeof boardingReports[0]> = {};
    boardingReports.forEach(r => {
      if (r.session && !latestBoardingSessions[r.session]) {
        latestBoardingSessions[r.session] = r;
      }
    });

    const mealReports = reports.filter(r => r.type === 'meal').sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestMeals: Record<string, typeof mealReports[0]> = {};
    mealReports.forEach(r => {
      if (r.mealType && !latestMeals[r.mealType]) {
        latestMeals[r.mealType] = r;
      }
    });

    return {
      eveningStudy: latestEveningStudy,
      boarding: latestBoardingSessions,
      meals: latestMeals
    };
  }, [reports]);

  // Today's completion status
  const todayCompletion = useMemo(() => {
    const eveningStudyDone = todayReports.some(r => r.type === 'evening_study');
    
    const boardingSessions = ['morning_exercise', 'noon_nap', 'evening_sleep'];
    const boardingDone = boardingSessions.map(session => ({
      session,
      done: todayReports.some(r => r.type === 'boarding' && r.session === session)
    }));
    
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    const mealsDone = mealTypes.map(mealType => ({
      mealType,
      done: todayReports.some(r => r.type === 'meal' && r.mealType === mealType)
    }));

    const totalTasks = 1 + boardingSessions.length + mealTypes.length;
    const completedTasks = (eveningStudyDone ? 1 : 0) + 
      boardingDone.filter(b => b.done).length + 
      mealsDone.filter(m => m.done).length;

    return {
      eveningStudyDone,
      boardingDone,
      mealsDone,
      totalTasks,
      completedTasks,
      percentage: Math.round((completedTasks / totalTasks) * 100)
    };
  }, [todayReports]);

  // Class statistics sorted by grade
  const classStats = useMemo(() => {
    return classes
      .map((c) => ({
        ...c,
        studentCount: students.filter((s) => s.classId === c.id).length,
        boardingCount: students.filter((s) => s.classId === c.id && s.room).length,
      }))
      .sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.name.localeCompare(b.name);
      });
  }, [classes, students]);

  // Group by grade
  const statsByGrade = useMemo(() => {
    const result: Record<number, { students: number; boarding: number }> = {};
    classStats.forEach(c => {
      if (!result[c.grade]) result[c.grade] = { students: 0, boarding: 0 };
      result[c.grade].students += c.studentCount;
      result[c.grade].boarding += c.boardingCount;
    });
    return result;
  }, [classStats]);

  const getSessionLabel = (session: string) => {
    switch (session) {
      case 'morning_exercise': return 'Thể dục';
      case 'noon_nap': return 'Ngủ trưa';
      case 'evening_sleep': return 'Ngủ tối';
      default: return session;
    }
  };

  const getMealLabel = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'Sáng';
      case 'lunch': return 'Trưa';
      case 'dinner': return 'Tối';
      default: return mealType;
    }
  };

  // Quick action items
  const quickActions = [
    { label: 'Điểm danh nội trú', icon: Home, href: '/boarding', color: 'text-blue-600 bg-blue-100' },
    { label: 'Điểm danh giờ học', icon: BookOpen, href: '/evening-study', color: 'text-purple-600 bg-purple-100' },
    { label: 'Báo cáo bữa ăn', icon: Utensils, href: '/meals', color: 'text-orange-600 bg-orange-100' },
    { label: 'Xem thống kê', icon: TrendingUp, href: '/statistics', color: 'text-green-600 bg-green-100' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Meal Report Reminder for Class Teachers */}
      <MealReportReminder />

      {/* Compact Header */}
      <div className="rounded-xl gradient-primary p-4 text-primary-foreground shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <School className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{schoolInfo.name}</h1>
              <div className="flex items-center gap-1.5 text-primary-foreground/80 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}</span>
              </div>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="text-right">
            <div className="text-2xl font-bold">{todayCompletion.percentage}%</div>
            <div className="text-xs text-primary-foreground/70">hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Compact Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card rounded-lg p-3 text-center shadow-sm border">
          <Users className="h-5 w-5 mx-auto text-primary mb-1" />
          <div className="text-xl font-bold">{students.length}</div>
          <div className="text-[10px] text-muted-foreground">Học sinh</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center shadow-sm border">
          <Home className="h-5 w-5 mx-auto text-green-600 mb-1" />
          <div className="text-xl font-bold">{students.filter(s => s.room).length}</div>
          <div className="text-[10px] text-muted-foreground">Nội trú</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center shadow-sm border">
          <GraduationCap className="h-5 w-5 mx-auto text-accent mb-1" />
          <div className="text-xl font-bold">{teachers.length}</div>
          <div className="text-[10px] text-muted-foreground">Giáo viên</div>
        </div>
        <div className="bg-card rounded-lg p-3 text-center shadow-sm border">
          <School className="h-5 w-5 mx-auto text-purple-600 mb-1" />
          <div className="text-xl font-bold">{classes.length}</div>
          <div className="text-[10px] text-muted-foreground">Lớp học</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickActions.map(action => (
          <Link 
            key={action.href}
            to={action.href}
            className="flex items-center gap-2 bg-card rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", action.color)}>
              <action.icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium flex-1">{action.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Today's Progress - Compact */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Tiến độ hôm nay</span>
            </div>
            <Badge variant={todayCompletion.percentage === 100 ? "default" : "secondary"} className="text-xs">
              {todayCompletion.completedTasks}/{todayCompletion.totalTasks}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <Progress value={todayCompletion.percentage} className="h-1.5 mb-3" />
          
          <div className="grid grid-cols-3 gap-3">
            {/* Meals */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Utensils className="h-3.5 w-3.5 text-orange-500" />
                <span>Bữa ăn</span>
              </div>
              <div className="flex gap-1">
                {todayCompletion.mealsDone.map(({ mealType, done }) => (
                  <div 
                    key={mealType}
                    className={cn(
                      "flex-1 text-center py-1 px-1.5 rounded text-[10px] font-medium",
                      done ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {getMealLabel(mealType)}
                  </div>
                ))}
              </div>
            </div>

            {/* Boarding */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Home className="h-3.5 w-3.5 text-blue-500" />
                <span>Nội trú</span>
              </div>
              <div className="flex gap-1">
                {todayCompletion.boardingDone.map(({ session, done }) => (
                  <div 
                    key={session}
                    className={cn(
                      "flex-1 text-center py-1 px-0.5 rounded text-[10px] font-medium truncate",
                      done ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {getSessionLabel(session)}
                  </div>
                ))}
              </div>
            </div>

            {/* Evening Study */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-purple-500" />
                <span>Tự học</span>
              </div>
              <div 
                className={cn(
                  "text-center py-1 rounded text-[10px] font-medium",
                  todayCompletion.eveningStudyDone ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                )}
              >
                {todayCompletion.eveningStudyDone ? (
                  <span className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Đã điểm
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Chưa điểm
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview - Compact 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Meals & Boarding Combined */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Utensils className="h-4 w-4 text-orange-500" />
              Bữa ăn hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="grid grid-cols-3 gap-2">
              {['breakfast', 'lunch', 'dinner'].map(mealType => {
                const report = latestStats.meals[mealType];
                const isToday = report && format(new Date(report.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div 
                    key={mealType} 
                    className={cn(
                      "p-2 rounded-lg text-center",
                      isToday ? "bg-green-50 border border-green-200" : "bg-muted/50"
                    )}
                  >
                    <div className="text-xs text-muted-foreground mb-0.5">{getMealLabel(mealType)}</div>
                    {report && isToday ? (
                      <>
                        <div className="text-lg font-bold text-green-600">{report.presentCount}</div>
                        <div className="text-[10px] text-muted-foreground">/ {report.totalStudents}</div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground py-2">--</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Boarding Stats */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-blue-500" />
              Nội trú gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="grid grid-cols-3 gap-2">
              {['morning_exercise', 'noon_nap', 'evening_sleep'].map(session => {
                const report = latestStats.boarding[session];
                const percentage = report ? Math.round((report.presentCount / report.totalStudents) * 100) : 0;
                return (
                  <div key={session} className="p-2 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-0.5">{getSessionLabel(session)}</div>
                    {report ? (
                      <>
                        <div className="text-lg font-bold text-blue-600">{percentage}%</div>
                        <div className="text-[10px] text-muted-foreground">
                          {report.presentCount}/{report.totalStudents}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground py-2">--</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Stats by Grade - Compact Table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            Thống kê theo khối
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-1">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.entries(statsByGrade)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([grade, stats]) => (
                <div key={grade} className="bg-muted/50 rounded-lg p-2 text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Khối {grade}</div>
                  <div className="text-lg font-bold">{stats.students}</div>
                  <div className="text-[10px] text-green-600">{stats.boarding} nội trú</div>
                </div>
              ))}
          </div>
          
          {/* Summary row */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Tổng cộng</div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-bold text-primary">{students.length}</span>
                <span className="text-muted-foreground"> học sinh</span>
              </div>
              <div className="text-sm">
                <span className="font-bold text-green-600">{students.filter(s => s.room).length}</span>
                <span className="text-muted-foreground"> nội trú</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evening Study - Compact */}
      {latestStats.eveningStudy && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                Tự học tối gần nhất
              </div>
              <span className="text-xs font-normal text-muted-foreground">
                {format(new Date(latestStats.eveningStudy.date), 'dd/MM/yyyy')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress 
                  value={(latestStats.eveningStudy.presentCount / latestStats.eveningStudy.totalStudents) * 100} 
                  className="h-2"
                />
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-600">{latestStats.eveningStudy.presentCount}</span>
                <span className="text-muted-foreground">/{latestStats.eveningStudy.totalStudents}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Vắng: {latestStats.eveningStudy.absentCount}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Credit */}
      <div className="text-center py-3 border-t">
        <p className="text-xs text-muted-foreground">
          Thiết kế bởi <span className="font-medium text-primary">Thầy giáo Nguyễn Hồng Dân</span> - Zalo: 0888 770 699
        </p>
      </div>
    </div>
  );
}
