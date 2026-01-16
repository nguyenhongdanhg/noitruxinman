import React, { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, CalendarDays, List, Plus } from 'lucide-react';
import { useDutySchedule, DutySchedule as DutyScheduleType } from '@/hooks/useDutySchedule';
import { TodayDutyCard } from '@/components/duty/TodayDutyCard';
import { DutyCalendarView } from '@/components/duty/DutyCalendarView';
import { DutyListView } from '@/components/duty/DutyListView';
import { DutyExcelImport } from '@/components/duty/DutyExcelImport';
import { AddDutyDialog } from '@/components/duty/AddDutyDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

export default function DutySchedulePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingDuty, setEditingDuty] = useState<DutyScheduleType | null>(null);
  const [selectedDayDialogOpen, setSelectedDayDialogOpen] = useState(false);
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: Date; duties: DutyScheduleType[] } | null>(null);

  const { todayDuty, isLoadingToday, useDutyByMonth, canManage } = useDutySchedule();
  const { data: monthDuties = [], isLoading: isLoadingMonth, refetch } = useDutyByMonth(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1
  );

  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

  const handleDayClick = (date: Date, duties: DutyScheduleType[]) => {
    setSelectedDayInfo({ date, duties });
    setSelectedDayDialogOpen(true);
  };

  const handleEditDuty = (duty: DutyScheduleType) => {
    setEditingDuty(duty);
    setAddDialogOpen(true);
    setSelectedDayDialogOpen(false);
  };

  const handleAddFromDay = () => {
    if (selectedDayInfo) {
      setEditingDuty(null);
      setAddDialogOpen(true);
      setSelectedDayDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Today's duty card */}
      <TodayDutyCard duties={todayDuty} isLoading={isLoadingToday} />

      {/* Main schedule card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Lịch trực
            </CardTitle>
            
            {canManage && (
              <div className="flex flex-wrap gap-2">
                <DutyExcelImport 
                  selectedMonth={selectedMonth} 
                  onImportComplete={() => refetch()}
                />
                <Button size="sm" onClick={() => {
                  setEditingDuty(null);
                  setAddDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <h3 className="text-lg font-semibold">
              {format(selectedMonth, "MMMM 'năm' yyyy", { locale: vi })}
            </h3>
            
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* View mode tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list')}>
            <TabsList className="grid w-full max-w-[200px] grid-cols-2">
              <TabsTrigger value="calendar" className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Lịch
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <List className="h-4 w-4" />
                Danh sách
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-4">
              {isLoadingMonth ? (
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </div>
              ) : (
                <DutyCalendarView
                  selectedMonth={selectedMonth}
                  duties={monthDuties}
                  onDayClick={handleDayClick}
                />
              )}
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              {isLoadingMonth ? (
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </div>
              ) : (
                <DutyListView
                  duties={monthDuties}
                  canManage={canManage}
                  onEdit={handleEditDuty}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <AddDutyDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditingDuty(null);
        }}
        editingDuty={editingDuty}
        defaultDate={selectedDayInfo?.date}
      />

      {/* Day detail dialog */}
      <Dialog open={selectedDayDialogOpen} onOpenChange={setSelectedDayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDayInfo && format(selectedDayInfo.date, "EEEE, 'ngày' dd/MM/yyyy", { locale: vi })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDayInfo?.duties.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Không có ai trực ngày này
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayInfo?.duties.map((duty) => (
                  <div 
                    key={duty.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {duty.teacher_name}
                      </Badge>
                      {duty.notes && (
                        <span className="text-sm text-muted-foreground">
                          {duty.notes}
                        </span>
                      )}
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDuty(duty)}
                      >
                        Sửa
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canManage && (
              <Button onClick={handleAddFromDay} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Thêm người trực
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
