import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDutySchedule } from '@/hooks/useDutySchedule';
import { format, getDaysInMonth, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DutyExcelImportProps {
  selectedMonth: Date;
  onImportComplete?: () => void;
}

export function DutyExcelImport({ selectedMonth, onImportComplete }: DutyExcelImportProps) {
  const { toast } = useToast();
  const { bulkAddDuty, isBulkAdding } = useDutySchedule();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const downloadTemplate = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;
    const daysInMonth = getDaysInMonth(selectedMonth);
    
    // Create header row with day numbers
    const headers = ['STT', 'Họ và tên'];
    const dayLabels: string[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = getDay(date);
      const isSunday = dayOfWeek === 0;
      // Mark Sundays in header
      headers.push(isSunday ? `${day} (CN)` : `${day}`);
      dayLabels.push(isSunday ? 'CN' : format(date, 'EEEEEE', { locale: vi }));
    }

    // Create CSV content
    const rows: string[] = [];
    
    // Title row
    rows.push(`Lịch trực tháng ${month}/${year}`);
    rows.push('');
    
    // Header row
    rows.push(headers.join(','));
    
    // Day of week row (optional guide)
    rows.push(['', '', ...dayLabels].join(','));
    
    // Empty rows for teacher data
    for (let i = 1; i <= 10; i++) {
      const row = [i.toString(), `Giáo viên ${i}`];
      for (let day = 1; day <= daysInMonth; day++) {
        row.push(''); // Empty cell - put 'x' or '✓' for duty days
      }
      rows.push(row.join(','));
    }

    // Instructions
    rows.push('');
    rows.push('# Hướng dẫn: Đánh dấu x hoặc ✓ vào ô tương ứng với ngày trực');
    rows.push('# Các cột có (CN) là ngày Chủ nhật');
    rows.push('# Xóa các dòng hướng dẫn này trước khi upload');

    const BOM = '\uFEFF';
    const csvContent = BOM + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mau_lich_truc_thang_${month}_${year}.csv`;
    link.click();
    
    toast({
      title: 'Đã tải mẫu',
      description: 'File mẫu lịch trực đã được tải về',
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      // Find header row (contains STT)
      let headerIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('stt')) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) {
        throw new Error('Không tìm thấy dòng tiêu đề (STT)');
      }

      // Parse header to find day columns
      const separator = lines[headerIndex].includes(';') ? ';' : ',';
      const headers = lines[headerIndex].split(separator).map(h => h.trim().replace(/"/g, ''));
      
      // Find day columns (columns after "Họ và tên")
      const nameColIndex = headers.findIndex(h => h.toLowerCase().includes('họ và tên') || h.toLowerCase().includes('ho va ten'));
      if (nameColIndex === -1) {
        throw new Error('Không tìm thấy cột "Họ và tên"');
      }

      // Parse duty data
      const duties: { teacher_name: string; duty_date: string }[] = [];
      
      // Skip header and day-of-week row if present
      const dataStartIndex = headerIndex + 1;
      
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#') || !line.trim()) continue;
        
        const cols = line.split(separator).map(c => c.trim().replace(/"/g, ''));
        const teacherName = cols[nameColIndex];
        
        if (!teacherName || teacherName.toLowerCase().includes('thứ') || teacherName.toLowerCase().includes('cn')) {
          continue; // Skip day-of-week row
        }

        // Check each day column
        for (let dayCol = nameColIndex + 1; dayCol < cols.length; dayCol++) {
          const cellValue = cols[dayCol];
          const headerValue = headers[dayCol];
          
          // Extract day number from header
          const dayMatch = headerValue?.match(/\d+/);
          if (!dayMatch) continue;
          
          const day = parseInt(dayMatch[0], 10);
          if (day < 1 || day > 31) continue;

          // Check if marked as duty
          if (cellValue && (cellValue.toLowerCase() === 'x' || cellValue === '✓' || cellValue === '✔' || cellValue === '1')) {
            const dutyDate = format(new Date(year, month - 1, day), 'yyyy-MM-dd');
            duties.push({
              teacher_name: teacherName,
              duty_date: dutyDate,
            });
          }
        }
      }

      if (duties.length === 0) {
        throw new Error('Không tìm thấy dữ liệu lịch trực trong file');
      }

      await bulkAddDuty(duties);

      toast({
        title: 'Nhập lịch trực thành công',
        description: `Đã nhập ${duties.length} lượt trực cho tháng ${month}/${year}`,
      });

      onImportComplete?.();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Lỗi nhập file',
        description: error instanceof Error ? error.message : 'Định dạng file không đúng',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={downloadTemplate}>
        <Download className="h-4 w-4 mr-2" />
        Tải mẫu
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting || isBulkAdding}
      >
        {(isImporting || isBulkAdding) ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        Tải lên lịch trực
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
