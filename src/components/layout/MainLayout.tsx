import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { MobileNavigation } from './MobileNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      {!isMobile && (
        <>
          <Sidebar />
          <div className="ml-64 transition-all duration-300">
            <Header />
            <main className="p-6">
              {children}
            </main>
          </div>
        </>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <>
          <MobileHeader />
          <main className="px-3 py-4 pb-20">
            {children}
          </main>
          <MobileNavigation />
        </>
      )}
    </div>
  );
}
