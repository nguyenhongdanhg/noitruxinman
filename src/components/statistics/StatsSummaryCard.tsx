import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Image, Share2, Filter } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [permissionFilter, setPermissionFilter] = useState<'all' | 'P' | 'KP'>('all');

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

  // Filtered absent list based on permission filter
  const filteredAbsentList = absentList.filter(student => {
    if (permissionFilter === 'all') return true;
    return student.permission === permissionFilter;
  });

  const exportAsImage = async () => {
    setIsExporting(true);
    try {
      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.backgroundColor = '#ffffff';
      container.style.width = '800px';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.padding = '24px';
      
      // Build the report HTML
      container.innerHTML = buildReportHTML();
      document.body.appendChild(container);
      
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      document.body.removeChild(container);
      
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
      console.error('Export error:', error);
      toast({
        title: 'Lỗi xuất ảnh',
        description: 'Không thể xuất báo cáo dạng ảnh',
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  const buildReportHTML = () => {
    const schoolName = schoolInfo?.name || 'TRƯỜNG PTDTNT THCS&THPT XÍN MẦN';
    const reportTitle = getReportTitle();
    
    let tableRows = '';
    if (type === 'study') {
      tableRows = absentList.map((s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px;">${s.name}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${s.className || '-'}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">
            <span style="color: ${s.permission === 'P' ? '#16a34a' : '#dc2626'}; font-weight: 500;">
              ${s.permission === 'P' ? 'Có phép' : 'Không phép'}
            </span>
          </td>
          <td style="border: 1px solid #9ca3af; padding: 8px;">${s.reason || '-'}</td>
        </tr>
      `).join('');
    } else if (type === 'boarding') {
      tableRows = absentList.map((s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px;">${s.name}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${s.className || '-'}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${s.room || '-'}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">
            <span style="color: ${s.permission === 'P' ? '#16a34a' : '#dc2626'}; font-weight: 500;">
              ${s.permission === 'P' ? 'Có phép' : 'Không phép'}
            </span>
          </td>
          <td style="border: 1px solid #9ca3af; padding: 8px;">${s.reason || '-'}</td>
        </tr>
      `).join('');
    } else if (type === 'meal') {
      tableRows = absentList.map((s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px;">${s.name}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${s.className || '-'}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${s.mealGroup || '-'}</td>
          <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">
            <span style="color: ${s.permission === 'P' ? '#16a34a' : '#dc2626'}; font-weight: 500;">
              ${s.permission === 'P' ? 'Có phép' : 'Không phép'}
            </span>
          </td>
          <td style="border: 1px solid #9ca3af; padding: 8px;">${s.reason || '-'}</td>
        </tr>
      `).join('');
    }

    const getTableHeader = () => {
      if (type === 'study') {
        return `<tr style="background-color: #dbeafe;">
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 50px;">STT</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left;">Họ và tên</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 80px;">Lớp</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 100px;">Phép</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left;">Lý do</th>
        </tr>`;
      } else if (type === 'boarding') {
        return `<tr style="background-color: #dbeafe;">
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 50px;">STT</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left;">Họ và tên</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 80px;">Lớp</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 80px;">Phòng ở</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 100px;">Phép</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left;">Lý do</th>
        </tr>`;
      } else {
        return `<tr style="background-color: #dbeafe;">
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 50px;">STT</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left;">Họ và tên</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 80px;">Lớp</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 70px;">Mâm</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; width: 100px;">Phép</th>
          <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left;">Lý do</th>
        </tr>`;
      }
    };

    return `
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #2563eb;">
        <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;">${schoolName}</p>
        <h1 style="font-size: 20px; font-weight: bold; color: #1d4ed8; margin-bottom: 8px;">${reportTitle}</h1>
        <p style="font-size: 14px; color: #374151;">Ngày: ${date}</p>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
          <p style="font-size: 28px; font-weight: bold; color: #1d4ed8;">${total}</p>
          <p style="font-size: 14px; color: #4b5563; margin-top: 4px;">Tổng số</p>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
          <p style="font-size: 28px; font-weight: bold; color: #16a34a;">${present}</p>
          <p style="font-size: 14px; color: #4b5563; margin-top: 4px;">Có mặt</p>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
          <p style="font-size: 28px; font-weight: bold; color: #dc2626;">${absent}</p>
          <p style="font-size: 14px; color: #4b5563; margin-top: 4px;">Vắng</p>
        </div>
      </div>

      <div style="margin-bottom: 16px; padding: 12px; background-color: #f9fafb; border-radius: 8px;">
        <p style="font-size: 16px;"><strong>Sỹ số:</strong> ${present}/${total} (Vắng: ${absent})</p>
      </div>

      ${absent > 0 ? `
        <div style="margin-top: 16px;">
          <h3 style="font-weight: bold; margin-bottom: 12px; color: #1f2937; font-size: 16px;">DANH SÁCH HỌC SINH VẮNG</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse; border: 1px solid #9ca3af;">
            <thead>${getTableHeader()}</thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      ` : ''}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; font-size: 14px; color: #4b5563;">
        <div>
          <p><strong>Thời gian báo cáo:</strong> ${currentDateTime}</p>
        </div>
        <div style="text-align: right;">
          <p><strong>Người báo cáo:</strong> ${reporter}</p>
        </div>
      </div>
    `;
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
            {/* Permission Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={permissionFilter} onValueChange={(v: 'all' | 'P' | 'KP') => setPermissionFilter(v)}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Lọc theo phép" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả ({absentList.length})</SelectItem>
                  <SelectItem value="P">Có phép ({absentList.filter(s => s.permission === 'P').length})</SelectItem>
                  <SelectItem value="KP">Không phép ({absentList.filter(s => s.permission === 'KP').length})</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                Hiển thị: {filteredAbsentList.length} học sinh
              </span>
            </div>

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
                      {filteredAbsentList.map((student, idx) => (
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
                      {filteredAbsentList.map((student, idx) => (
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
                      {filteredAbsentList.map((student, idx) => (
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

      </CardContent>
    </Card>
  );
}
