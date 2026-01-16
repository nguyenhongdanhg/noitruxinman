import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, FolderKey } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
}

interface BulkGroupAssignmentProps {
  userIds: string[];
  userNames: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function BulkGroupAssignment({ 
  userIds, 
  userNames, 
  open, 
  onOpenChange, 
  onSaved 
}: BulkGroupAssignmentProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'add' | 'replace'>('add');

  useEffect(() => {
    if (open) {
      fetchGroups();
      setSelectedGroups([]);
      setMode('add');
    }
  }, [open]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permission_groups')
        .select('id, name, description')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách nhóm quyền',
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
    if (selectedGroups.length === 0) {
      toast({
        title: 'Chưa chọn nhóm quyền',
        description: 'Vui lòng chọn ít nhất một nhóm quyền để gán',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      if (mode === 'replace') {
        // Delete existing assignments for all selected users
        const { error: deleteError } = await supabase
          .from('user_permission_groups')
          .delete()
          .in('user_id', userIds);

        if (deleteError) throw deleteError;
      }

      // Prepare new assignments
      const assignments: { user_id: string; group_id: string }[] = [];
      
      for (const userId of userIds) {
        for (const groupId of selectedGroups) {
          assignments.push({ user_id: userId, group_id: groupId });
        }
      }

      // Insert new assignments (upsert to avoid duplicates)
      const { error: insertError } = await supabase
        .from('user_permission_groups')
        .upsert(assignments, { 
          onConflict: 'user_id,group_id',
          ignoreDuplicates: true 
        });

      if (insertError) throw insertError;

      toast({
        title: 'Thành công',
        description: `Đã gán ${selectedGroups.length} nhóm quyền cho ${userIds.length} người dùng`
      });

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Error saving bulk assignments:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gán nhóm quyền hàng loạt',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKey className="h-5 w-5 text-primary" />
            Gán nhóm quyền hàng loạt
          </DialogTitle>
          <DialogDescription>
            Gán nhóm quyền cho {userIds.length} người dùng đã chọn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Selected users summary */}
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Người dùng đã chọn ({userIds.length})</span>
            </div>
            <div className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
              {userNames.slice(0, 5).join(', ')}
              {userNames.length > 5 && ` và ${userNames.length - 5} người khác...`}
            </div>
          </div>

          {/* Mode selection */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mode-add"
                checked={mode === 'add'}
                onCheckedChange={() => setMode('add')}
              />
              <Label htmlFor="mode-add" className="cursor-pointer">
                Thêm vào quyền hiện có
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mode-replace"
                checked={mode === 'replace'}
                onCheckedChange={() => setMode('replace')}
              />
              <Label htmlFor="mode-replace" className="cursor-pointer text-destructive">
                Thay thế toàn bộ
              </Label>
            </div>
          </div>

          {/* Groups list */}
          <div className="space-y-2">
            <Label>Chọn nhóm quyền để gán</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có nhóm quyền nào. Hãy tạo nhóm quyền trước.
              </p>
            ) : (
              <ScrollArea className="h-[200px] rounded-lg border p-3">
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`bulk-group-${group.id}`}
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={() => handleToggleGroup(group.id)}
                      />
                      <div className="grid gap-0.5">
                        <Label 
                          htmlFor={`bulk-group-${group.id}`} 
                          className="font-medium cursor-pointer"
                        >
                          {group.name}
                        </Label>
                        {group.description && (
                          <p className="text-xs text-muted-foreground">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {selectedGroups.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Đã chọn <span className="font-medium text-foreground">{selectedGroups.length}</span> nhóm quyền
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || selectedGroups.length === 0}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang gán...
              </>
            ) : (
              <>
                <FolderKey className="h-4 w-4 mr-2" />
                Gán cho {userIds.length} người
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
