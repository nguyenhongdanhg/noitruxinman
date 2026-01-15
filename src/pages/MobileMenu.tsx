import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  BarChart3,
  Settings,
  UserCog,
  LogOut,
  ChevronRight,
  School,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function MobileMenu() {
  const { hasRole, profile, signOut } = useAuth();

  const isAdmin = hasRole('admin');

  const menuItems = [
    { icon: Users, label: 'Danh sách học sinh', path: '/students', show: true },
    { icon: BarChart3, label: 'Thống kê tổng hợp', path: '/statistics', show: true },
    { icon: UserCog, label: 'Quản lý tài khoản', path: '/users', show: isAdmin },
    { icon: Settings, label: 'Cài đặt hệ thống', path: '/settings', show: true },
  ];

  const visibleMenuItems = menuItems.filter(item => item.show);

  const getRoleBadges = () => {
    const badges = [];
    if (hasRole('admin')) {
      badges.push(<Badge key="admin" variant="destructive" className="text-xs">Quản trị viên</Badge>);
    }
    if (hasRole('class_teacher')) {
      badges.push(<Badge key="class_teacher" variant="default" className="text-xs">GVCN</Badge>);
    }
    if (hasRole('accountant')) {
      badges.push(<Badge key="accountant" className="text-xs bg-green-500 text-white">Kế toán</Badge>);
    }
    if (hasRole('kitchen')) {
      badges.push(<Badge key="kitchen" className="text-xs bg-orange-500 text-white">Nhà bếp</Badge>);
    }
    if (badges.length === 0 && hasRole('teacher')) {
      badges.push(<Badge key="teacher" variant="secondary" className="text-xs">Giáo viên</Badge>);
    }
    return badges;
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* User Profile Card */}
      {profile && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
              <School className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground truncate">
                {profile.full_name}
              </p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {getRoleBadges()}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Menu Items */}
      <Card className="divide-y divide-border">
        {visibleMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">
              {item.label}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </Card>

      {/* Logout Button */}
      <Card className="overflow-hidden">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 px-4 py-3.5 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 flex-shrink-0">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">Đăng xuất</span>
        </Button>
      </Card>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">Thiết kế bởi</p>
        <p className="text-sm font-medium text-foreground">Thầy Nguyễn Hồng Dân</p>
        <p className="text-xs text-primary">Zalo: 0888 770 699</p>
      </div>
    </div>
  );
}
