import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { classes } from '@/data/mockData';
import { Shield, Users, GraduationCap, Calculator, ChefHat, Loader2 } from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

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

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(['teacher']);
  const [selectedClass, setSelectedClass] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setSelectedRoles(['teacher']);
    setSelectedClass('');
  };

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = async () => {
    if (!email || !password || !fullName) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ email, mật khẩu và họ tên',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Mật khẩu không hợp lệ',
        description: 'Mật khẩu phải có ít nhất 6 ký tự',
        variant: 'destructive',
      });
      return;
    }

    if (selectedRoles.length === 0) {
      toast({
        title: 'Chưa chọn vai trò',
        description: 'Vui lòng chọn ít nhất một vai trò cho tài khoản',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

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
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Không thể tạo tài khoản');
      }

      const userId = authData.user.id;
      const classId = selectedRoles.includes('class_teacher') ? selectedClass || null : null;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          phone: phone || null, 
          class_id: classId,
          full_name: fullName
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Insert roles
      const rolesToInsert = selectedRoles.map(role => ({
        user_id: userId,
        role
      }));

      const { error: rolesError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);

      if (rolesError) {
        console.error('Roles insert error:', rolesError);
      }

      toast({
        title: 'Thành công',
        description: `Đã tạo tài khoản cho ${fullName}`,
      });

      resetForm();
      onOpenChange(false);
      onUserAdded();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tạo tài khoản',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm tài khoản mới</DialogTitle>
          <DialogDescription>
            Tạo tài khoản mới cho giáo viên, kế toán hoặc nhân viên
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input 
                id="email"
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@school.edu.vn"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu <span className="text-destructive">*</span></Label>
              <Input 
                id="password"
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên <span className="text-destructive">*</span></Label>
              <Input 
                id="fullName"
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input 
                id="phone"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Phân quyền chức năng <span className="text-destructive">*</span></Label>
            <div className="space-y-3 rounded-lg border p-4">
              {allRoles.map(({ role, label, description, icon }) => (
                <div key={role} className="flex items-start space-x-3">
                  <Checkbox
                    id={`add-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => handleRoleToggle(role)}
                  />
                  <div className="flex-1 grid gap-1">
                    <div className="flex items-center gap-2">
                      {icon}
                      <Label htmlFor={`add-${role}`} className="font-medium cursor-pointer">
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
