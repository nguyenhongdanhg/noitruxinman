import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { classes } from '@/data/mockData';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type AppFeature = Database['public']['Enums']['app_feature'];

interface UserWithRoles {
  id: string;
  full_name: string;
  phone: string | null;
  username: string | null;
  email: string | null;
  class_id: string | null;
  roles: AppRole[];
}

interface UserExcelExportProps {
  users: UserWithRoles[];
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  class_teacher: 'GVCN',
  accountant: 'Kế toán',
  kitchen: 'Nhà bếp'
};

const featureLabels: Record<AppFeature, string> = {
  dashboard: 'Tổng quan',
  students: 'Học sinh',
  evening_study: 'Tự học tối',
  boarding: 'Nội trú',
  meals: 'Báo cơm',
  statistics: 'Thống kê',
  user_management: 'Quản lý TK',
  settings: 'Cài đặt'
};

export function UserExcelExport({ users }: UserExcelExportProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      // Fetch all permissions
      const { data: allPermissions, error: permError } = await supabase
        .from('user_permissions')
        .select('*');

      if (permError) {
        console.error('Error fetching permissions:', permError);
      }

      // Create user data with permissions
      const exportData = users.map((user, index) => {
        const userPermissions = (allPermissions || []).filter(p => p.user_id === user.id);
        
        // Build permission string for each feature
        const permissionDetails: Record<string, string> = {};
        Object.keys(featureLabels).forEach((feature) => {
          const perm = userPermissions.find(p => p.feature === feature);
          if (perm) {
            const perms: string[] = [];
            if (perm.can_view) perms.push('Xem');
            if (perm.can_create) perms.push('Thêm');
            if (perm.can_edit) perms.push('Sửa');
            if (perm.can_delete) perms.push('Xóa');
            permissionDetails[`Quyền: ${featureLabels[feature as AppFeature]}`] = perms.length > 0 ? perms.join(', ') : '-';
          } else {
            permissionDetails[`Quyền: ${featureLabels[feature as AppFeature]}`] = '-';
          }
        });

        const className = user.class_id 
          ? classes.find(c => c.id === user.class_id)?.name || user.class_id 
          : '';

        return {
          'STT': index + 1,
          'Họ và tên': user.full_name,
          'Tài khoản đăng nhập': user.username || (user.phone ? `SĐT: ${user.phone}` : `Email: ${user.email}`),
          'Email': user.email || '',
          'Số điện thoại': user.phone || '',
          'Vai trò': user.roles.map(r => roleLabels[r]).join(', '),
          'Lớp chủ nhiệm': className,
          ...permissionDetails
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách người dùng');

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;

      // Generate filename with date
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
      const filename = `Danh_sach_nguoi_dung_${dateStr}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Xuất Excel thành công',
        description: `Đã tải file ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xuất file Excel',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Xuất Excel</h3>
          <p className="text-sm text-muted-foreground">Tải danh sách người dùng và quyền hạn</p>
        </div>
      </div>
      <Button 
        onClick={handleExport} 
        disabled={exporting || users.length === 0}
        variant="outline"
        className="gap-2"
      >
        {exporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang xuất...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Xuất {users.length} người dùng
          </>
        )}
      </Button>
    </div>
  );
}