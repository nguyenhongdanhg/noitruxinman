import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Settings,
  LayoutDashboard,
  Users,
  BookOpen,
  Home,
  UtensilsCrossed,
  BarChart3,
  UserCog,
  GripVertical,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

interface AppFeature {
  id: string;
  code: string;
  label: string;
  description: string | null;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const iconOptions = [
  { name: 'LayoutDashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { name: 'Users', icon: <Users className="h-4 w-4" /> },
  { name: 'BookOpen', icon: <BookOpen className="h-4 w-4" /> },
  { name: 'Home', icon: <Home className="h-4 w-4" /> },
  { name: 'UtensilsCrossed', icon: <UtensilsCrossed className="h-4 w-4" /> },
  { name: 'BarChart3', icon: <BarChart3 className="h-4 w-4" /> },
  { name: 'UserCog', icon: <UserCog className="h-4 w-4" /> },
  { name: 'Settings', icon: <Settings className="h-4 w-4" /> },
  { name: 'Shield', icon: <Shield className="h-4 w-4" /> },
];

const getIconComponent = (iconName: string | null) => {
  const found = iconOptions.find(i => i.name === iconName);
  return found ? found.icon : <Settings className="h-4 w-4" />;
};

export function FeatureManager() {
  const { toast } = useToast();
  const [features, setFeatures] = useState<AppFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<AppFeature | null>(null);
  const [deletingFeature, setDeletingFeature] = useState<AppFeature | null>(null);
  
  // Form states
  const [formCode, setFormCode] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIconName, setFormIconName] = useState('Settings');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_features')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error fetching features:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách tính năng',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormCode('');
    setFormLabel('');
    setFormDescription('');
    setFormIconName('Settings');
    setFormDisplayOrder(features.length + 1);
    setFormIsActive(true);
    setEditingFeature(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormDisplayOrder(features.length + 1);
    setDialogOpen(true);
  };

  const handleOpenEdit = (feature: AppFeature) => {
    setEditingFeature(feature);
    setFormCode(feature.code);
    setFormLabel(feature.label);
    setFormDescription(feature.description || '');
    setFormIconName(feature.icon_name || 'Settings');
    setFormDisplayOrder(feature.display_order);
    setFormIsActive(feature.is_active);
    setDialogOpen(true);
  };

  const handleOpenDelete = (feature: AppFeature) => {
    setDeletingFeature(feature);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formCode.trim() || !formLabel.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập mã và tên tính năng',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      if (editingFeature) {
        // Update existing
        const { error } = await supabase
          .from('app_features')
          .update({
            code: formCode.trim(),
            label: formLabel.trim(),
            description: formDescription.trim() || null,
            icon_name: formIconName,
            display_order: formDisplayOrder,
            is_active: formIsActive
          })
          .eq('id', editingFeature.id);

        if (error) throw error;
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật tính năng'
        });
      } else {
        // Insert new
        const { error } = await supabase
          .from('app_features')
          .insert({
            code: formCode.trim(),
            label: formLabel.trim(),
            description: formDescription.trim() || null,
            icon_name: formIconName,
            display_order: formDisplayOrder,
            is_active: formIsActive
          });

        if (error) throw error;
        toast({
          title: 'Thành công',
          description: 'Đã thêm tính năng mới'
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchFeatures();
    } catch (error: any) {
      console.error('Error saving feature:', error);
      toast({
        title: 'Lỗi',
        description: error.message?.includes('unique') 
          ? 'Mã tính năng đã tồn tại' 
          : 'Không thể lưu tính năng',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingFeature) return;

    setSaving(true);
    try {
      // First delete related user_permissions
      const { error: permError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('feature', deletingFeature.code);

      if (permError) throw permError;

      // Then delete the feature
      const { error } = await supabase
        .from('app_features')
        .delete()
        .eq('id', deletingFeature.id);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã xóa tính năng'
      });

      setDeleteDialogOpen(false);
      setDeletingFeature(null);
      fetchFeatures();
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa tính năng',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (feature: AppFeature) => {
    try {
      const { error } = await supabase
        .from('app_features')
        .update({ is_active: !feature.is_active })
        .eq('id', feature.id);

      if (error) throw error;

      setFeatures(prev => prev.map(f => 
        f.id === feature.id ? { ...f, is_active: !f.is_active } : f
      ));

      toast({
        title: 'Thành công',
        description: feature.is_active ? 'Đã ẩn tính năng' : 'Đã hiện tính năng'
      });
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Quản lý danh sách tính năng
            </CardTitle>
            <CardDescription>
              Thêm, sửa, xóa các mục phân quyền chức năng
            </CardDescription>
          </div>
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm tính năng
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
              <TableHead className="w-12">Icon</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead>Tên tính năng</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chưa có tính năng nào
                </TableCell>
              </TableRow>
            ) : (
              features.map((feature) => (
                <TableRow key={feature.id} className={!feature.is_active ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{feature.display_order}</TableCell>
                  <TableCell>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      {getIconComponent(feature.icon_name)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{feature.code}</code>
                  </TableCell>
                  <TableCell className="font-medium">{feature.label}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {feature.description || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(feature)}
                      className={feature.is_active ? 'text-success' : 'text-muted-foreground'}
                    >
                      {feature.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(feature)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleOpenDelete(feature)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? 'Chỉnh sửa tính năng' : 'Thêm tính năng mới'}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin tính năng để phân quyền cho người dùng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã tính năng *</Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                  placeholder="VD: report_export"
                  disabled={!!editingFeature}
                />
                <p className="text-xs text-muted-foreground">Mã duy nhất, không có dấu cách</p>
              </div>
              <div className="space-y-2">
                <Label>Tên hiển thị *</Label>
                <Input
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="VD: Xuất báo cáo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Mô tả ngắn về tính năng này..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={formIconName} onValueChange={setFormIconName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.name} value={opt.name}>
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <span>{opt.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Thứ tự hiển thị</Label>
                <Input
                  type="number"
                  value={formDisplayOrder}
                  onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Kích hoạt</Label>
                <p className="text-xs text-muted-foreground">Tính năng này có hiển thị trong danh sách phân quyền</p>
              </div>
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                editingFeature ? 'Cập nhật' : 'Thêm mới'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Xác nhận xóa tính năng
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tính năng <strong>{deletingFeature?.label}</strong>?
              <br />
              <span className="text-destructive">
                Tất cả phân quyền liên quan đến tính năng này sẽ bị xóa.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa tính năng
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
