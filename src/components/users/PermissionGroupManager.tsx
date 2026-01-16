import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FolderKey, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Save,
  Eye,
  Users,
  Settings,
  LayoutDashboard,
  BookOpen,
  Home,
  UtensilsCrossed,
  BarChart3,
  UserCog,
  Shield
} from 'lucide-react';

interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface GroupPermission {
  feature_code: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface AppFeature {
  id: string;
  code: string;
  label: string;
  description: string | null;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
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

export function PermissionGroupManager() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [features, setFeatures] = useState<AppFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  // Form states
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupPermissions, setGroupPermissions] = useState<GroupPermission[]>([]);
  const [deletingGroup, setDeletingGroup] = useState<PermissionGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, featuresRes, userGroupsRes] = await Promise.all([
        supabase.from('permission_groups').select('*').order('name'),
        supabase.from('app_features').select('*').eq('is_active', true).order('display_order'),
        supabase.from('user_permission_groups').select('group_id')
      ]);

      if (groupsRes.error) throw groupsRes.error;
      if (featuresRes.error) throw featuresRes.error;
      if (userGroupsRes.error) throw userGroupsRes.error;

      setGroups(groupsRes.data || []);
      setFeatures(featuresRes.data || []);

      // Count users per group
      const counts: Record<string, number> = {};
      (userGroupsRes.data || []).forEach(ug => {
        counts[ug.group_id] = (counts[ug.group_id] || 0) + 1;
      });
      setUserCounts(counts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu nhóm quyền',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setGroupName('');
    setGroupDescription('');
    setCreateDialogOpen(true);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên nhóm quyền',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('permission_groups')
        .insert({ name: groupName.trim(), description: groupDescription.trim() || null });

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã tạo nhóm quyền mới'
      });
      setCreateDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: 'Lỗi',
        description: error.message?.includes('duplicate') ? 'Tên nhóm đã tồn tại' : 'Không thể tạo nhóm quyền',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (group: PermissionGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setEditDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!editingGroup || !groupName.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên nhóm quyền',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('permission_groups')
        .update({ name: groupName.trim(), description: groupDescription.trim() || null })
        .eq('id', editingGroup.id);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật nhóm quyền'
      });
      setEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast({
        title: 'Lỗi',
        description: error.message?.includes('duplicate') ? 'Tên nhóm đã tồn tại' : 'Không thể cập nhật nhóm quyền',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPermissions = async (group: PermissionGroup) => {
    setEditingGroup(group);
    
    // Fetch existing permissions for this group
    const { data: permData, error } = await supabase
      .from('permission_group_permissions')
      .select('*')
      .eq('group_id', group.id);

    if (error) {
      console.error('Error fetching group permissions:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải quyền của nhóm',
        variant: 'destructive'
      });
      return;
    }

    // Initialize permissions for all features
    const perms: GroupPermission[] = features.map(f => {
      const existing = permData?.find(p => p.feature_code === f.code);
      return existing ? {
        feature_code: f.code,
        can_view: existing.can_view,
        can_create: existing.can_create,
        can_edit: existing.can_edit,
        can_delete: existing.can_delete
      } : {
        feature_code: f.code,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false
      };
    });
    
    setGroupPermissions(perms);
    setPermissionDialogOpen(true);
  };

  const handlePermissionChange = (featureCode: string, action: keyof GroupPermission, value: boolean) => {
    setGroupPermissions(prev => prev.map(p => {
      if (p.feature_code === featureCode) {
        if (action !== 'can_view' && value && !p.can_view) {
          return { ...p, [action]: value, can_view: true };
        }
        if (action === 'can_view' && !value) {
          return { ...p, can_view: false, can_create: false, can_edit: false, can_delete: false };
        }
        return { ...p, [action]: value };
      }
      return p;
    }));
  };

  const handleSelectAllForFeature = (featureCode: string, selectAll: boolean) => {
    setGroupPermissions(prev => prev.map(p => {
      if (p.feature_code === featureCode) {
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

  const handleSaveGroupPermissions = async () => {
    if (!editingGroup) return;

    setSaving(true);
    try {
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('permission_group_permissions')
        .delete()
        .eq('group_id', editingGroup.id);

      if (deleteError) throw deleteError;

      // Insert new permissions
      const toInsert = groupPermissions
        .filter(p => p.can_view || p.can_create || p.can_edit || p.can_delete)
        .map(p => ({
          group_id: editingGroup.id,
          feature_code: p.feature_code,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete
        }));

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('permission_group_permissions')
          .insert(toInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Thành công',
        description: 'Đã lưu quyền cho nhóm'
      });
      setPermissionDialogOpen(false);
    } catch (error) {
      console.error('Error saving group permissions:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu quyền',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = (group: PermissionGroup) => {
    setDeletingGroup(group);
    setDeleteDialogOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('permission_groups')
        .delete()
        .eq('id', deletingGroup.id);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã xóa nhóm quyền'
      });
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa nhóm quyền',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getFeatureInfo = (featureCode: string) => {
    return features.find(f => f.code === featureCode);
  };

  const hasAnyPermission = (permission: GroupPermission) => {
    return permission.can_view || permission.can_create || permission.can_edit || permission.can_delete;
  };

  const hasAllPermissions = (permission: GroupPermission) => {
    return permission.can_view && permission.can_create && permission.can_edit && permission.can_delete;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FolderKey className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Nhóm quyền</CardTitle>
                <CardDescription>Tạo và quản lý các nhóm quyền, sau đó gán người dùng vào nhóm</CardDescription>
              </div>
            </div>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo nhóm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có nhóm quyền nào. Bấm "Tạo nhóm mới" để bắt đầu.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nhóm</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-center">Số người dùng</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FolderKey className="h-4 w-4 text-primary" />
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {group.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {userCounts[group.id] || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPermissions(group)}
                          title="Cấu hình quyền"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(group)}
                          title="Sửa thông tin"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenDelete(group)}
                          title="Xóa nhóm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderKey className="h-5 w-5 text-primary" />
              Tạo nhóm quyền mới
            </DialogTitle>
            <DialogDescription>
              Nhập tên và mô tả cho nhóm quyền
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên nhóm *</Label>
              <Input 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="VD: Giáo viên bộ môn"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea 
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Mô tả ngắn về nhóm quyền này"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateGroup} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo nhóm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Sửa nhóm quyền
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin nhóm quyền
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên nhóm *</Label>
              <Input 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="VD: Giáo viên bộ môn"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea 
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Mô tả ngắn về nhóm quyền này"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveGroup} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Cấu hình quyền cho nhóm: {editingGroup?.name}
            </DialogTitle>
            <DialogDescription>
              Chọn các quyền mà người dùng trong nhóm này sẽ có
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Tính năng</TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">Xem</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <Plus className="h-4 w-4" />
                        <span className="text-xs">Tạo</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <Pencil className="h-4 w-4" />
                        <span className="text-xs">Sửa</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <Trash2 className="h-4 w-4" />
                        <span className="text-xs">Xóa</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[80px]">Tất cả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupPermissions.map((permission) => {
                    const featureInfo = getFeatureInfo(permission.feature_code);
                    const allChecked = hasAllPermissions(permission);
                    
                    return (
                      <TableRow key={permission.feature_code} className={hasAnyPermission(permission) ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                              {getIcon(featureInfo?.icon_name || null)}
                            </div>
                            <div>
                              <div className="font-medium">{featureInfo?.label || permission.feature_code}</div>
                              <div className="text-xs text-muted-foreground">{featureInfo?.description || ''}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_view}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.feature_code, 'can_view', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_create}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.feature_code, 'can_create', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_edit}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.feature_code, 'can_edit', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_delete}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.feature_code, 'can_delete', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={allChecked}
                            onCheckedChange={(checked) => 
                              handleSelectAllForFeature(permission.feature_code, checked as boolean)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveGroupPermissions} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu quyền
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Xác nhận xóa nhóm quyền
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa nhóm quyền <span className="font-semibold">{deletingGroup?.name}</span>?
              <br />
              <span className="text-destructive font-medium">
                Người dùng trong nhóm này sẽ mất các quyền được gán từ nhóm.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGroup} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa nhóm
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
