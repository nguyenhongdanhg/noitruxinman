import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/' },
  { icon: Users, label: 'Học sinh', path: '/students' },
  { icon: GraduationCap, label: 'Giáo viên', path: '/teachers' },
  { icon: BookOpen, label: 'Điểm danh tự học', path: '/evening-study' },
  { icon: Home, label: 'Điểm danh nội trú', path: '/boarding' },
  { icon: Utensils, label: 'Báo cáo bữa ăn', path: '/meals' },
  { icon: BarChart3, label: 'Thống kê', path: '/statistics' },
  { icon: Settings, label: 'Cài đặt', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
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
