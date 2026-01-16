import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, GraduationCap, Home, Utensils, BookOpen, Calendar, School, 
  CheckCircle2, Clock, AlertCircle, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MealReportReminder } from '@/components/meals/MealReportReminder';

export default function Dashboard() {
  const { students, teachers, classes, reports, schoolInfo } = useApp();

  const todayReports = reports.filter(
    (r) => format(new Date(r.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  // Get latest reports for each type (school-wide)
  const latestStats = useMemo(() => {
    // Evening study - latest report
    const eveningStudyReports = reports.filter(r => r.type === 'evening_study').sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestEveningStudy = eveningStudyReports[0];

    // Boarding - latest reports by session
    const boardingReports = reports.filter(r => r.type === 'boarding').sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestBoardingSessions: Record<string, typeof boardingReports[0]> = {};
    boardingReports.forEach(r => {
      if (r.session && !latestBoardingSessions[r.session]) {
        latestBoardingSessions[r.session] = r;
      }
    });

    // Meals - latest reports by meal type
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

  // Group classes by grade for table display
  const classesByGrade = useMemo(() => {
    const grades: Record<number, typeof classStats> = {};
    classStats.forEach(c => {
      if (!grades[c.grade]) grades[c.grade] = [];
      grades[c.grade].push(c);
    });
    return grades;
  }, [classStats]);

  const getSessionLabel = (session: string) => {
    switch (session) {
      case 'morning_exercise': return 'Thể dục sáng';
      case 'noon_nap': return 'Ngủ trưa';
      case 'evening_sleep': return 'Ngủ tối';
      default: return session;
    }
  };

  const getMealLabel = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'Bữa sáng';
      case 'lunch': return 'Bữa trưa';
      case 'dinner': return 'Bữa tối';
      default: return mealType;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Meal Report Reminder for Class Teachers */}
      <MealReportReminder />

      {/* Welcome Banner */}
      <div className="rounded-2xl gradient-primary p-4 sm:p-6 text-primary-foreground shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-5 -bottom-5 h-24 w-24 rounded-full bg-white/5" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20">
              <School className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{schoolInfo.name}</h1>
              <p className="text-primary-foreground/80 text-sm">Hệ thống quản lý học sinh nội trú</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), "EEEE, 'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi })}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-xs text-muted-foreground">Học sinh</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <GraduationCap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teachers.length}</p>
                <p className="text-xs text-muted-foreground">Giáo viên</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Home className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.filter(s => s.room).length}</p>
                <p className="text-xs text-muted-foreground">Nội trú</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-xs text-muted-foreground">Lớp học</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Tiến độ hôm nay</span>
            </div>
            <Badge variant={todayCompletion.percentage === 100 ? "default" : "secondary"}>
              {todayCompletion.completedTasks}/{todayCompletion.totalTasks} hoàn thành
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tổng tiến độ</span>
              <span className="font-medium">{todayCompletion.percentage}%</span>
            </div>
            <Progress value={todayCompletion.percentage} className="h-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Meals Progress */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Utensils className="h-4 w-4 text-orange-500" />
                <span>Bữa ăn</span>
              </div>
              <div className="space-y-1.5">
                {todayCompletion.mealsDone.map(({ mealType, done }) => (
                  <div key={mealType} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{getMealLabel(mealType)}</span>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Boarding Progress */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Home className="h-4 w-4 text-blue-500" />
                <span>Nội trú</span>
              </div>
              <div className="space-y-1.5">
                {todayCompletion.boardingDone.map(({ session, done }) => (
                  <div key={session} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{getSessionLabel(session)}</span>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Evening Study Progress */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-purple-500" />
                <span>Tự học tối</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Điểm danh</span>
                {todayCompletion.eveningStudyDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Statistics - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Meals Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Utensils className="h-5 w-5 text-orange-500" />
              Thống kê bữa ăn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['breakfast', 'lunch', 'dinner'].map(mealType => {
              const report = latestStats.meals[mealType];
              return (
                <div key={mealType} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{getMealLabel(mealType)}</p>
                    {report && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.date), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                  {report ? (
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{report.presentCount}</p>
                      <p className="text-xs text-muted-foreground">học sinh</p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Chưa có</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Boarding Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-5 w-5 text-blue-500" />
              Thống kê nội trú
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['morning_exercise', 'noon_nap', 'evening_sleep'].map(session => {
              const report = latestStats.boarding[session];
              const percentage = report ? Math.round((report.presentCount / report.totalStudents) * 100) : 0;
              return (
                <div key={session} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{getSessionLabel(session)}</span>
                    {report ? (
                      <span className="text-sm font-bold text-green-600">
                        {report.presentCount}/{report.totalStudents}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Chưa có</span>
                    )}
                  </div>
                  {report && (
                    <Progress value={percentage} className="h-1.5" />
                  )}
                  {report && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.date), 'dd/MM/yyyy')} • Vắng: {report.absentCount}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Evening Study Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-purple-500" />
              Thống kê tự học tối
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestStats.eveningStudy ? (
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-green-600">
                    {latestStats.eveningStudy.presentCount}
                    <span className="text-lg text-muted-foreground font-normal">
                      /{latestStats.eveningStudy.totalStudents}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">học sinh có mặt</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tỉ lệ có mặt</span>
                    <span className="font-medium">
                      {Math.round((latestStats.eveningStudy.presentCount / latestStats.eveningStudy.totalStudents) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(latestStats.eveningStudy.presentCount / latestStats.eveningStudy.totalStudents) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Ngày báo cáo</span>
                  <span>{format(new Date(latestStats.eveningStudy.date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vắng mặt</span>
                  <span className="text-destructive font-medium">{latestStats.eveningStudy.absentCount}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <BookOpen className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Chưa có báo cáo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class Statistics Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Thống kê theo lớp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Khối</TableHead>
                  {Object.keys(classesByGrade).sort((a, b) => Number(a) - Number(b)).map(grade => {
                    const classesInGrade = classesByGrade[Number(grade)];
                    return classesInGrade.map(c => (
                      <TableHead key={c.id} className="text-center min-w-[70px]">
                        {c.name}
                      </TableHead>
                    ));
                  })}
                  <TableHead className="text-center font-bold">Tổng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Sĩ số</TableCell>
                  {classStats.map(c => (
                    <TableCell key={c.id} className="text-center font-medium">
                      {c.studentCount}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-primary">
                    {students.length}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Nội trú</TableCell>
                  {classStats.map(c => (
                    <TableCell key={c.id} className="text-center">
                      {c.boardingCount}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-green-600">
                    {students.filter(s => s.room).length}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Credit */}
      <div className="text-center py-4 border-t">
        <p className="text-sm text-muted-foreground">
          Thiết kế bởi <span className="font-medium text-primary">Thầy giáo Nguyễn Hồng Dân</span> - Zalo: <span className="font-medium">0888 770 699</span>
        </p>
      </div>
    </div>
  );
}
