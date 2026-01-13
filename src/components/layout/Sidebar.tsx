import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Home,
  Utensils,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  School,
  UserCog,
  LogOut,
  Calculator,
  ChefHat,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { hasRole, canAccessMeals, canAccessMealStats, canAccessAttendance, profile, signOut } = useAuth();

  const isAdmin = hasRole('admin');

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/', show: true },
    { icon: Users, label: 'Học sinh', path: '/students', show: true },
    { icon: BookOpen, label: 'Điểm danh tự học', path: '/evening-study', show: canAccessAttendance() },
    { icon: Home, label: 'Điểm danh nội trú', path: '/boarding', show: canAccessAttendance() },
    { icon: Utensils, label: 'Báo cáo bữa ăn', path: '/meals', show: canAccessMeals() },
    { icon: BarChart3, label: 'Thống kê', path: '/statistics', show: true },
    { icon: UserCog, label: 'Quản lý tài khoản', path: '/users', show: isAdmin },
    { icon: Settings, label: 'Cài đặt', path: '/settings', show: true },
  ];

  const visibleMenuItems = menuItems.filter(item => item.show);

  const getRoleBadges = () => {
    const badges = [];
    if (hasRole('admin')) {
      badges.push(<Badge key="admin" variant="destructive" className="text-xs">Quản trị viên</Badge>);
    }
    if (hasRole('class_teacher')) {
      badges.push(<Badge key="class_teacher" variant="default" className="text-xs">Giáo viên chủ nhiệm</Badge>);
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
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <School className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold text-sidebar-foreground">Quản lý Nội trú</h1>
              <p className="text-xs text-sidebar-foreground/60">Xín Mần</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && profile && (
        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile.full_name}
            </p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {getRoleBadges()}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-4 px-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'animate-scale-in')} />
                  {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-24 left-0 right-0 px-3">
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            'w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'justify-center px-2' : 'justify-start gap-3'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </Button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/60">Thiết kế bởi</p>
            <p className="text-sm font-medium text-sidebar-foreground">Thầy Nguyễn Hồng Dân</p>
            <p className="text-xs text-sidebar-primary">Zalo: 0888 770 699</p>
          </div>
        </div>
      )}
    </aside>
  );
}