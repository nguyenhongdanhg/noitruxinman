import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Image, Share2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { useApp } from '@/contexts/AppContext';

interface StatsSummaryCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  date: string;
  total: number;
  present: number;
  absent: number;
  absentList: Array<{
    name: string;
    classId?: string;
    className?: string;
    room?: string;
    mealGroup?: string;
    permission?: 'P' | 'KP';
    reason?: string;
  }>;
  isExpanded: boolean;
  onToggle: () => void;
  type?: 'study' | 'boarding' | 'meal';
  mealGroupStats?: Record<string, { total: number; absent: number }>;
  classStats?: Record<string, { total: number; absent: number }>;
  roomStats?: Record<string, { total: number; absent: number; students: Array<{ name: string; classId?: string; className?: string; permission?: 'P' | 'KP' }> }>;
  getClassName?: (classId: string) => string;
}

export function StatsSummaryCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  date,
  total,
  present,
  absent,
  absentList,
  isExpanded,
  onToggle,
  type,
  mealGroupStats,
  classStats,
  roomStats,
  getClassName,
}: StatsSummaryCardProps) {
  const { toast } = useToast();
  const { schoolInfo } = useApp();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      const fileName = `baocao_${type}_${date.replace(/\//g, '')}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: 'Xuất ảnh thành công',
        description: `Đã tải xuống ${fileName}`,
      });
    } catch (error) {
      toast({
        title: 'Lỗi xuất ảnh',
        description: 'Không thể xuất báo cáo dạng ảnh',
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  const shareToZalo = async () => {
    let message = `📋 ${title.toUpperCase()}\n`;
    message += `📅 ${date}\n`;
    message += `📊 Sỹ số: ${present}/${total}\n`;
    message += `❌ Vắng: ${absent} học sinh\n`;
    
    if (absent > 0 && absentList.length > 0) {
      message += `\n📝 Danh sách vắng:\n`;
      absentList.forEach((s, i) => {
        const perm = s.permission === 'P' ? '(P)' : '(KP)';
        const room = s.room ? ` - P.${s.room}` : '';
        message += `${i + 1}. ${s.name} - ${s.className}${room} ${perm}\n`;
      });
    }
    
    window.open(`https://zalo.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Group absent students by class for study type
  const getAbsentByClass = () => {
    const grouped: Record<string, typeof absentList> = {};
    absentList.forEach((a) => {
      const classKey = a.className || a.classId || 'Unknown';
      if (!grouped[classKey]) grouped[classKey] = [];
      grouped[classKey].push(a);
    });
    return grouped;
  };

  // Group absent students by room for boarding type
  const getAbsentByRoom = () => {
    const grouped: Record<string, typeof absentList> = {};
    absentList.forEach((a) => {
      const roomKey = a.room || 'Chưa xếp';
      if (!grouped[roomKey]) grouped[roomKey] = [];
      grouped[roomKey].push(a);
    });
    return grouped;
  };

  const absentByClass = getAbsentByClass();
  const absentByRoom = getAbsentByRoom();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className={cn("flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0", iconBg)}>
              <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-semibold text-foreground truncate">{title}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {present}<span className="text-muted-foreground font-normal">/{total}</span>
              </p>
              {absent > 0 && (
                <p className="text-xs text-destructive font-medium">Vắng: {absent}</p>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportAsImage}
                disabled={isExporting}
                className="h-8 w-8 p-0"
                title="Xuất ảnh"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={shareToZalo}
                className="h-8 w-8 p-0"
                title="Chia sẻ Zalo"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              {absent > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && absent > 0 && (
          <div className="mt-3 pt-3 border-t space-y-3">
            {/* Meal Group Stats for meal type */}
            {type === 'meal' && mealGroupStats && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(mealGroupStats).map(([group, stats]) => (
                  <div
                    key={group}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      stats.absent > 0 
                        ? "bg-destructive/10 text-destructive border border-destructive/30" 
                        : "bg-success/10 text-success border border-success/30"
                    )}
                  >
                    {group}: {stats.total - stats.absent}/{stats.total}
                    {stats.absent > 0 && ` (vắng ${stats.absent})`}
                  </div>
                ))}
              </div>
            )}

            {/* Class Stats */}
            {classStats && type !== 'boarding' && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(classStats).map(([classId, stats]) => (
                  <div
                    key={classId}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      stats.absent > 0 
                        ? "bg-destructive/10 text-destructive border border-destructive/30" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {getClassName ? getClassName(classId) : classId}: {stats.total - stats.absent}/{stats.total}
                    {stats.absent > 0 && ` (vắng ${stats.absent})`}
                  </div>
                ))}
              </div>
            )}
            
            {/* Absent Students List - Study Type (by class) */}
            {type === 'study' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Danh sách vắng theo lớp:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-8">STT</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Lớp</th>
                        <th className="text-center py-2 px-2 font-medium text-muted-foreground">SL</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Tên vắng (P/KP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(absentByClass).map(([className, classStudents], idx) => (
                        <tr key={className} className="border-b border-border/50 last:border-0">
                          <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-2 font-medium">{className}</td>
                          <td className="py-2 px-2 text-center">{classStudents.length}</td>
                          <td className="py-2 px-2">
                            {classStudents.map((s, i) => (
                              <span key={i}>
                                {s.name} ({s.permission || 'KP'})
                                {i < classStudents.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Absent Students List - Boarding Type (by room) */}
            {type === 'boarding' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Danh sách vắng theo phòng:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-8">STT</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Lớp</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Phòng</th>
                        <th className="text-center py-2 px-2 font-medium text-muted-foreground">SL</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Tên vắng (P/KP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(absentByRoom).map(([room, roomStudents], idx) => {
                        // Group by class within room
                        const byClassInRoom: Record<string, typeof roomStudents> = {};
                        roomStudents.forEach((s) => {
                          const classKey = s.className || s.classId || 'Unknown';
                          if (!byClassInRoom[classKey]) byClassInRoom[classKey] = [];
                          byClassInRoom[classKey].push(s);
                        });

                        let rowIdx = 0;
                        return Object.entries(byClassInRoom).map(([className, classStudents]) => (
                          <tr key={`${room}-${className}`} className="border-b border-border/50 last:border-0">
                            <td className="py-2 px-2 text-muted-foreground">{idx + (rowIdx++) + 1}</td>
                            <td className="py-2 px-2 font-medium">{className}</td>
                            <td className="py-2 px-2">{room}</td>
                            <td className="py-2 px-2 text-center">{classStudents.length}</td>
                            <td className="py-2 px-2">
                              {classStudents.map((s, i) => (
                                <span key={i}>
                                  {s.name} ({s.permission || 'KP'})
                                  {i < classStudents.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Absent Students List - Meal Type */}
            {type === 'meal' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Học sinh vắng:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-8">#</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground min-w-[120px]">Họ tên</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Lớp</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Mâm</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Phép</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Lý do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absentList.map((student, idx) => (
                        <tr key={idx} className="border-b border-border/50 last:border-0">
                          <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-2 font-medium">{student.name}</td>
                          <td className="py-2 px-2">{student.className || '-'}</td>
                          <td className="py-2 px-2">{student.mealGroup || '-'}</td>
                          <td className="py-2 px-2">
                            {student.permission ? (
                              <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
                                student.permission === 'P' 
                                  ? "bg-success/10 text-success" 
                                  : "bg-destructive/10 text-destructive"
                              )}>
                                {student.permission === 'P' ? 'Có phép' : 'K.phép'}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-2 text-muted-foreground italic max-w-[150px] truncate">
                            {student.reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden report for image export */}
        <div className="hidden">
          <div ref={reportRef} className="bg-white p-6" style={{ width: '800px' }}>
            {/* Header */}
            <div className="text-center mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-sm text-gray-600">{schoolInfo?.name || 'Trường PTDTNT THCS&THPT Xín Mần'}</h2>
              <h1 className="text-lg font-bold text-blue-600 mt-2">{title.toUpperCase()}</h1>
              <p className="text-sm text-gray-500 mt-1">{date}</p>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-800">{total}</p>
                <p className="text-xs text-gray-500">Tổng số</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{present}</p>
                <p className="text-xs text-gray-500">Có mặt</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{absent}</p>
                <p className="text-xs text-gray-500">Vắng</p>
              </div>
            </div>

            {/* Absent table - Study type (by class) */}
            {type === 'study' && absent > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-gray-800">Danh sách vắng theo lớp</h3>
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left w-12">STT</th>
                      <th className="border border-gray-300 p-2 text-left w-20">Lớp</th>
                      <th className="border border-gray-300 p-2 text-center w-16">SL</th>
                      <th className="border border-gray-300 p-2 text-left">Tên vắng (P/KP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(absentByClass).map(([className, classStudents], idx) => (
                      <tr key={className}>
                        <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-gray-300 p-2">{className}</td>
                        <td className="border border-gray-300 p-2 text-center">{classStudents.length}</td>
                        <td className="border border-gray-300 p-2">
                          {classStudents.map((s, i) => (
                            <span key={i}>
                              {s.name} ({s.permission || 'KP'})
                              {i < classStudents.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Absent table - Boarding type (by room) */}
            {type === 'boarding' && absent > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-gray-800">Danh sách vắng theo phòng</h3>
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left w-12">STT</th>
                      <th className="border border-gray-300 p-2 text-left w-20">Lớp</th>
                      <th className="border border-gray-300 p-2 text-left w-20">Phòng</th>
                      <th className="border border-gray-300 p-2 text-center w-16">SL</th>
                      <th className="border border-gray-300 p-2 text-left">Tên vắng (P/KP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(absentByRoom).map(([room, roomStudents], idx) => {
                      const byClassInRoom: Record<string, typeof roomStudents> = {};
                      roomStudents.forEach((s) => {
                        const classKey = s.className || s.classId || 'Unknown';
                        if (!byClassInRoom[classKey]) byClassInRoom[classKey] = [];
                        byClassInRoom[classKey].push(s);
                      });

                      let rowIdx = 0;
                      return Object.entries(byClassInRoom).map(([className, classStudents]) => (
                        <tr key={`${room}-${className}`}>
                          <td className="border border-gray-300 p-2 text-center">{idx + (rowIdx++) + 1}</td>
                          <td className="border border-gray-300 p-2">{className}</td>
                          <td className="border border-gray-300 p-2">{room}</td>
                          <td className="border border-gray-300 p-2 text-center">{classStudents.length}</td>
                          <td className="border border-gray-300 p-2">
                            {classStudents.map((s, i) => (
                              <span key={i}>
                                {s.name} ({s.permission || 'KP'})
                                {i < classStudents.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Absent table - Meal type */}
            {type === 'meal' && absent > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-gray-800">Danh sách vắng</h3>
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left w-12">STT</th>
                      <th className="border border-gray-300 p-2 text-left">Họ tên</th>
                      <th className="border border-gray-300 p-2 text-left w-20">Lớp</th>
                      <th className="border border-gray-300 p-2 text-center w-16">Mâm</th>
                      <th className="border border-gray-300 p-2 text-center w-16">Phép</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentList.map((s, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-gray-300 p-2">{s.name}</td>
                        <td className="border border-gray-300 p-2">{s.className || '-'}</td>
                        <td className="border border-gray-300 p-2 text-center">{s.mealGroup || '-'}</td>
                        <td className="border border-gray-300 p-2 text-center">{s.permission || 'KP'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
