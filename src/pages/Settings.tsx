import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Settings as SettingsIcon, School, Phone, Mail, MapPin, Save, RefreshCw, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const { schoolInfo, students, teachers, reports, setStudents, setTeachers, setReports } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [schoolName, setSchoolName] = useState(schoolInfo.name);
  const [schoolAddress, setSchoolAddress] = useState(schoolInfo.address || '');
  const [schoolPhone, setSchoolPhone] = useState(schoolInfo.phone || '');
  const [schoolEmail, setSchoolEmail] = useState(schoolInfo.email || '');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    toast({
      title: 'Đã lưu cài đặt',
      description: 'Thông tin trường đã được cập nhật',
    });
  };

  const handleClearData = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác!')) {
      localStorage.clear();
      setStudents([]);
      setTeachers([]);
      setReports([]);
      toast({
        title: 'Đã xóa dữ liệu',
        description: 'Toàn bộ dữ liệu đã được xóa. Tải lại trang để khởi tạo dữ liệu mẫu.',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp',
        variant: 'destructive'
      });
      return;
    }

    setIsChangingPassword(true);

    // First verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword
    });

    if (signInError) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu hiện tại không đúng',
        variant: 'destructive'
      });
      setIsChangingPassword(false);
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Thành công',
        description: 'Mật khẩu đã được thay đổi'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setIsChangingPassword(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-primary" />
          Cài đặt hệ thống
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý thông tin trường và cấu hình hệ thống
        </p>
      </div>

      {/* Change Password */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Đổi mật khẩu
            </CardTitle>
            <CardDescription>
              Thay đổi mật khẩu tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Mật khẩu hiện tại
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Mật khẩu mới
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Xác nhận mật khẩu mới
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="gap-2" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Đổi mật khẩu
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* School Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            Thông tin trường
          </CardTitle>
          <CardDescription>
            Cập nhật thông tin cơ bản của trường học
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tên trường
            </label>
            <Input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Nhập tên trường"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Địa chỉ
            </label>
            <Input
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Số điện thoại
              </label>
              <Input
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input
                type="email"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                placeholder="Nhập email"
              />
            </div>
          </div>

          <Button onClick={handleSaveSettings} className="gap-2 gradient-primary">
            <Save className="h-4 w-4" />
            Lưu thay đổi
          </Button>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê dữ liệu</CardTitle>
          <CardDescription>
            Tổng quan về dữ liệu trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Số học sinh</p>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Số giáo viên</p>
              <p className="text-2xl font-bold text-foreground">{teachers.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Số báo cáo</p>
              <p className="text-2xl font-bold text-foreground">{reports.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
          <CardDescription>
            Các thao tác không thể hoàn tác
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleClearData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Xóa toàn bộ dữ liệu
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Thao tác này sẽ xóa toàn bộ học sinh, giáo viên và báo cáo. Không thể hoàn tác.
          </p>
        </CardContent>
      </Card>

      {/* Credits */}
      <Card className="gradient-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Hệ thống Quản lý Học sinh Nội trú</p>
            <p className="text-primary-foreground/80">
              Thiết kế và phát triển bởi <span className="font-bold">Thầy giáo Nguyễn Hồng Dân</span>
            </p>
            <p className="text-primary-foreground/70 mt-1">
              Zalo: <span className="font-medium">0888 770 699</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
