import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Trash2,
  Shield
} from 'lucide-react';

interface AppFeature {
  id: string;
  code: string;
  label: string;
  description: string | null;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
}

interface Permission {
  feature: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface PermissionManagerProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Home: <Home className="h-4 w-4" />,
  UtensilsCrossed: <UtensilsCrossed className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  UserCog: <UserCog className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
};

const getIcon = (iconName: string | null) => {
  return iconName && iconMap[iconName] ? iconMap[iconName] : <Settings className="h-4 w-4" />;
};

export function PermissionManager({ userId, userName, onClose }: PermissionManagerProps) {
  const { toast } = useToast();
  const [features, setFeatures] = useState<AppFeature[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active features from database
      const { data: featuresData, error: featuresError } = await supabase
        .from('app_features')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (featuresError) throw featuresError;
      setFeatures(featuresData || []);

      // Fetch user permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (permissionsError) throw permissionsError;

      // Merge features with permissions
      const mergedPermissions: Permission[] = (featuresData || []).map(f => {
        const existing = permissionsData?.find(p => p.feature === f.code);
        return existing ? {
          feature: f.code,
          can_view: existing.can_view,
          can_create: existing.can_create,
          can_edit: existing.can_edit,
          can_delete: existing.can_delete
        } : {
          feature: f.code,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false
        };
      });
      setPermissions(mergedPermissions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu phân quyền',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (featureCode: string, action: keyof Permission, value: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.feature === featureCode) {
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

  const handleSelectAllForFeature = (featureCode: string, selectAll: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.feature === featureCode) {
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

  const getFeatureInfo = (featureCode: string) => {
    return features.find(f => f.code === featureCode);
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
            {permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Chưa có tính năng nào được cấu hình
                </TableCell>
              </TableRow>
            ) : (
              permissions.map((permission) => {
                const featureInfo = getFeatureInfo(permission.feature);
                const allChecked = hasAllPermissions(permission);
                
                return (
                  <TableRow key={permission.feature} className={hasAnyPermission(permission) ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                          {getIcon(featureInfo?.icon_name || null)}
                        </div>
                        <div>
                          <div className="font-medium">{featureInfo?.label || permission.feature}</div>
                          <div className="text-xs text-muted-foreground">{featureInfo?.description || ''}</div>
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
              })
            )}
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
