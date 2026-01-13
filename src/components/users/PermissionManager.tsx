import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Home, 
  UtensilsCrossed, 
  BarChart3, 
  UserCog, 
  Settings,
  Loader2,
  Save,
  Eye,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';

type AppFeature = 'dashboard' | 'students' | 'evening_study' | 'boarding' | 'meals' | 'statistics' | 'user_management' | 'settings';

interface Permission {
  feature: AppFeature;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface UserPermissions {
  user_id: string;
  permissions: Permission[];
}

interface PermissionManagerProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

const features: { id: AppFeature; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: 'dashboard', 
    label: 'Tổng quan', 
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: 'Xem tổng quan hệ thống'
  },
  { 
    id: 'students', 
    label: 'Quản lý học sinh', 
    icon: <Users className="h-4 w-4" />,
    description: 'Quản lý danh sách học sinh theo lớp'
  },
  { 
    id: 'evening_study', 
    label: 'Điểm danh tự học', 
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Điểm danh buổi tự học tối'
  },
  { 
    id: 'boarding', 
    label: 'Điểm danh nội trú', 
    icon: <Home className="h-4 w-4" />,
    description: 'Điểm danh học sinh nội trú'
  },
  { 
    id: 'meals', 
    label: 'Báo cáo bữa ăn', 
    icon: <UtensilsCrossed className="h-4 w-4" />,
    description: 'Quản lý và báo cáo bữa ăn'
  },
  { 
    id: 'statistics', 
    label: 'Thống kê', 
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Xem báo cáo thống kê'
  },
  { 
    id: 'user_management', 
    label: 'Quản lý tài khoản', 
    icon: <UserCog className="h-4 w-4" />,
    description: 'Quản lý người dùng và phân quyền'
  },
  { 
    id: 'settings', 
    label: 'Cài đặt', 
    icon: <Settings className="h-4 w-4" />,
    description: 'Cấu hình hệ thống'
  },
];

const defaultPermissions: Permission[] = features.map(f => ({
  feature: f.id,
  can_view: false,
  can_create: false,
  can_edit: false,
  can_delete: false
}));

export function PermissionManager({ userId, userName, onClose }: PermissionManagerProps) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [userId]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        const mergedPermissions = features.map(f => {
          const existing = data.find(p => p.feature === f.id);
          return existing ? {
            feature: existing.feature as AppFeature,
            can_view: existing.can_view,
            can_create: existing.can_create,
            can_edit: existing.can_edit,
            can_delete: existing.can_delete
          } : {
            feature: f.id,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false
          };
        });
        setPermissions(mergedPermissions);
      } else {
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải quyền của người dùng',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (feature: AppFeature, action: keyof Permission, value: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.feature === feature) {
        // If turning on any action, also turn on view
        if (action !== 'can_view' && value && !p.can_view) {
          return { ...p, [action]: value, can_view: true };
        }
        // If turning off view, turn off all other actions
        if (action === 'can_view' && !value) {
          return { ...p, can_view: false, can_create: false, can_edit: false, can_delete: false };
        }
        return { ...p, [action]: value };
      }
      return p;
    }));
  };

  const handleSelectAllForFeature = (feature: AppFeature, selectAll: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.feature === feature) {
        return {
          ...p,
          can_view: selectAll,
          can_create: selectAll,
          can_edit: selectAll,
          can_delete: selectAll
        };
      }
      return p;
    }));
  };

  const handleSelectAllView = (selectAll: boolean) => {
    setPermissions(prev => prev.map(p => ({
      ...p,
      can_view: selectAll,
      can_create: selectAll ? p.can_create : false,
      can_edit: selectAll ? p.can_edit : false,
      can_delete: selectAll ? p.can_delete : false
    })));
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new permissions (only if at least one action is enabled)
      const permissionsToInsert = permissions
        .filter(p => p.can_view || p.can_create || p.can_edit || p.can_delete)
        .map(p => ({
          user_id: userId,
          feature: p.feature,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete
        }));

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Thành công',
        description: 'Đã lưu phân quyền chi tiết'
      });
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu phân quyền',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getFeatureInfo = (featureId: AppFeature) => {
    return features.find(f => f.id === featureId);
  };

  const hasAnyPermission = (permission: Permission) => {
    return permission.can_view || permission.can_create || permission.can_edit || permission.can_delete;
  };

  const hasAllPermissions = (permission: Permission) => {
    return permission.can_view && permission.can_create && permission.can_edit && permission.can_delete;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Phân quyền cho: {userName}</h3>
          <p className="text-sm text-muted-foreground">Tích chọn từng quyền cho mỗi tính năng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSelectAllView(true)}>
            Chọn tất cả Xem
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSelectAllView(false)}>
            Bỏ tất cả
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Tính năng</TableHead>
              <TableHead className="text-center w-[100px]">
                <div className="flex flex-col items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs">Xem</span>
                </div>
              </TableHead>
              <TableHead className="text-center w-[100px]">
                <div className="flex flex-col items-center gap-1">
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Tạo</span>
                </div>
              </TableHead>
              <TableHead className="text-center w-[100px]">
                <div className="flex flex-col items-center gap-1">
                  <Pencil className="h-4 w-4" />
                  <span className="text-xs">Sửa</span>
                </div>
              </TableHead>
              <TableHead className="text-center w-[100px]">
                <div className="flex flex-col items-center gap-1">
                  <Trash2 className="h-4 w-4" />
                  <span className="text-xs">Xóa</span>
                </div>
              </TableHead>
              <TableHead className="text-center w-[100px]">Tất cả</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => {
              const featureInfo = getFeatureInfo(permission.feature);
              const allChecked = hasAllPermissions(permission);
              
              return (
                <TableRow key={permission.feature} className={hasAnyPermission(permission) ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        {featureInfo?.icon}
                      </div>
                      <div>
                        <div className="font-medium">{featureInfo?.label}</div>
                        <div className="text-xs text-muted-foreground">{featureInfo?.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={permission.can_view}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(permission.feature, 'can_view', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={permission.can_create}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(permission.feature, 'can_create', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={permission.can_edit}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(permission.feature, 'can_edit', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={permission.can_delete}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(permission.feature, 'can_delete', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={allChecked}
                      onCheckedChange={(checked) => 
                        handleSelectAllForFeature(permission.feature, checked as boolean)
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={handleSavePermissions} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu phân quyền
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
