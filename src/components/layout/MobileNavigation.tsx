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
  Menu,
} from 'lucide-react';

export function MobileNavigation() {
  const location = useLocation();
  const { canAccessMeals, canAccessAttendance } = useAuth();

  // Main navigation items for bottom bar (max 5 items)
  const mainNavItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/', show: true },
    { icon: BookOpen, label: 'Tự học', path: '/evening-study', show: canAccessAttendance() },
    { icon: Home, label: 'Nội trú', path: '/boarding', show: canAccessAttendance() },
    { icon: Utensils, label: 'Bữa ăn', path: '/meals', show: canAccessMeals() },
    { icon: Menu, label: 'Thêm', path: '/menu', show: true },
  ];

  const visibleNavItems = mainNavItems.filter(item => item.show).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around py-2 px-1">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 px-1 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-sidebar-primary'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 mb-0.5',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-[10px] font-medium truncate max-w-full',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
