import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Shield, UserPlus, Pencil, ChefHat, Calculator, GraduationCap, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { classes } from '@/data/mockData';
import { UserExcelImport } from '@/components/users/UserExcelImport';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { LoginHistory } from '@/components/users/LoginHistory';
import { PermissionManager } from '@/components/users/PermissionManager';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRoles {
  id: string;
  full_name: string;
  phone: string | null;
  username: string | null;
  email: string | null;
  class_id: string | null;
  roles: AppRole[];
}

const allRoles: { role: AppRole; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    role: 'admin', 
    label: 'Quản trị viên', 
    description: 'Toàn quyền quản lý hệ thống',
    icon: <Shield className="h-4 w-4 text-destructive" />
  },
  { 
    role: 'class_teacher', 
    label: 'GVCN', 
    description: 'Báo cơm, xem thống kê lớp',
    icon: <GraduationCap className="h-4 w-4 text-primary" />
  },
  { 
    role: 'teacher', 
    label: 'Giáo viên', 
    description: 'Điểm danh, xem thống kê sỹ số',
    icon: <Users className="h-4 w-4 text-blue-500" />
  },
  { 
    role: 'accountant', 
    label: 'Kế toán', 
    description: 'Xem thống kê bữa ăn',
    icon: <Calculator className="h-4 w-4 text-green-500" />
  },
  { 
    role: 'kitchen', 
    label: 'Nhà bếp', 
    description: 'Xem thống kê bữa ăn',
    icon: <ChefHat className="h-4 w-4 text-orange-500" />
  },
];

const roleLabels: Record<AppRole, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  class_teacher: 'GVCN',
  accountant: 'Kế toán',
  kitchen: 'Nhà bếp'
};

const roleBadgeVariants: Record<AppRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  admin: 'destructive',
  teacher: 'secondary',
  class_teacher: 'default',
  accountant: 'outline',
  kitchen: 'outline'
};

export default function UserManagement() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [editingPhone, setEditingPhone] = useState<string>('');
  const [editingName, setEditingName] = useState<string>('');

  // Reset password state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserWithRoles | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Permission manager state
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [permissionUser, setPermissionUser] = useState<UserWithRoles | null>(null);

  const isAdmin = hasRole('admin');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: allRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch emails from auth.users via edge function or RPC
      // For now, we'll use the admin-get-users approach
      const { data: { session } } = await supabase.auth.getSession();
      
      let usersWithEmails: { id: string; email: string }[] = [];
      if (session?.access_token) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-users`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );
          if (response.ok) {
            const result = await response.json();
            usersWithEmails = result.users || [];
          }
        } catch (error) {
          console.log('Could not fetch user emails:', error);
        }
      }

      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const authUser = usersWithEmails.find(u => u.id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          username: profile.username,
          email: authUser?.email || null,
          class_id: profile.class_id,
          roles: (allRolesData || [])
            .filter(r => r.user_id === profile.id)
            .map(r => r.role)
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người dùng',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: UserWithRoles) => {
    setEditingUser(user);
    setSelectedRoles(user.roles);
    setSelectedClass(user.class_id || '');
    setEditingPhone(user.phone || '');
    setEditingName(user.full_name);
    setEditDialogOpen(true);
  };

  const handleOpenResetPassword = (user: UserWithRoles) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setResetPasswordDialogOpen(true);
  };

  const handleOpenPermissions = (user: UserWithRoles) => {
    setPermissionUser(user);
    setPermissionDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;

    if (newPassword.length < 6) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp',
        variant: 'destructive'
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            user_id: resetPasswordUser.id,
            new_password: newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Đặt lại mật khẩu thất bại');
      }

      toast({
        title: 'Thành công',
        description: `Đã đặt lại mật khẩu cho ${resetPasswordUser.full_name}`
      });
      setResetPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu',
        variant: 'destructive'
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveUser = async () => {
    if (!editingUser || !isAdmin) return;

    if (selectedRoles.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ít nhất một vai trò',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Update profile with class_id, phone, and name
      const needsClassId = selectedRoles.includes('class_teacher');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          class_id: needsClassId ? selectedClass || null : null,
          phone: editingPhone || null,
          full_name: editingName
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Delete existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.id);

      if (deleteError) throw deleteError;

      // Insert new roles
      const rolesToInsert = selectedRoles.map(role => ({
        user_id: editingUser.id,
        role
      }));

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);

      if (insertError) throw insertError;

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin người dùng'
      });

      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật người dùng',
        variant: 'destructive'
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý tài khoản</h1>
          <p className="text-muted-foreground mt-2">Bạn không có quyền truy cập trang này</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý tài khoản & Phân quyền</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý giáo viên và phân quyền các chức năng trong hệ thống
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserExcelImport onImportComplete={fetchUsers} />
        
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Thêm tài khoản</h3>
              <p className="text-sm text-muted-foreground">Tạo tài khoản mới thủ công</p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Thêm tài khoản mới
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quản trị viên</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.roles.includes('admin')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GVCN</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.roles.includes('class_teacher')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kế toán</CardTitle>
            <Calculator className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.roles.includes('accountant')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhà bếp</CardTitle>
            <ChefHat className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.roles.includes('kitchen')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Quản lý quyền truy cập của từng người dùng - bấm vào nút sửa để phân quyền
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Tài khoản đăng nhập</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Lớp CN</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Chưa có người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        {user.username ? (
                          <span className="font-medium text-primary">{user.username}</span>
                        ) : user.phone ? (
                          <span className="text-muted-foreground italic">Dùng SĐT</span>
                        ) : (
                          <span className="text-destructive italic">Dùng Email</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <Badge key={role} variant={roleBadgeVariants[role]}>
                            {roleLabels[role]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.class_id ? classes.find(c => c.id === user.class_id)?.name || user.class_id : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPermissions(user)}
                          title="Phân quyền chi tiết"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenResetPassword(user)}
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title="Chỉnh sửa vai trò"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin & quyền</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin và phân quyền cho người dùng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Họ và tên</Label>
              <Input 
                value={editingName} 
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input 
                value={editingPhone} 
                onChange={(e) => setEditingPhone(e.target.value)}
                placeholder="VD: 0912345678"
              />
            </div>

            <div className="space-y-3">
              <Label>Phân quyền chức năng</Label>
              <div className="space-y-3 rounded-lg border p-4">
                {allRoles.map(({ role, label, description, icon }) => (
                  <div key={role} className="flex items-start space-x-3">
                    <Checkbox
                      id={role}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <div className="flex-1 grid gap-1">
                      <div className="flex items-center gap-2">
                        {icon}
                        <Label htmlFor={role} className="font-medium cursor-pointer">
                          {label}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedRoles.includes('class_teacher') && (
              <div className="space-y-2">
                <Label>Lớp chủ nhiệm</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn lớp" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveUser}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddUserDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onUserAdded={fetchUsers} 
      />

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Đặt lại mật khẩu
            </DialogTitle>
            <DialogDescription>
              Đặt mật khẩu mới cho: <span className="font-semibold">{resetPasswordUser?.full_name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mật khẩu mới</Label>
              <Input 
                type="password"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Xác nhận mật khẩu</Label>
              <Input 
                type="password"
                value={confirmNewPassword} 
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleResetPassword} disabled={isResettingPassword}>
              {isResettingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Đặt lại mật khẩu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login History */}
      <LoginHistory />

      {/* Permission Manager Dialog */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Phân quyền chi tiết theo tính năng
            </DialogTitle>
            <DialogDescription>
              Tích chọn từng quyền riêng lẻ cho mỗi tính năng thay vì phân theo vai trò
            </DialogDescription>
          </DialogHeader>
          {permissionUser && (
            <PermissionManager
              userId={permissionUser.id}
              userName={permissionUser.full_name}
              onClose={() => setPermissionDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}