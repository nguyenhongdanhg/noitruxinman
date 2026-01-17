import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classes } from '@/data/mockData';
import { validatePhone, validateName, validateEmail, sanitizeCSVField } from '@/lib/validation';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface UserExcelImportProps {
  onImportComplete: () => void;
}

export function UserExcelImport({ onImportComplete }: UserExcelImportProps) {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    // Tạo file CSV với định dạng chuẩn Excel - không còn cột vai trò
    const headers = [
      'A: STT',
      'B: Email',
      'C: Mật khẩu (tối thiểu 6 ký tự)',
      'D: Họ và tên',
      'E: Số điện thoại',
      'F: Lớp chủ nhiệm (nếu là GVCN)'
    ];
    
    const dataHeaders = ['STT', 'Email', 'Mật khẩu', 'Họ và tên', 'Số điện thoại', 'Lớp chủ nhiệm'];
    
    const examples = [
      ['1', 'giaovien1@school.edu.vn', 'matkhau123', 'Nguyễn Văn An', '0912345678', '6A'],
      ['2', 'giaovien2@school.edu.vn', 'matkhau123', 'Trần Thị Bình', '0923456789', ''],
      ['3', 'ketoan@school.edu.vn', 'matkhau123', 'Lê Văn Cường', '0934567890', ''],
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
    link.download = 'mau_danh_sach_tai_khoan.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Tải xuống thành công',
      description: 'Mẫu danh sách tài khoản đã được tải xuống (file CSV)',
    });
  };

  const parseClassId = (classStr: string): string | null => {
    if (!classStr || classStr.trim() === '') return null;
    
    const normalized = classStr.trim().toLowerCase().replace(/\s+/g, '');
    const found = classes.find(c => c.id === normalized || c.name.toLowerCase() === normalized);
    return found ? found.id : null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'File rỗng',
          description: 'File không có dữ liệu để nhập',
          variant: 'destructive',
        });
        return;
      }

      // Tự động detect separator: tab, dấu phẩy hoặc chấm phẩy
      // Bỏ qua dòng comment bắt đầu bằng #
      const dataLines = lines.filter(line => !line.trim().startsWith('#'));
      if (dataLines.length < 2) {
        toast({
          title: 'File rỗng',
          description: 'File không có dữ liệu để nhập',
          variant: 'destructive',
        });
        return;
      }
      
      const headerLine = dataLines[0];
      const separator = headerLine.includes('\t') ? '\t' : (headerLine.includes(';') ? ';' : ',');

      // Skip header row
      for (let i = 1; i < dataLines.length; i++) {
        // Xử lý giá trị có dấu ngoặc kép
        const rawValues = dataLines[i].split(separator);
        const values = rawValues.map(v => sanitizeCSVField(v.trim().replace(/^"|"$/g, '')));
        
        if (values.length < 4) {
          result.failed++;
          result.errors.push(`Dòng ${i + 1}: Thiếu dữ liệu`);
          continue;
        }

        const email = values[1]?.trim();
        const password = values[2]?.trim();
        const fullName = values[3]?.trim();
        const phone = values[4]?.trim() || null;
        const classStr = values[5]?.trim() || '';

        // Validate required fields
        if (!email || !password || !fullName) {
          result.failed++;
          result.errors.push(`Dòng ${i + 1}: Thiếu email, mật khẩu hoặc họ tên`);
          continue;
        }

        // Validate email format
        if (!validateEmail(email)) {
          result.failed++;
          result.errors.push(`Dòng ${i + 1}: Email không hợp lệ`);
          continue;
        }

        // Validate password length
        if (password.length < 6 || password.length > 100) {
          result.failed++;
          result.errors.push(`Dòng ${i + 1}: Mật khẩu phải có từ 6 đến 100 ký tự`);
          continue;
        }

        // Validate full name
        if (!validateName(fullName)) {
          result.failed++;
          result.errors.push(`Dòng ${i + 1}: Họ tên không hợp lệ (2-100 ký tự, chỉ chữ cái)`);
          continue;
        }

        // Validate phone if provided
        if (phone && !validatePhone(phone)) {
          result.failed++;
          result.errors.push(`Dòng ${i + 1}: Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)`);
          continue;
        }

        try {
          // Create user via Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: {
                full_name: fullName
              }
            }
          });

          if (authError) {
            result.failed++;
            result.errors.push(`Dòng ${i + 1}: ${authError.message}`);
            continue;
          }

          if (!authData.user) {
            result.failed++;
            result.errors.push(`Dòng ${i + 1}: Không thể tạo tài khoản`);
            continue;
          }

          const userId = authData.user.id;
          const classId = parseClassId(classStr);

          // Update profile with additional info
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              phone, 
              class_id: classId,
              full_name: fullName
            })
            .eq('id', userId);

          if (profileError) {
            console.error('Profile update error:', profileError);
          }

          result.success++;
        } catch (err) {
          result.failed++;
          result.errors.push(`Dòng ${i + 1}: Lỗi không xác định`);
        }
      }

      if (result.success > 0) {
        toast({
          title: 'Nhập dữ liệu hoàn tất',
          description: `Thành công: ${result.success} tài khoản${result.failed > 0 ? `, Thất bại: ${result.failed}` : ''}. Hãy gán nhóm quyền cho các tài khoản mới.`,
        });
        onImportComplete();
      } else {
        toast({
          title: 'Không thể nhập dữ liệu',
          description: result.errors.length > 0 ? result.errors[0] : 'Không có tài khoản nào được tạo',
          variant: 'destructive',
        });
      }

      if (result.errors.length > 0) {
        console.log('Import errors:', result.errors);
      }
    } catch (error) {
      console.error('File read error:', error);
      toast({
        title: 'Lỗi đọc file',
        description: 'Không thể đọc file. Vui lòng kiểm tra định dạng CSV.',
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
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Nhập tài khoản từ Excel</h3>
          <p className="text-sm text-muted-foreground">Tải lên file CSV để tạo nhiều tài khoản</p>
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
          className="gap-2"
        >
          {importing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {importing ? 'Đang nhập...' : 'Nhập từ file'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-4">
        <p className="text-sm font-medium text-foreground mb-2">Hướng dẫn:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Cột bắt buộc: Email, Mật khẩu, Họ và tên
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Lớp chủ nhiệm chỉ cần điền khi là GVCN
          </li>
          <li className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            Mật khẩu phải có ít nhất 6 ký tự
          </li>
          <li className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Sau khi nhập, hãy gán nhóm quyền cho tài khoản
          </li>
        </ul>
      </div>
    </div>
  );
}
