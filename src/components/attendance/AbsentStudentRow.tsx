import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Student } from '@/types';

interface AbsentStudentRowProps {
  student: Student;
  getClassName: (classId: string) => string;
  reason: string;
  permission: 'P' | 'KP';
  onReasonChange: (value: string) => void;
  onPermissionChange: (value: 'P' | 'KP') => void;
}

export function AbsentStudentRow({
  student,
  getClassName,
  reason,
  permission,
  onReasonChange,
  onPermissionChange,
}: AbsentStudentRowProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-3 rounded-xl sm:rounded-lg bg-destructive/5 border-2 sm:border border-destructive/30 sm:border-destructive/20">
      {/* Student Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-base sm:text-sm">{student.name}</p>
        <p className="text-sm sm:text-xs text-muted-foreground mt-0.5">
          Lớp {getClassName(student.classId)} • Phòng {student.room} • Mâm {student.mealGroup}
        </p>
      </div>
      
      {/* Permission + Reason Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Permission Radio - Larger touch targets */}
        <RadioGroup
          value={permission}
          onValueChange={(value) => onPermissionChange(value as 'P' | 'KP')}
          className="flex gap-4 sm:gap-3"
        >
          <div className="flex items-center space-x-2 sm:space-x-1.5">
            <RadioGroupItem value="P" id={`p-${student.id}`} className="h-5 w-5 sm:h-4 sm:w-4" />
            <Label 
              htmlFor={`p-${student.id}`} 
              className="text-base sm:text-sm font-semibold text-success cursor-pointer py-1"
            >
              Có phép
            </Label>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-1.5">
            <RadioGroupItem value="KP" id={`kp-${student.id}`} className="h-5 w-5 sm:h-4 sm:w-4" />
            <Label 
              htmlFor={`kp-${student.id}`} 
              className="text-base sm:text-sm font-semibold text-destructive cursor-pointer py-1"
            >
              Không phép
            </Label>
          </div>
        </RadioGroup>
        
        {/* Reason Input - Larger on mobile */}
        <Input
          placeholder="Lý do vắng..."
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="w-full sm:w-44 h-12 sm:h-10 text-base sm:text-sm"
        />
      </div>
    </div>
  );
}
