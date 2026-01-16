import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useStudents } from '@/hooks/useStudents';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ExcelImport() {
  const { bulkAddStudents } = useStudents();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    // Tạo file CSV với định dạng chuẩn Excel
    const headers = [
      'A: STT',
      'B: Họ và tên', 
      'C: Ngày sinh',
      'D: Giới tính',
      'E: Lớp',
      'F: CCCD',
      'G: Điện thoại',
      'H: Địa chỉ',
      'I: Phòng KTX',
      'J: Mâm ăn'
    ];
    
    const dataHeaders = ['STT', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Lớp', 'CCCD', 'Điện thoại', 'Địa chỉ', 'Phòng KTX', 'Mâm ăn'];
    
    const examples = [
      ['1', 'Nguyễn Văn An', '15/03/2010', 'Nam', '6A', '012345678901', '0987654321', 'Hà Nội', 'P101', 'M1'],
      ['2', 'Trần Thị Bình', '22/07/2010', 'Nữ', '6A', '012345678902', '0987654322', 'Hải Phòng', 'P102', 'M2'],
      ['3', 'Lê Hoàng Cường', '08/11/2010', 'Nam', '6B', '012345678903', '0987654323', 'Hà Nam', 'P103', 'M1'],
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
    link.download = 'mau_danh_sach_hoc_sinh_noi_tru.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Tải xuống thành công',
      description: 'Mẫu danh sách học sinh nội trú đã được tải xuống (file CSV)',
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      
      // Bỏ qua dòng comment bắt đầu bằng #
      const dataLines = lines.filter(line => !line.trim().startsWith('#'));
      if (dataLines.length === 0) return;
      
      const headerLine = dataLines[0];
      const separator = headerLine.includes('\t') ? '\t' : (headerLine.includes(';') ? ';' : ',');
      
      const newStudents: Array<{
        name: string;
        classId: string;
        dateOfBirth: string;
        gender?: string;
        cccd?: string;
        phone?: string;
        address?: string;
        room: string;
        mealGroup: string;
      }> = [];

      for (let i = 1; i < dataLines.length; i++) {
        // Xử lý giá trị có dấu ngoặc kép
        const rawValues = dataLines[i].split(separator);
        const values = rawValues.map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length >= 3) {
          // STT(0), Họ tên(1), Ngày sinh(2), Giới tính(3), Lớp(4), CCCD(5), ĐT(6), Địa chỉ(7), Phòng(8), Mâm(9)
          const name = values[1]?.trim();
          const dateOfBirth = values[2]?.trim() || '';
          const gender = values[3]?.trim() || '';
          const classId = values[4]?.trim().toLowerCase().replace(' ', '');
          const cccd = values[5]?.trim() || '';
          const phone = values[6]?.trim() || '';
          const address = values[7]?.trim() || '';
          const room = values[8]?.trim() || '';
          const mealGroup = values[9]?.trim() || 'M1';

          if (name && classId) {
            newStudents.push({
              name,
              classId,
              dateOfBirth,
              gender,
              cccd,
              phone,
              address,
              room,
              mealGroup,
            });
          }
        }
      }

      if (newStudents.length > 0) {
        await bulkAddStudents(newStudents);
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
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
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
            Cột bắt buộc: Họ tên, Lớp
          </li>
        </ul>
      </div>
    </div>
  );
}
