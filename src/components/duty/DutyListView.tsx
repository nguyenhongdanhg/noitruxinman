import React from 'react';
import { format, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DutySchedule, useDutySchedule } from '@/hooks/useDutySchedule';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DutyListViewProps {
  duties: DutySchedule[];
  canManage: boolean;
  onEdit?: (duty: DutySchedule) => void;
}

export function DutyListView({ duties, canManage, onEdit }: DutyListViewProps) {
  const { deleteDuty } = useDutySchedule();

  // Group duties by date
  const groupedDuties = duties.reduce((acc, duty) => {
    const date = duty.duty_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(duty);
    return acc;
  }, {} as Record<string, DutySchedule[]>);

  const sortedDates = Object.keys(groupedDuties).sort();

  if (duties.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có lịch trực trong tháng này
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Ngày</TableHead>
            <TableHead className="w-[100px]">Thứ</TableHead>
            <TableHead>Người trực</TableHead>
            <TableHead>Ghi chú</TableHead>
            {canManage && <TableHead className="w-[100px]">Thao tác</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDates.map((dateStr) => {
            const dateDuties = groupedDuties[dateStr];
            const date = new Date(dateStr);
            const dayOfWeek = getDay(date);
            const isSunday = dayOfWeek === 0;

            return dateDuties.map((duty, index) => (
              <TableRow 
                key={duty.id}
                className={cn(isSunday && 'bg-destructive/5')}
              >
                {index === 0 && (
                  <>
                    <TableCell 
                      rowSpan={dateDuties.length}
                      className={cn('font-medium', isSunday && 'text-destructive')}
                    >
                      {format(date, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell 
                      rowSpan={dateDuties.length}
                      className={cn(isSunday && 'text-destructive font-medium')}
                    >
                      {format(date, 'EEEE', { locale: vi })}
                    </TableCell>
                  </>
                )}
                <TableCell>{duty.teacher_name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {duty.notes || '-'}
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit?.(duty)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa lịch trực?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa lịch trực của {duty.teacher_name} ngày {format(date, 'dd/MM/yyyy')}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteDuty(duty.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ));
          })}
        </TableBody>
      </Table>
    </div>
  );
}
