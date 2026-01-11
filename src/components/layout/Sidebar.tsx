import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { hasRole, canAccessMeals, profile, signOut } = useAuth();

  const isAdmin = hasRole('admin');
  const canSeeMeals = canAccessMeals();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/', show: true },
    { icon: Users, label: 'Học sinh', path: '/students', show: true },
    { icon: GraduationCap, label: 'Giáo viên', path: '/teachers', show: true },
    { icon: BookOpen, label: 'Điểm danh tự học', path: '/evening-study', show: true },
    { icon: Home, label: 'Điểm danh nội trú', path: '/boarding', show: true },
    { icon: Utensils, label: 'Báo cáo bữa ăn', path: '/meals', show: canSeeMeals },
    { icon: BarChart3, label: 'Thống kê', path: '/statistics', show: true },
    { icon: UserCog, label: 'Quản lý tài khoản', path: '/users', show: isAdmin },
    { icon: Settings, label: 'Cài đặt', path: '/settings', show: true },
  ];

  const visibleMenuItems = menuItems.filter(item => item.show);

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
            <div className="flex gap-1 mt-1">
              {hasRole('admin') && (
                <Badge variant="destructive" className="text-xs">Admin</Badge>
              )}
              {hasRole('class_teacher') && (
                <Badge variant="default" className="text-xs">GVCN</Badge>
              )}
              {hasRole('teacher') && !hasRole('admin') && !hasRole('class_teacher') && (
                <Badge variant="secondary" className="text-xs">Giáo viên</Badge>
              )}
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
