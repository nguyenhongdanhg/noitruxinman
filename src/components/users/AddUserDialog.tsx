import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { classes } from '@/data/mockData';
import { Loader2 } from 'lucide-react';
import { validatePhone, validateName, validateEmail } from '@/lib/validation';

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
  const [selectedClass, setSelectedClass] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setSelectedClass('');
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!email || !password || !fullName) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ email, mật khẩu và họ tên',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      toast({
        title: 'Email không hợp lệ',
        description: 'Vui lòng nhập địa chỉ email hợp lệ',
        variant: 'destructive',
      });
      return;
    }

    // Validate password length
    if (password.length < 6 || password.length > 100) {
      toast({
        title: 'Mật khẩu không hợp lệ',
        description: 'Mật khẩu phải có từ 6 đến 100 ký tự',
        variant: 'destructive',
      });
      return;
    }

    // Validate full name
    if (!validateName(fullName)) {
      toast({
        title: 'Họ tên không hợp lệ',
        description: 'Họ tên phải từ 2-100 ký tự và chỉ chứa chữ cái',
        variant: 'destructive',
      });
      return;
    }

    // Validate phone number if provided
    if (phone && !validatePhone(phone)) {
      toast({
        title: 'Số điện thoại không hợp lệ',
        description: 'Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 0)',
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
      const classId = selectedClass && selectedClass !== '_none' ? selectedClass : null;

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

      toast({
        title: 'Thành công',
        description: `Đã tạo tài khoản cho ${fullName}. Hãy gán nhóm quyền cho người dùng.`,
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
            Tạo tài khoản mới. Sau khi tạo, hãy gán nhóm quyền cho người dùng.
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

          <div className="space-y-2">
            <Label>Lớp chủ nhiệm (nếu là GVCN)</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Không chọn</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
