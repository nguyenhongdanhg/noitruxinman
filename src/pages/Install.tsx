import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle2, Smartphone, Monitor, Share, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Đã cài đặt thành công!</CardTitle>
            <CardDescription>
              Ứng dụng đã được cài đặt trên thiết bị của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} className="w-full">
              Mở ứng dụng
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 mb-4">
            <img 
              src="/pwa-512x512.png" 
              alt="App Icon" 
              className="w-full h-full rounded-2xl shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl">Cài đặt ứng dụng</CardTitle>
          <CardDescription>
            Cài đặt ứng dụng lên màn hình chính để truy cập nhanh hơn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <span>Truy cập nhanh từ màn hình chính</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Monitor className="h-4 w-4 text-primary" />
              </div>
              <span>Giao diện toàn màn hình như app thật</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <span>Hoạt động offline khi không có mạng</span>
            </div>
          </div>

          {/* Install Instructions */}
          {isIOS ? (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">Hướng dẫn cài đặt trên iPhone/iPad:</p>
              <ol className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Nhấn nút <Share className="inline h-4 w-4" /> Chia sẻ ở thanh trình duyệt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Cuộn xuống và chọn "Thêm vào Màn hình chính"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Nhấn "Thêm" ở góc phải trên</span>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Cài đặt ứng dụng
            </Button>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">Hướng dẫn cài đặt trên Android:</p>
              <ol className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Nhấn nút <MoreVertical className="inline h-4 w-4" /> Menu ở góc phải trên</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Xác nhận cài đặt</span>
                </li>
              </ol>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="w-full"
          >
            Tiếp tục sử dụng trên trình duyệt
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
