import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Student } from '@/types';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ExcelImport() {
  const { setStudents, students } = useApp();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    // Tạo file CSV với định dạng chuẩn Excel
    const headers = [
      'A: STT',
      'B: Họ và tên', 
      'C: Ngày sinh (DD/MM/YYYY)',
      'D: Lớp',
      'E: Phòng ở',
      'F: Mâm ăn'
    ];
    
    const dataHeaders = ['STT', 'Họ và tên', 'Ngày sinh', 'Lớp', 'Phòng ở', 'Mâm ăn'];
    
    const examples = [
      ['1', 'Nguyễn Văn An', '15/05/2010', '6A', 'P101', 'M1'],
      ['2', 'Trần Thị Bình', '20/08/2010', '6A', 'P102', 'M1'],
      ['3', 'Lê Hoàng Cường', '10/03/2010', '6B', 'P103', 'M2'],
    ];

    // Tạo nội dung với dòng hướng dẫn cột và dữ liệu
    const csvContent = [
      '# HƯỚNG DẪN CỘT: ' + headers.join(' | '),
      dataHeaders.join(','),
      ...examples.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mau_danh_sach_hoc_sinh.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Tải xuống thành công',
      description: 'Mẫu danh sách học sinh đã được tải xuống (file CSV)',
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      
      // Tự động detect separator: tab, dấu phẩy hoặc chấm phẩy
      const firstLine = lines[0];
      // Bỏ qua dòng comment bắt đầu bằng #
      const dataLines = lines.filter(line => !line.trim().startsWith('#'));
      if (dataLines.length === 0) return;
      
      const headerLine = dataLines[0];
      const separator = headerLine.includes('\t') ? '\t' : (headerLine.includes(';') ? ';' : ',');
      
      const newStudents: Student[] = [];

      for (let i = 1; i < dataLines.length; i++) {
        // Xử lý giá trị có dấu ngoặc kép
        const rawValues = dataLines[i].split(separator);
        const values = rawValues.map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length >= 5) {
          const name = values[1]?.trim();
          const dobParts = values[2]?.trim().split('/');
          const classId = values[3]?.trim().toLowerCase().replace(' ', '');
          const room = values[4]?.trim();
          const mealGroup = values[5]?.trim() || 'M1';

          if (name && dobParts?.length === 3) {
            const dateOfBirth = `${dobParts[2]}-${dobParts[1].padStart(2, '0')}-${dobParts[0].padStart(2, '0')}`;
            
            newStudents.push({
              id: `imported-${Date.now()}-${i}`,
              name,
              dateOfBirth,
              classId,
              room,
              mealGroup,
            });
          }
        }
      }

      if (newStudents.length > 0) {
        setStudents([...students, ...newStudents]);
        toast({
          title: 'Nhập dữ liệu thành công',
          description: `Đã thêm ${newStudents.length} học sinh mới`,
        });
      } else {
        toast({
          title: 'Không có dữ liệu',
          description: 'Không tìm thấy dữ liệu hợp lệ trong file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể đọc file. Vui lòng kiểm tra định dạng.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Nhập danh sách từ Excel</h3>
          <p className="text-sm text-muted-foreground">Tải lên file CSV hoặc Excel</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" />
          Tải mẫu nhập
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="gap-2 gradient-primary hover:opacity-90"
        >
          <Upload className="h-4 w-4" />
          {importing ? 'Đang nhập...' : 'Nhập từ file'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-4">
        <p className="text-sm font-medium text-foreground mb-2">Hướng dẫn:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            Tải mẫu nhập để xem định dạng chuẩn
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            Điền thông tin học sinh theo từng dòng
          </li>
          <li className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            Ngày sinh định dạng: DD/MM/YYYY
          </li>
        </ul>
      </div>
    </div>
  );
}
