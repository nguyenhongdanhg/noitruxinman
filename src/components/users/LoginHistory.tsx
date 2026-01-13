import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Monitor, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface LoginRecord {
  id: string;
  user_id: string;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  profile?: {
    full_name: string;
  };
}

interface UserOption {
  id: string;
  full_name: string;
}

export function LoginHistory() {
  const { hasRole } = useAuth();
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');

  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
    fetchLoginHistory();
  }, [isAdmin]);

  useEffect(() => {
    fetchLoginHistory();
  }, [selectedUser]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name');
    
    if (data) {
      setUsers(data);
    }
  };

  const fetchLoginHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('login_history')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(100);

      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profile names for each record
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const enrichedData = data.map(record => ({
          ...record,
          profile: profileMap.get(record.user_id)
        }));

        setLoginHistory(enrichedData);
      } else {
        setLoginHistory([]);
      }
    } catch (error) {
      console.error('Error fetching login history:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return 'Không xác định';
    
    // Simple parsing for common browsers
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    
    return 'Trình duyệt khác';
  };

  const getDeviceType = (ua: string | null): string => {
    if (!ua) return 'Không xác định';
    
    if (ua.includes('Mobile') || ua.includes('Android')) return 'Di động';
    if (ua.includes('Tablet') || ua.includes('iPad')) return 'Máy tính bảng';
    
    return 'Máy tính';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Lịch sử đăng nhập
            </CardTitle>
            <CardDescription>
              Theo dõi hoạt động đăng nhập {isAdmin ? 'của tất cả người dùng' : 'của bạn'}
            </CardDescription>
          </div>
          {isAdmin && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo người dùng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có lịch sử đăng nhập
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">STT</TableHead>
                {isAdmin && <TableHead>Người dùng</TableHead>}
                <TableHead>Thời gian</TableHead>
                <TableHead>Thiết bị</TableHead>
                <TableHead>Trình duyệt</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loginHistory.map((record, index) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  {isAdmin && (
                    <TableCell className="font-medium">
                      {record.profile?.full_name || 'Không xác định'}
                    </TableCell>
                  )}
                  <TableCell>
                    {format(new Date(record.login_at), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      {getDeviceType(record.user_agent)}
                    </div>
                  </TableCell>
                  <TableCell>{parseUserAgent(record.user_agent)}</TableCell>
                  <TableCell>
                    {record.success ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Thành công
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Thất bại
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
