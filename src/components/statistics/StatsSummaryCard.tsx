import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Image, Share2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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
  reporterName?: string;
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
  reporterName,
}: StatsSummaryCardProps) {
  const { toast } = useToast();
  const { schoolInfo, currentUser } = useApp();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const currentDateTime = format(new Date(), 'HH:mm dd/MM/yyyy', { locale: vi });
  const reporter = reporterName || currentUser.name;

  const getReportTitle = () => {
    switch (type) {
      case 'study': return 'BÁO CÁO ĐIỂM DANH GIỜ TỰ HỌC';
      case 'boarding': return 'BÁO CÁO ĐIỂM DANH NỘI TRÚ';
      case 'meal': return `BÁO CÁO ĐIỂM DANH BỮA ĂN - ${title.toUpperCase()}`;
      default: return 'BÁO CÁO ĐIỂM DANH';
    }
  };

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
    let message = `📋 ${getReportTitle()}\n`;
    message += `📅 Ngày: ${date}\n`;
    message += `⏰ Thời gian báo cáo: ${currentDateTime}\n`;
    message += `👤 Người báo cáo: ${reporter}\n\n`;
    message += `📊 Sỹ số: ${present}/${total}\n`;
    message += `❌ Vắng: ${absent} học sinh\n`;
    
    if (absent > 0 && absentList.length > 0) {
      message += `\n📝 Danh sách vắng:\n`;
      absentList.forEach((s, i) => {
        const perm = s.permission === 'P' ? '(P)' : '(KP)';
        const room = s.room ? ` - P.${s.room}` : '';
        const reason = s.reason ? ` - ${s.reason}` : '';
        message += `${i + 1}. ${s.name} - ${s.className}${room} ${perm}${reason}\n`;
      });
    }
    
    window.open(`https://zalo.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

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
            {/* Absent Students List - Study Type (STT, Họ tên, Lớp, Có phép/Không phép, Lý do) */}
            {type === 'study' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Danh sách học sinh vắng:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-12">STT</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground min-w-[140px]">Họ tên</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">Lớp</th>
                        <th className="text-center py-2 px-2 font-medium text-muted-foreground w-24">Phép</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Lý do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absentList.map((student, idx) => (
                        <tr key={idx} className="border-b border-border/50 last:border-0">
                          <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-2 font-medium">{student.name}</td>
                          <td className="py-2 px-2">{student.className || '-'}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
                              student.permission === 'P' 
                                ? "bg-success/10 text-success" 
                                : "bg-destructive/10 text-destructive"
                            )}>
                              {student.permission === 'P' ? 'Có phép' : 'K.phép'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground italic">
                            {student.reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Absent Students List - Boarding Type (STT, Họ tên, Lớp, Phòng ở, Có phép/Không phép, Lý do) */}
            {type === 'boarding' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Danh sách học sinh vắng:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-12">STT</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground min-w-[140px]">Họ tên</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">Lớp</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">Phòng ở</th>
                        <th className="text-center py-2 px-2 font-medium text-muted-foreground w-24">Phép</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Lý do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absentList.map((student, idx) => (
                        <tr key={idx} className="border-b border-border/50 last:border-0">
                          <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-2 font-medium">{student.name}</td>
                          <td className="py-2 px-2">{student.className || '-'}</td>
                          <td className="py-2 px-2">{student.room || '-'}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
                              student.permission === 'P' 
                                ? "bg-success/10 text-success" 
                                : "bg-destructive/10 text-destructive"
                            )}>
                              {student.permission === 'P' ? 'Có phép' : 'K.phép'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground italic">
                            {student.reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Absent Students List - Meal Type */}
            {type === 'meal' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Danh sách học sinh vắng:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-12">STT</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground min-w-[140px]">Họ tên</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">Lớp</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground w-16">Mâm</th>
                        <th className="text-center py-2 px-2 font-medium text-muted-foreground w-24">Phép</th>
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
                          <td className="py-2 px-2 text-center">
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
                              student.permission === 'P' 
                                ? "bg-success/10 text-success" 
                                : "bg-destructive/10 text-destructive"
                            )}>
                              {student.permission === 'P' ? 'Có phép' : 'K.phép'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground italic">
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

        {/* Hidden report for image export - IMPROVED LAYOUT */}
        <div className="hidden">
          <div ref={reportRef} className="bg-white p-6" style={{ width: '800px', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-blue-600">
              <p className="text-sm text-gray-600 mb-1">{schoolInfo?.name || 'TRƯỜNG PTDTNT THCS&THPT XÍN MẦN'}</p>
              <h1 className="text-xl font-bold text-blue-700 mb-2">{getReportTitle()}</h1>
              <p className="text-sm text-gray-700">Ngày: {date}</p>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-3xl font-bold text-blue-700">{total}</p>
                <p className="text-sm text-gray-600 mt-1">Tổng số</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-3xl font-bold text-green-600">{present}</p>
                <p className="text-sm text-gray-600 mt-1">Có mặt</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-3xl font-bold text-red-600">{absent}</p>
                <p className="text-sm text-gray-600 mt-1">Vắng</p>
              </div>
            </div>

            {/* Sỹ số display */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-base"><strong>Sỹ số:</strong> {present}/{total} (Vắng: {absent})</p>
            </div>

            {/* Absent table - Study type */}
            {type === 'study' && absent > 0 && (
              <div className="mt-4">
                <h3 className="font-bold mb-3 text-gray-800 text-base">DANH SÁCH HỌC SINH VẮNG</h3>
                <table className="w-full text-sm border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-400 p-2 text-center w-12">STT</th>
                      <th className="border border-gray-400 p-2 text-left">Họ và tên</th>
                      <th className="border border-gray-400 p-2 text-center w-20">Lớp</th>
                      <th className="border border-gray-400 p-2 text-center w-24">Phép</th>
                      <th className="border border-gray-400 p-2 text-left">Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentList.map((s, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-gray-400 p-2">{s.name}</td>
                        <td className="border border-gray-400 p-2 text-center">{s.className || '-'}</td>
                        <td className="border border-gray-400 p-2 text-center">
                          <span className={s.permission === 'P' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {s.permission === 'P' ? 'Có phép' : 'Không phép'}
                          </span>
                        </td>
                        <td className="border border-gray-400 p-2">{s.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Absent table - Boarding type */}
            {type === 'boarding' && absent > 0 && (
              <div className="mt-4">
                <h3 className="font-bold mb-3 text-gray-800 text-base">DANH SÁCH HỌC SINH VẮNG</h3>
                <table className="w-full text-sm border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-400 p-2 text-center w-12">STT</th>
                      <th className="border border-gray-400 p-2 text-left">Họ và tên</th>
                      <th className="border border-gray-400 p-2 text-center w-20">Lớp</th>
                      <th className="border border-gray-400 p-2 text-center w-20">Phòng ở</th>
                      <th className="border border-gray-400 p-2 text-center w-24">Phép</th>
                      <th className="border border-gray-400 p-2 text-left">Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentList.map((s, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-gray-400 p-2">{s.name}</td>
                        <td className="border border-gray-400 p-2 text-center">{s.className || '-'}</td>
                        <td className="border border-gray-400 p-2 text-center">{s.room || '-'}</td>
                        <td className="border border-gray-400 p-2 text-center">
                          <span className={s.permission === 'P' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {s.permission === 'P' ? 'Có phép' : 'Không phép'}
                          </span>
                        </td>
                        <td className="border border-gray-400 p-2">{s.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Absent table - Meal type */}
            {type === 'meal' && absent > 0 && (
              <div className="mt-4">
                <h3 className="font-bold mb-3 text-gray-800 text-base">DANH SÁCH HỌC SINH VẮNG</h3>
                <table className="w-full text-sm border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-400 p-2 text-center w-12">STT</th>
                      <th className="border border-gray-400 p-2 text-left">Họ và tên</th>
                      <th className="border border-gray-400 p-2 text-center w-20">Lớp</th>
                      <th className="border border-gray-400 p-2 text-center w-16">Mâm</th>
                      <th className="border border-gray-400 p-2 text-center w-24">Phép</th>
                      <th className="border border-gray-400 p-2 text-left">Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentList.map((s, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-gray-400 p-2">{s.name}</td>
                        <td className="border border-gray-400 p-2 text-center">{s.className || '-'}</td>
                        <td className="border border-gray-400 p-2 text-center">{s.mealGroup || '-'}</td>
                        <td className="border border-gray-400 p-2 text-center">
                          <span className={s.permission === 'P' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {s.permission === 'P' ? 'Có phép' : 'Không phép'}
                          </span>
                        </td>
                        <td className="border border-gray-400 p-2">{s.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-300 flex justify-between text-sm text-gray-600">
              <div>
                <p><strong>Thời gian báo cáo:</strong> {currentDateTime}</p>
              </div>
              <div className="text-right">
                <p><strong>Người báo cáo:</strong> {reporter}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
