import { WifiOff, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DatabaseErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function DatabaseErrorFallback({
  error,
  onRetry,
  title = 'Không thể kết nối',
  description = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
}: DatabaseErrorFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <WifiOff className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-muted p-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Database className="h-3 w-3" />
                <span className="font-medium">Chi tiết lỗi:</span>
              </div>
              <p className="mt-1 text-destructive">{error.message}</p>
            </div>
          )}
          <Button onClick={handleRetry} className="w-full" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function InlineErrorMessage({
  message = 'Có lỗi xảy ra khi tải dữ liệu',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
      <WifiOff className="h-5 w-5 text-destructive" />
      <span className="text-destructive">{message}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="ml-2">
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
