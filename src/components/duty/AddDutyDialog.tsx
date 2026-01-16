import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDutySchedule, DutySchedule } from '@/hooks/useDutySchedule';
import { useToast } from '@/hooks/use-toast';

interface AddDutyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDuty?: DutySchedule | null;
  defaultDate?: Date;
}

export function AddDutyDialog({ open, onOpenChange, editingDuty, defaultDate }: AddDutyDialogProps) {
  const { toast } = useToast();
  const { addDuty, updateDuty, isAdding } = useDutySchedule();
  
  const [teacherName, setTeacherName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingDuty) {
      setTeacherName(editingDuty.teacher_name);
      setSelectedDate(new Date(editingDuty.duty_date));
      setNotes(editingDuty.notes || '');
    } else {
      setTeacherName('');
      setSelectedDate(defaultDate);
      setNotes('');
    }
  }, [editingDuty, defaultDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teacherName.trim() || !selectedDate) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tên người trực và chọn ngày',
        variant: 'destructive',
      });
      return;
    }

    try {
      const dutyData = {
        teacher_name: teacherName.trim(),
        duty_date: format(selectedDate, 'yyyy-MM-dd'),
        notes: notes.trim() || undefined,
      };

      if (editingDuty) {
        await updateDuty({ id: editingDuty.id, ...dutyData });
        toast({
          title: 'Đã cập nhật',
          description: 'Lịch trực đã được cập nhật',
        });
      } else {
        await addDuty(dutyData);
        toast({
          title: 'Đã thêm',
          description: 'Đã thêm lịch trực mới',
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể lưu lịch trực',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingDuty ? 'Sửa lịch trực' : 'Thêm lịch trực'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacherName">Tên người trực *</Label>
            <Input
              id="teacherName"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Nhập tên giáo viên"
            />
          </div>

          <div className="space-y-2">
            <Label>Ngày trực *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={vi}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm (tùy chọn)"
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingDuty ? 'Cập nhật' : 'Thêm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
