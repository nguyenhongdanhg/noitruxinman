import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { School, Loader2, User, Phone, ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user, loading, signIn, signInByLogin, signUp } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Login form state - now uses username/phone instead of email
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  // Forgot password form state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check if login identifier is an email
    const isEmail = loginIdentifier.includes('@');
    
    let error: Error | null = null;
    if (isEmail) {
      // Login directly with email
      const result = await signIn(loginIdentifier, loginPassword);
      error = result.error;
    } else {
      // Login by username or phone
      const result = await signInByLogin(loginIdentifier, loginPassword);
      error = result.error;
    }
    
    if (error) {
      toast({
        title: 'Lỗi đăng nhập',
        description: error.message === 'Invalid login credentials' 
          ? 'Tên đăng nhập/SĐT/Email hoặc mật khẩu không đúng' 
          : error.message === 'User not found'
          ? 'Không tìm thấy tài khoản với thông tin này'
          : error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Đăng nhập thành công',
        description: 'Chào mừng bạn quay lại!'
      });
    }

    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (registerPassword.length < 6) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu phải có ít nhất 6 ký tự',
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }

    if (!registerUsername && !registerPhone) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên đăng nhập hoặc số điện thoại',
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }

    const { error } = await signUp(registerEmail, registerPassword, registerName, registerUsername, registerPhone);
    
    if (error) {
      toast({
        title: 'Lỗi đăng ký',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Đăng ký thành công',
        description: 'Tài khoản của bạn đã được tạo. Bạn có thể đăng nhập ngay.'
      });
    }

    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    if (error) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Đã gửi email',
        description: 'Vui lòng kiểm tra hộp thư của bạn để đặt lại mật khẩu.'
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    }

    setIsSubmitting(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
                <School className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
              <CardDescription className="mt-2">
                Nhập email để nhận liên kết đặt lại mật khẩu
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi liên kết đặt lại'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <School className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Quản lý Nội trú</CardTitle>
            <CardDescription className="mt-2">
              Trường PTDTNT THCS&THPT Xín Mần
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-identifier">Tên đăng nhập / SĐT / Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-identifier"
                      type="text"
                      placeholder="Nhập tên đăng nhập, SĐT hoặc email"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mật khẩu</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Quên mật khẩu?
                </Button>
              </form>
            </TabsContent>
            
            {/* Registration disabled - accounts are created by admin only */}
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-sm text-muted-foreground space-y-1">
          <p>Liên hệ quản trị viên để được cấp tài khoản</p>
          <p>Thiết kế bởi Thầy giáo Nguyễn Hồng Dân</p>
          <p className="text-primary">Zalo: 0888 770 699</p>
        </CardFooter>
      </Card>
    </div>
  );
}
