import { useLocation } from 'react-router-dom';
import { School } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const pageTitles: Record<string, string> = {
  '/': 'Tổng quan',
  '/students': 'Danh sách học sinh',
  '/evening-study': 'Điểm danh tự học',
  '/boarding': 'Điểm danh nội trú',
  '/meals': 'Báo cáo bữa ăn',
  '/statistics': 'Thống kê',
  '/users': 'Quản lý tài khoản',
  '/settings': 'Cài đặt',
  '/menu': 'Menu',
};

export function MobileHeader() {
  const location = useLocation();
  const { schoolInfo } = useApp();
  
  const pageTitle = pageTitles[location.pathname] || 'Quản lý Nội trú';

  return (
    <header className="sticky top-0 z-40 bg-sidebar border-b border-sidebar-border md:hidden safe-area-top">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary flex-shrink-0">
          <School className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-sidebar-foreground truncate">
            {pageTitle}
          </h1>
          <p className="text-xs text-sidebar-foreground/60 truncate">
            {schoolInfo.name}
          </p>
        </div>
      </div>
    </header>
  );
}
