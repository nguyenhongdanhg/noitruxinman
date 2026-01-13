import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { Report } from '@/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Download, Share2, Image, Book, Moon, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ReportImageExportProps {
  report: Report;
  type: 'study' | 'boarding' | 'meal';
}

export function ReportImageExport({ report, type }: ReportImageExportProps) {
  const { students, classes, schoolInfo } = useApp();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || classId;
  };

  const getStudent = (studentId: string) => {
    return students.find((s) => s.id === studentId);
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

  const getMealLabel = (mealType?: string) => {
    switch (mealType) {
      case 'breakfast': return 'Bữa sáng';
      case 'lunch': return 'Bữa trưa';
      case 'dinner': return 'Bữa tối';
      default: return '';
    }
  };

  const getTitle = () => {
    if (type === 'study') return 'BÁO CÁO ĐIỂM DANH GIỜ TỰ HỌC';
    if (type === 'boarding') return `BÁO CÁO ĐIỂM DANH ${getSessionLabel(report.session).toUpperCase()}`;
    if (type === 'meal') return `BÁO CÁO ĐIỂM DANH ${getMealLabel(report.mealType).toUpperCase()}`;
    return 'BÁO CÁO ĐIỂM DANH';
  };

  const getIcon = () => {
    if (type === 'study') return <Book className="h-6 w-6 text-primary" />;
    if (type === 'boarding') return <Moon className="h-6 w-6 text-accent" />;
    return <Utensils className="h-6 w-6 text-success" />;
  };

  // Group absent students by class for study
  const getAbsentByClass = () => {
    const grouped: Record<string, typeof report.absentStudents> = {};
    report.absentStudents.forEach((a) => {
      if (!grouped[a.classId]) grouped[a.classId] = [];
      grouped[a.classId].push(a);
    });
    return grouped;
  };

  // Group absent students by room for boarding
  const getAbsentByRoom = () => {
    const grouped: Record<string, (typeof report.absentStudents[0] & { room?: string })[]> = {};
    report.absentStudents.forEach((a) => {
      const student = getStudent(a.studentId);
      const room = student?.room || 'Chưa xếp';
      if (!grouped[room]) grouped[room] = [];
      grouped[room].push({ ...a, room });
    });
    return grouped;
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
      const fileName = `baocao_${type}_${format(new Date(report.date), 'ddMMyyyy')}.png`;
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
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      
      // Create share text
      let message = `📋 ${getTitle()}\n`;
      message += `📅 Ngày: ${format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })}\n`;
      message += `📊 Sỹ số: ${report.presentCount}/${report.totalStudents}\n`;
      message += `❌ Vắng: ${report.absentCount} học sinh\n`;
      message += `👤 Người báo cáo: ${report.reporterName}`;
      
      // Try Web Share API for mobile
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'report.png', { type: 'image/png' })] })) {
        const file = new File([blob], `baocao_${type}_${format(new Date(report.date), 'ddMMyyyy')}.png`, { type: 'image/png' });
        await navigator.share({
          title: getTitle(),
          text: message,
          files: [file],
        });
      } else {
        // Fallback to Zalo link
        window.open(`https://zalo.me/?text=${encodeURIComponent(message)}`, '_blank');
      }
      
      toast({
        title: 'Chia sẻ thành công',
        description: 'Đã mở cửa sổ chia sẻ',
      });
    } catch (error) {
      toast({
        title: 'Lỗi chia sẻ',
        description: 'Không thể chia sẻ báo cáo',
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  const absentByClass = getAbsentByClass();
  const absentByRoom = getAbsentByRoom();

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={exportAsImage} disabled={isExporting}>
          <Image className="h-4 w-4 mr-1" />
          Xuất ảnh
        </Button>
        <Button variant="outline" size="sm" onClick={shareToZalo} disabled={isExporting}>
          <Share2 className="h-4 w-4 mr-1" />
          Zalo
        </Button>
      </div>

      {/* Report content for export */}
      <div ref={reportRef} className="bg-white p-4 sm:p-6 rounded-lg border" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div className="text-center mb-4 pb-4 border-b">
          <h2 className="text-sm text-gray-600">{schoolInfo.name}</h2>
          <h1 className="text-lg font-bold text-primary mt-2">{getTitle()}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ngày {format(new Date(report.date), 'dd/MM/yyyy', { locale: vi })}
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">{report.totalStudents}</p>
            <p className="text-xs text-gray-500">Tổng số</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{report.presentCount}</p>
            <p className="text-xs text-gray-500">Có mặt</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{report.absentCount}</p>
            <p className="text-xs text-gray-500">Vắng</p>
          </div>
        </div>

        {/* Absent table - Study type (by class) */}
        {type === 'study' && report.absentCount > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-gray-800">Danh sách vắng theo lớp</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left w-12">STT</th>
                  <th className="border p-2 text-left w-20">Lớp</th>
                  <th className="border p-2 text-center w-16">SL</th>
                  <th className="border p-2 text-left">Tên vắng (P/KP)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(absentByClass).map(([classId, classStudents], idx) => (
                  <tr key={classId}>
                    <td className="border p-2 text-center">{idx + 1}</td>
                    <td className="border p-2">{getClassName(classId)}</td>
                    <td className="border p-2 text-center">{classStudents.length}</td>
                    <td className="border p-2">
                      {classStudents.map((s, i) => (
                        <span key={s.studentId}>
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
        {type === 'boarding' && report.absentCount > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-gray-800">Danh sách vắng theo phòng</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left w-12">STT</th>
                  <th className="border p-2 text-left w-20">Lớp</th>
                  <th className="border p-2 text-left w-20">Phòng</th>
                  <th className="border p-2 text-center w-16">SL</th>
                  <th className="border p-2 text-left">Tên vắng (P/KP)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(absentByRoom).map(([room, roomStudents], idx) => {
                  // Group by class within room
                  const byClassInRoom: Record<string, typeof roomStudents> = {};
                  roomStudents.forEach((s) => {
                    if (!byClassInRoom[s.classId]) byClassInRoom[s.classId] = [];
                    byClassInRoom[s.classId].push(s);
                  });

                  return Object.entries(byClassInRoom).map(([classId, classStudents], classIdx) => (
                    <tr key={`${room}-${classId}`}>
                      <td className="border p-2 text-center">{idx + classIdx + 1}</td>
                      <td className="border p-2">{getClassName(classId)}</td>
                      <td className="border p-2">{room}</td>
                      <td className="border p-2 text-center">{classStudents.length}</td>
                      <td className="border p-2">
                        {classStudents.map((s, i) => (
                          <span key={s.studentId}>
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
        {type === 'meal' && report.absentCount > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-gray-800">Danh sách vắng</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left w-12">STT</th>
                  <th className="border p-2 text-left">Họ tên</th>
                  <th className="border p-2 text-left w-20">Lớp</th>
                  <th className="border p-2 text-center w-16">Mâm</th>
                  <th className="border p-2 text-center w-16">Phép</th>
                </tr>
              </thead>
              <tbody>
                {report.absentStudents.map((s, idx) => (
                  <tr key={s.studentId}>
                    <td className="border p-2 text-center">{idx + 1}</td>
                    <td className="border p-2">{s.name}</td>
                    <td className="border p-2">{getClassName(s.classId)}</td>
                    <td className="border p-2 text-center">{s.mealGroup}</td>
                    <td className="border p-2 text-center">{s.permission || 'KP'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t text-sm text-gray-500 flex justify-between">
          <span>Người báo cáo: {report.reporterName}</span>
          <span>Lúc {format(new Date(report.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}</span>
        </div>
      </div>
    </div>
  );
}
