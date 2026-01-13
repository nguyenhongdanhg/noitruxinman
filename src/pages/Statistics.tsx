import { useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Download, Calendar, Book, Moon, Utensils, Users, FileSpreadsheet } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, parseISO, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { StatsSummaryCard } from '@/components/statistics/StatsSummaryCard';
import * as XLSX from 'xlsx';
import { Report } from '@/types';

export default function Statistics() {
  const { reports, students, classes, currentUser, schoolInfo } = useApp();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [mealExportType, setMealExportType] = useState<'day' | 'week' | 'month'>('day');
  const [mealExportDate, setMealExportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealExportClass, setMealExportClass] = useState<string>('all');
  const [summaryFilterType, setSummaryFilterType] = useState<'day' | 'week' | 'month'>('day');
  const [summaryFilterDate, setSummaryFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
  const monthEnd = endOfMonth(monthStart);

  // Calculate date range for summary stats based on filter
  const summaryDateRange = useMemo(() => {
    const baseDate = parseISO(summaryFilterDate);
    if (summaryFilterType === 'day') {
      return { start: baseDate, end: baseDate };
    } else if (summaryFilterType === 'week') {
      return { start: startOfWeek(baseDate, { weekStartsOn: 1 }), end: endOfWeek(baseDate, { weekStartsOn: 1 }) };
    } else {
      return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
    }
  }, [summaryFilterType, summaryFilterDate]);

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || classId;
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter reports by month
  const monthReports = useMemo(() => {
    return reports.filter((r) => {
      const reportDate = new Date(r.date);
      return isWithinInterval(reportDate, { start: monthStart, end: monthEnd });
    });
  }, [reports, monthStart, monthEnd]);

  // Group reports by type and date
  const groupedReports = useMemo(() => {
    const eveningStudy: typeof monthReports = [];
    const boarding: typeof monthReports = [];
    const meals: {
      breakfast: typeof monthReports;
      lunch: typeof monthReports;
      dinner: typeof monthReports;
    } = {
      breakfast: [],
      lunch: [],
      dinner: [],
    };

    monthReports.forEach(r => {
      if (r.type === 'evening_study') eveningStudy.push(r);
      else if (r.type === 'boarding') boarding.push(r);
      else if (r.type === 'meal') {
        if (r.mealType === 'breakfast') meals.breakfast.push(r);
        else if (r.mealType === 'lunch') meals.lunch.push(r);
        else if (r.mealType === 'dinner') meals.dinner.push(r);
      }
    });

    // Sort by date descending
    const sortByDate = (a: typeof monthReports[0], b: typeof monthReports[0]) => 
      new Date(b.date).getTime() - new Date(a.date).getTime();

    return {
      eveningStudy: eveningStudy.sort(sortByDate),
      boarding: boarding.sort(sortByDate),
      meals: {
        breakfast: meals.breakfast.sort(sortByDate),
        lunch: meals.lunch.sort(sortByDate),
        dinner: meals.dinner.sort(sortByDate),
      },
    };
  }, [monthReports]);

  // Filter reports for summary stats based on date range filter
  const summaryReports = useMemo(() => {
    return reports.filter((r) => {
      const reportDate = parseISO(r.date);
      return isWithinInterval(reportDate, summaryDateRange);
    });
  }, [reports, summaryDateRange]);

  // Group summary reports by type
  const groupedSummaryReports = useMemo(() => {
    const eveningStudy: typeof summaryReports = [];
    const boarding: typeof summaryReports = [];
    const meals: {
      breakfast: typeof summaryReports;
      lunch: typeof summaryReports;
      dinner: typeof summaryReports;
    } = {
      breakfast: [],
      lunch: [],
      dinner: [],
    };

    summaryReports.forEach(r => {
      if (r.type === 'evening_study') eveningStudy.push(r);
      else if (r.type === 'boarding') boarding.push(r);
      else if (r.type === 'meal') {
        if (r.mealType === 'breakfast') meals.breakfast.push(r);
        else if (r.mealType === 'lunch') meals.lunch.push(r);
        else if (r.mealType === 'dinner') meals.dinner.push(r);
      }
    });

    // Sort by date descending
    const sortByDate = (a: typeof summaryReports[0], b: typeof summaryReports[0]) => 
      new Date(b.date).getTime() - new Date(a.date).getTime();

    return {
      eveningStudy: eveningStudy.sort(sortByDate),
      boarding: boarding.sort(sortByDate),
      meals: {
        breakfast: meals.breakfast.sort(sortByDate),
        lunch: meals.lunch.sort(sortByDate),
        dinner: meals.dinner.sort(sortByDate),
      },
    };
  }, [summaryReports]);

  // Calculate summary stats - only use the most recent report for each type within the selected date range
  const summaryStats = useMemo(() => {
    // Get the most recent report for each type (reports are already sorted by date descending)
    const latestEveningStudy = groupedSummaryReports.eveningStudy[0];
    const latestBoarding = groupedSummaryReports.boarding[0];
    
    // For meals, get the most recent report of any meal type
    const allMealReports = [
      ...groupedSummaryReports.meals.breakfast,
      ...groupedSummaryReports.meals.lunch,
      ...groupedSummaryReports.meals.dinner,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestMeal = allMealReports[0];

    return {
      eveningStudy: latestEveningStudy 
        ? { total: latestEveningStudy.totalStudents, present: latestEveningStudy.presentCount, absent: latestEveningStudy.absentCount }
        : { total: 0, present: 0, absent: 0 },
      boarding: latestBoarding
        ? { total: latestBoarding.totalStudents, present: latestBoarding.presentCount, absent: latestBoarding.absentCount }
        : { total: 0, present: 0, absent: 0 },
      meals: latestMeal
        ? { total: latestMeal.totalStudents, present: latestMeal.presentCount, absent: latestMeal.absentCount }
        : { total: 0, present: 0, absent: 0 },
    };
  }, [groupedSummaryReports]);

  // Calculate meal group stats for a report
  const getMealGroupStats = (report: typeof monthReports[0]) => {
    const stats: Record<string, { total: number; absent: number }> = {};
    const mealGroups = [...new Set(students.map(s => s.mealGroup))];
    
    mealGroups.forEach(group => {
      const groupStudents = students.filter(s => s.mealGroup === group);
      const absentInGroup = report.absentStudents.filter(a => {
        const student = students.find(s => s.id === a.studentId);
        return student?.mealGroup === group;
      });
      stats[group] = {
        total: groupStudents.length,
        absent: absentInGroup.length,
      };
    });

    return stats;
  };

  // Calculate class stats for a report
  const getClassStats = (report: typeof monthReports[0]) => {
    const stats: Record<string, { total: number; absent: number }> = {};
    const classIds = [...new Set(report.absentStudents.map(a => a.classId))];
    
    classIds.forEach(classId => {
      const classStudents = students.filter(s => s.classId === classId);
      const absentInClass = report.absentStudents.filter(a => a.classId === classId);
      stats[classId] = {
        total: classStudents.length,
        absent: absentInClass.length,
      };
    });

    return stats;
  };

  const getMealTypeLabel = (mealType?: string) => {
    switch (mealType) {
      case 'breakfast': return 'Bữa sáng';
      case 'lunch': return 'Bữa trưa';
      case 'dinner': return 'Bữa tối';
      default: return '';
    }
  };

  const getSessionLabel = (session?: string) => {
    switch (session) {
      case 'morning_exercise': return 'Thể dục sáng';
      case 'noon_nap': return 'Ngủ trưa';
      case 'evening_sleep': return 'Ngủ tối';
      case 'random': return 'Đột xuất';
      default: return '';
    }
  };

  // Export detailed meal Excel - whole school
  const exportMealExcelSchool = () => {
    let dateRange: { start: Date; end: Date };
    const baseDate = parseISO(mealExportDate);

    if (mealExportType === 'day') {
      dateRange = { start: baseDate, end: baseDate };
    } else if (mealExportType === 'week') {
      dateRange = { start: startOfWeek(baseDate, { weekStartsOn: 1 }), end: endOfWeek(baseDate, { weekStartsOn: 1 }) };
    } else {
      dateRange = { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
    }

    const days = eachDayOfInterval(dateRange);
    const mealReports = reports.filter(r => 
      r.type === 'meal' && 
      isWithinInterval(parseISO(r.date), dateRange)
    );

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Get unique meal groups
    const mealGroups = [...new Set(students.map(s => s.mealGroup).filter(Boolean))];
    
    // Summary sheet with detailed stats by day
    const summaryData: any[][] = [
      [`BÁO CÁO THỐNG KÊ BỮA ĂN - TOÀN TRƯỜNG`],
      [`Từ ngày: ${format(dateRange.start, 'dd/MM/yyyy')} - Đến ngày: ${format(dateRange.end, 'dd/MM/yyyy')}`],
      [`Xuất lúc: ${format(new Date(), 'HH:mm dd/MM/yyyy')}`],
      [],
      ['TỔNG HỢP THEO NGÀY'],
      ['Ngày', 'Bữa sáng - Tổng ăn', 'Bữa sáng - Vắng', 'Bữa trưa - Tổng ăn', 'Bữa trưa - Vắng', 'Bữa tối - Tổng ăn', 'Bữa tối - Vắng'],
    ];

    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayReports = mealReports.filter(r => r.date === dayStr);
      
      const breakfast = dayReports.find(r => r.mealType === 'breakfast');
      const lunch = dayReports.find(r => r.mealType === 'lunch');
      const dinner = dayReports.find(r => r.mealType === 'dinner');

      summaryData.push([
        format(day, 'dd/MM/yyyy'),
        breakfast?.presentCount || 0,
        breakfast?.absentCount || 0,
        lunch?.presentCount || 0,
        lunch?.absentCount || 0,
        dinner?.presentCount || 0,
        dinner?.absentCount || 0,
      ]);
    });

    // Add detailed stats by class for each day
    summaryData.push([]);
    summaryData.push(['CHI TIẾT THEO LỚP']);
    
    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayReports = mealReports.filter(r => r.date === dayStr);
      
      if (dayReports.length > 0) {
        summaryData.push([]);
        summaryData.push([`Ngày ${format(day, 'dd/MM/yyyy')}`]);
        summaryData.push(['Lớp', 'Tổng HS', 'Bữa sáng - Ăn', 'Bữa sáng - Vắng', 'Bữa trưa - Ăn', 'Bữa trưa - Vắng', 'Bữa tối - Ăn', 'Bữa tối - Vắng']);
        
        classes.forEach(cls => {
          const classStudents = students.filter(s => s.classId === cls.id);
          if (classStudents.length === 0) return;
          
          const breakfast = dayReports.find(r => r.mealType === 'breakfast');
          const lunch = dayReports.find(r => r.mealType === 'lunch');
          const dinner = dayReports.find(r => r.mealType === 'dinner');
          
          const breakfastAbsent = breakfast?.absentStudents.filter(a => a.classId === cls.id).length || 0;
          const lunchAbsent = lunch?.absentStudents.filter(a => a.classId === cls.id).length || 0;
          const dinnerAbsent = dinner?.absentStudents.filter(a => a.classId === cls.id).length || 0;
          
          summaryData.push([
            cls.name,
            classStudents.length,
            classStudents.length - breakfastAbsent,
            breakfastAbsent,
            classStudents.length - lunchAbsent,
            lunchAbsent,
            classStudents.length - dinnerAbsent,
            dinnerAbsent,
          ]);
        });
      }
    });

    // Add detailed stats by meal group for each day
    summaryData.push([]);
    summaryData.push(['CHI TIẾT THEO MÂM ĂN']);
    
    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayReports = mealReports.filter(r => r.date === dayStr);
      
      if (dayReports.length > 0) {
        summaryData.push([]);
        summaryData.push([`Ngày ${format(day, 'dd/MM/yyyy')}`]);
        summaryData.push(['Mâm ăn', 'Tổng HS', 'Bữa sáng - Ăn', 'Bữa sáng - Vắng', 'Bữa trưa - Ăn', 'Bữa trưa - Vắng', 'Bữa tối - Ăn', 'Bữa tối - Vắng']);
        
        mealGroups.forEach(group => {
          const groupStudents = students.filter(s => s.mealGroup === group);
          if (groupStudents.length === 0) return;
          
          const breakfast = dayReports.find(r => r.mealType === 'breakfast');
          const lunch = dayReports.find(r => r.mealType === 'lunch');
          const dinner = dayReports.find(r => r.mealType === 'dinner');
          
          const breakfastAbsent = breakfast?.absentStudents.filter(a => {
            const student = students.find(s => s.id === a.studentId);
            return student?.mealGroup === group;
          }).length || 0;
          const lunchAbsent = lunch?.absentStudents.filter(a => {
            const student = students.find(s => s.id === a.studentId);
            return student?.mealGroup === group;
          }).length || 0;
          const dinnerAbsent = dinner?.absentStudents.filter(a => {
            const student = students.find(s => s.id === a.studentId);
            return student?.mealGroup === group;
          }).length || 0;
          
          summaryData.push([
            `Mâm ${group}`,
            groupStudents.length,
            groupStudents.length - breakfastAbsent,
            breakfastAbsent,
            groupStudents.length - lunchAbsent,
            lunchAbsent,
            groupStudents.length - dinnerAbsent,
            dinnerAbsent,
          ]);
        });
      }
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Tổng hợp');

    // Detailed sheet per class
    classes.forEach(cls => {
      const classStudents = students.filter(s => s.classId === cls.id);
      if (classStudents.length === 0) return;

      const classData: any[][] = [
        [`THỐNG KÊ BỮA ĂN - LỚP ${cls.name}`],
        [`Từ ngày: ${format(dateRange.start, 'dd/MM/yyyy')} - Đến ngày: ${format(dateRange.end, 'dd/MM/yyyy')}`],
        [],
      ];

      // Header row
      const headerRow = ['STT', 'Họ và tên', 'Mâm ăn'];
      days.forEach(day => {
        headerRow.push(`${format(day, 'dd/MM')} Sáng`, `${format(day, 'dd/MM')} Trưa`, `${format(day, 'dd/MM')} Tối`);
      });
      headerRow.push('Số gạo (kg)');
      classData.push(headerRow);

      // Student rows
      classStudents.forEach((student, idx) => {
        const row: any[] = [idx + 1, student.name, student.mealGroup];
        let totalLunchDinnerMeals = 0;
        
        days.forEach(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayReports = mealReports.filter(r => r.date === dayStr);
          
          ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
            const report = dayReports.find(r => r.mealType === mealType);
            if (!report) {
              row.push('-');
            } else {
              const isAbsent = report.absentStudents.some(a => a.studentId === student.id);
              row.push(isAbsent ? 'V' : 'X');
              // Count lunch and dinner meals where student is present
              if (!isAbsent && (mealType === 'lunch' || mealType === 'dinner')) {
                totalLunchDinnerMeals++;
              }
            }
          });
        });
        
        // Add rice consumption: 0.2kg per lunch/dinner meal
        const riceAmount = (totalLunchDinnerMeals * 0.2).toFixed(1);
        row.push(parseFloat(riceAmount));
        classData.push(row);
      });

      const classSheet = XLSX.utils.aoa_to_sheet(classData);
      XLSX.utils.book_append_sheet(wb, classSheet, `Lớp ${cls.name}`.substring(0, 31));
    });

    // Download
    const fileName = `thongke_buaan_${mealExportType}_${mealExportDate}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: 'Xuất Excel thành công',
      description: `Đã tải xuống ${fileName}`,
    });
  };

  // Export meal Excel for specific class
  const exportMealExcelClass = () => {
    if (mealExportClass === 'all') {
      exportMealExcelSchool();
      return;
    }

    let dateRange: { start: Date; end: Date };
    const baseDate = parseISO(mealExportDate);

    if (mealExportType === 'day') {
      dateRange = { start: baseDate, end: baseDate };
    } else if (mealExportType === 'week') {
      dateRange = { start: startOfWeek(baseDate, { weekStartsOn: 1 }), end: endOfWeek(baseDate, { weekStartsOn: 1 }) };
    } else {
      dateRange = { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
    }

    const days = eachDayOfInterval(dateRange);
    const mealReports = reports.filter(r => 
      r.type === 'meal' && 
      isWithinInterval(parseISO(r.date), dateRange)
    );

    const cls = classes.find(c => c.id === mealExportClass);
    const classStudents = students.filter(s => s.classId === mealExportClass);

    const wb = XLSX.utils.book_new();
    const classData: any[][] = [
      [`THỐNG KÊ BỮA ĂN - LỚP ${cls?.name || mealExportClass}`],
      [`Từ ngày: ${format(dateRange.start, 'dd/MM/yyyy')} - Đến ngày: ${format(dateRange.end, 'dd/MM/yyyy')}`],
      [`Xuất lúc: ${format(new Date(), 'HH:mm dd/MM/yyyy')}`],
      [],
    ];

    // Header row
    const headerRow = ['STT', 'Họ và tên', 'Mâm ăn'];
    days.forEach(day => {
      headerRow.push(`${format(day, 'dd/MM')} Sáng`, `${format(day, 'dd/MM')} Trưa`, `${format(day, 'dd/MM')} Tối`);
    });
    headerRow.push('Số gạo (kg)');
    classData.push(headerRow);

    // Student rows
    classStudents.forEach((student, idx) => {
      const row: any[] = [idx + 1, student.name, student.mealGroup];
      let totalLunchDinnerMeals = 0;
      
      days.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayReports = mealReports.filter(r => r.date === dayStr);
        
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
          const report = dayReports.find(r => r.mealType === mealType);
          if (!report) {
            row.push('-');
          } else {
            const isAbsent = report.absentStudents.some(a => a.studentId === student.id);
            row.push(isAbsent ? 'V' : 'X');
            // Count lunch and dinner meals where student is present
            if (!isAbsent && (mealType === 'lunch' || mealType === 'dinner')) {
              totalLunchDinnerMeals++;
            }
          }
        });
      });
      
      // Add rice consumption: 0.2kg per lunch/dinner meal
      const riceAmount = (totalLunchDinnerMeals * 0.2).toFixed(1);
      row.push(parseFloat(riceAmount));
      classData.push(row);
    });

    // Add legend
    classData.push([]);
    classData.push(['Chú thích: X = Có mặt, V = Vắng, - = Chưa điểm danh']);
    classData.push(['Số gạo tính: 0.2kg × số bữa trưa/tối có mặt']);

    const classSheet = XLSX.utils.aoa_to_sheet(classData);
    XLSX.utils.book_append_sheet(wb, classSheet, 'Chi tiết');

    const fileName = `thongke_buaan_lop${cls?.name || mealExportClass}_${mealExportType}_${mealExportDate}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: 'Xuất Excel thành công',
      description: `Đã tải xuống ${fileName}`,
    });
  };

  const exportReport = () => {
    let csv = '\ufeff';
    csv += `Báo cáo thống kê tháng ${format(monthStart, 'MM/yyyy')}\n\n`;
    
    csv += `THỐNG KÊ TỰ HỌC\n`;
    csv += `Sỹ số,Có mặt,Vắng\n`;
    csv += `${summaryStats.eveningStudy.present}/${summaryStats.eveningStudy.total},${summaryStats.eveningStudy.present},${summaryStats.eveningStudy.absent}\n\n`;
    
    csv += `THỐNG KÊ NỘI TRÚ\n`;
    csv += `Sỹ số,Có mặt,Vắng\n`;
    csv += `${summaryStats.boarding.present}/${summaryStats.boarding.total},${summaryStats.boarding.present},${summaryStats.boarding.absent}\n\n`;
    
    csv += `THỐNG KÊ BỮA ĂN\n`;
    csv += `Sỹ số,Có mặt,Vắng\n`;
    csv += `${summaryStats.meals.present}/${summaryStats.meals.total},${summaryStats.meals.present},${summaryStats.meals.absent}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thong_ke_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Xuất báo cáo thành công',
      description: 'File báo cáo đã được tải xuống',
    });
  };

  const renderMealReports = (mealReports: Report[], mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (mealReports.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Chưa có báo cáo {getMealTypeLabel(mealType).toLowerCase()} trong tháng này
        </div>
      );
    }

    return mealReports.map((report) => (
      <StatsSummaryCard
        key={report.id}
        icon={Utensils}
        iconColor="text-success"
        iconBg="bg-success/10"
        title={getMealTypeLabel(report.mealType)}
        date={format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })}
        total={report.totalStudents}
        present={report.presentCount}
        absent={report.absentCount}
        absentList={report.absentStudents.map(a => ({
          name: a.name,
          className: getClassName(a.classId),
          mealGroup: a.mealGroup,
          permission: a.permission,
          reason: a.reason,
        }))}
        isExpanded={expandedCards[report.id] || false}
        onToggle={() => toggleCard(report.id)}
        type="meal"
        mealGroupStats={getMealGroupStats(report)}
        classStats={getClassStats(report)}
        getClassName={getClassName}
        reporterName={report.reporterName}
      />
    ));
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Thống kê tổng hợp
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem thống kê điểm danh và bữa ăn
          </p>
        </div>
        <Button onClick={exportReport} variant="outline" className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Summary Filter */}
      <Card>
        <CardContent className="py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Thống kê tổng hợp:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={summaryFilterType} onValueChange={(value: 'day' | 'week' | 'month') => setSummaryFilterType(value)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Theo ngày</SelectItem>
                  <SelectItem value="week">Theo tuần</SelectItem>
                  <SelectItem value="month">Theo tháng</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={summaryFilterDate}
                onChange={(e) => setSummaryFilterDate(e.target.value)}
                className="w-40"
              />
            </div>
            <p className="text-xs text-muted-foreground ml-auto">
              {summaryFilterType === 'day' && format(parseISO(summaryFilterDate), 'dd/MM/yyyy', { locale: vi })}
              {summaryFilterType === 'week' && `${format(summaryDateRange.start, 'dd/MM')} - ${format(summaryDateRange.end, 'dd/MM/yyyy')}`}
              {summaryFilterType === 'month' && format(parseISO(summaryFilterDate), 'MM/yyyy', { locale: vi })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Utensils className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Bữa ăn</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {summaryStats.meals.present}/{summaryStats.meals.total}
                </p>
                <p className="text-xs text-muted-foreground">Vắng: {summaryStats.meals.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Moon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Nội trú/Ngủ</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {summaryStats.boarding.present}/{summaryStats.boarding.total}
                </p>
                <p className="text-xs text-muted-foreground">Vắng: {summaryStats.boarding.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Giờ tự học</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {summaryStats.eveningStudy.present}/{summaryStats.eveningStudy.total}
                </p>
                <p className="text-xs text-muted-foreground">Vắng: {summaryStats.eveningStudy.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports by Category */}
      <Tabs defaultValue="meals" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="meals" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Bữa ăn</span>
            <span className="sm:hidden">Ăn</span>
          </TabsTrigger>
          <TabsTrigger value="boarding" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Nội trú</span>
            <span className="sm:hidden">Ngủ</span>
          </TabsTrigger>
          <TabsTrigger value="study" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Book className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tự học</span>
            <span className="sm:hidden">Tự học</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="study" className="mt-4 space-y-3">
          {groupedReports.eveningStudy.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Book className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có báo cáo tự học trong tháng này</p>
              </CardContent>
            </Card>
          ) : (
            groupedReports.eveningStudy.map((report) => (
              <StatsSummaryCard
                key={report.id}
                icon={Book}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                title={`Giờ tự học tối`}
                date={format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })}
                total={report.totalStudents}
                present={report.presentCount}
                absent={report.absentCount}
                absentList={report.absentStudents.map(a => ({
                  name: a.name,
                  className: getClassName(a.classId),
                  permission: a.permission,
                  reason: a.reason,
                }))}
                isExpanded={expandedCards[report.id] || false}
                onToggle={() => toggleCard(report.id)}
                type="study"
                classStats={getClassStats(report)}
                getClassName={getClassName}
                reporterName={report.reporterName}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="boarding" className="mt-4 space-y-3">
          {groupedReports.boarding.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Moon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có báo cáo nội trú trong tháng này</p>
              </CardContent>
            </Card>
          ) : (
            groupedReports.boarding.map((report) => (
              <StatsSummaryCard
                key={report.id}
                icon={Moon}
                iconColor="text-accent"
                iconBg="bg-accent/10"
                title={getSessionLabel(report.session) || 'Điểm danh nội trú'}
                date={format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })}
                total={report.totalStudents}
                present={report.presentCount}
                absent={report.absentCount}
                absentList={report.absentStudents.map(a => {
                  const student = students.find(s => s.id === a.studentId);
                  return {
                    name: a.name,
                    className: getClassName(a.classId),
                    room: student?.room || a.room,
                    permission: a.permission,
                    reason: a.reason,
                  };
                })}
                isExpanded={expandedCards[report.id] || false}
                onToggle={() => toggleCard(report.id)}
                type="boarding"
                classStats={getClassStats(report)}
                getClassName={getClassName}
                reporterName={report.reporterName}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="meals" className="mt-4 space-y-4">
          {/* Excel Export Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-success" />
                Xuất Excel thống kê bữa ăn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Khoảng thời gian</label>
                  <Select value={mealExportType} onValueChange={(v: 'day' | 'week' | 'month') => setMealExportType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Theo ngày</SelectItem>
                      <SelectItem value="week">Theo tuần</SelectItem>
                      <SelectItem value="month">Theo tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Ngày</label>
                  <Input
                    type="date"
                    value={mealExportDate}
                    onChange={(e) => setMealExportDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Lớp</label>
                  <Select value={mealExportClass} onValueChange={setMealExportClass}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toàn trường</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          Lớp {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={exportMealExcelClass} className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Xuất Excel
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                X = Có mặt, V = Vắng, - = Chưa điểm danh
              </p>
            </CardContent>
          </Card>

          {/* Meal Reports by Type */}
          <Tabs defaultValue="breakfast" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="breakfast" className="text-xs sm:text-sm">
                🌅 Bữa sáng ({groupedReports.meals.breakfast.length})
              </TabsTrigger>
              <TabsTrigger value="lunch" className="text-xs sm:text-sm">
                ☀️ Bữa trưa ({groupedReports.meals.lunch.length})
              </TabsTrigger>
              <TabsTrigger value="dinner" className="text-xs sm:text-sm">
                🌙 Bữa tối ({groupedReports.meals.dinner.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="breakfast" className="mt-3 space-y-3">
              {renderMealReports(groupedReports.meals.breakfast, 'breakfast')}
            </TabsContent>

            <TabsContent value="lunch" className="mt-3 space-y-3">
              {renderMealReports(groupedReports.meals.lunch, 'lunch')}
            </TabsContent>

            <TabsContent value="dinner" className="mt-3 space-y-3">
              {renderMealReports(groupedReports.meals.dinner, 'dinner')}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
