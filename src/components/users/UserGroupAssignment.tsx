import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FolderKey, 
  Loader2, 
  Save,
  Users
} from 'lucide-react';

interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
}

interface UserGroupAssignmentProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function UserGroupAssignment({ 
  userId, 
  userName, 
  open, 
  onOpenChange,
  onSaved 
}: UserGroupAssignmentProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, userGroupsRes] = await Promise.all([
        supabase.from('permission_groups').select('id, name, description').order('name'),
        supabase.from('user_permission_groups').select('group_id').eq('user_id', userId)
      ]);

      if (groupsRes.error) throw groupsRes.error;
      if (userGroupsRes.error) throw userGroupsRes.error;

      setGroups(groupsRes.data || []);
      setSelectedGroups((userGroupsRes.data || []).map(ug => ug.group_id));
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

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing group assignments
      const { error: deleteError } = await supabase
        .from('user_permission_groups')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new assignments
      if (selectedGroups.length > 0) {
        const toInsert = selectedGroups.map(groupId => ({
          user_id: userId,
          group_id: groupId
        }));

        const { error: insertError } = await supabase
          .from('user_permission_groups')
          .insert(toInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật nhóm quyền cho người dùng'
      });
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error('Error saving user groups:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu nhóm quyền',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKey className="h-5 w-5 text-primary" />
            Gán nhóm quyền
          </DialogTitle>
          <DialogDescription>
            Chọn các nhóm quyền cho: <span className="font-semibold">{userName}</span>
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có nhóm quyền nào. Hãy tạo nhóm quyền trước.
          </div>
        ) : (
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {groups.map((group) => (
              <div 
                key={group.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedGroups.includes(group.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => handleToggleGroup(group.id)}
              >
                <Checkbox
                  checked={selectedGroups.includes(group.id)}
                  onCheckedChange={() => handleToggleGroup(group.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FolderKey className="h-4 w-4 text-primary" />
                    <span className="font-medium">{group.name}</span>
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 py-2">
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {selectedGroups.length} nhóm được chọn
          </Badge>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
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
  );
}
