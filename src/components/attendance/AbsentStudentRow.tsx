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
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{student.name}</p>
        <p className="text-xs text-muted-foreground">
          Lớp {getClassName(student.classId)} • Phòng {student.room} • Mâm {student.mealGroup}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Permission Radio */}
        <RadioGroup
          value={permission}
          onValueChange={(value) => onPermissionChange(value as 'P' | 'KP')}
          className="flex gap-3"
        >
          <div className="flex items-center space-x-1.5">
            <RadioGroupItem value="P" id={`p-${student.id}`} />
            <Label 
              htmlFor={`p-${student.id}`} 
              className="text-sm font-medium text-success cursor-pointer"
            >
              P
            </Label>
          </div>
          <div className="flex items-center space-x-1.5">
            <RadioGroupItem value="KP" id={`kp-${student.id}`} />
            <Label 
              htmlFor={`kp-${student.id}`} 
              className="text-sm font-medium text-destructive cursor-pointer"
            >
              KP
            </Label>
          </div>
        </RadioGroup>
        
        <Input
          placeholder="Lý do vắng..."
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="w-full sm:w-40"
        />
      </div>
    </div>
  );
}
