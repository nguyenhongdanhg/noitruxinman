import { Student, Teacher, ClassInfo, SchoolInfo } from '@/types';

export const schoolInfo: SchoolInfo = {
  name: 'Trường PTDTNT THCS&THPT Xín Mần',
  address: 'Huyện Xín Mần, Tỉnh Hà Giang',
  phone: '0888 770 699',
  email: 'ptdtntxinman@hagiang.edu.vn',
};

export const classes: ClassInfo[] = [
  { id: '6a', name: '6A', grade: 6 },
  { id: '6b', name: '6B', grade: 6 },
  { id: '7a', name: '7A', grade: 7 },
  { id: '7b', name: '7B', grade: 7 },
  { id: '8a', name: '8A', grade: 8 },
  { id: '8b', name: '8B', grade: 8 },
  { id: '8c', name: '8C', grade: 8 },
  { id: '9a', name: '9A', grade: 9 },
  { id: '9b', name: '9B', grade: 9 },
  { id: '10a', name: '10A', grade: 10 },
  { id: '10b', name: '10B', grade: 10 },
  { id: '11a', name: '11A', grade: 11 },
  { id: '11b', name: '11B', grade: 11 },
  { id: '12a', name: '12A', grade: 12 },
  { id: '12b', name: '12B', grade: 12 },
];

export const mockStudents: Student[] = [
  { id: '1', name: 'Nguyễn Văn An', dateOfBirth: '2010-05-15', classId: '6a', room: 'P101', mealGroup: 'M1' },
  { id: '2', name: 'Trần Thị Bình', dateOfBirth: '2010-08-20', classId: '6a', room: 'P102', mealGroup: 'M1' },
  { id: '3', name: 'Lê Hoàng Cường', dateOfBirth: '2010-03-10', classId: '6a', room: 'P101', mealGroup: 'M2' },
  { id: '4', name: 'Phạm Minh Đức', dateOfBirth: '2010-11-25', classId: '6b', room: 'P103', mealGroup: 'M1' },
  { id: '5', name: 'Hoàng Thị E', dateOfBirth: '2010-07-08', classId: '6b', room: 'P104', mealGroup: 'M2' },
  { id: '6', name: 'Vũ Văn Phú', dateOfBirth: '2009-04-12', classId: '7a', room: 'P105', mealGroup: 'M1' },
  { id: '7', name: 'Đặng Thị Giang', dateOfBirth: '2009-09-30', classId: '7a', room: 'P106', mealGroup: 'M1' },
  { id: '8', name: 'Bùi Văn Hải', dateOfBirth: '2009-01-18', classId: '7b', room: 'P107', mealGroup: 'M2' },
  { id: '9', name: 'Ngô Thị Hương', dateOfBirth: '2008-06-22', classId: '8a', room: 'P108', mealGroup: 'M1' },
  { id: '10', name: 'Lý Văn Khoa', dateOfBirth: '2008-12-05', classId: '8a', room: 'P109', mealGroup: 'M2' },
  { id: '11', name: 'Trương Thị Lan', dateOfBirth: '2008-02-28', classId: '8b', room: 'P110', mealGroup: 'M1' },
  { id: '12', name: 'Đinh Văn Minh', dateOfBirth: '2007-08-14', classId: '9a', room: 'P111', mealGroup: 'M1' },
  { id: '13', name: 'Cao Thị Nga', dateOfBirth: '2007-04-19', classId: '9a', room: 'P112', mealGroup: 'M2' },
  { id: '14', name: 'Đỗ Văn Phong', dateOfBirth: '2006-10-07', classId: '10a', room: 'P201', mealGroup: 'M1' },
  { id: '15', name: 'Hồ Thị Quỳnh', dateOfBirth: '2006-05-23', classId: '10b', room: 'P202', mealGroup: 'M1' },
  { id: '16', name: 'Phan Văn Sơn', dateOfBirth: '2005-11-11', classId: '11a', room: 'P203', mealGroup: 'M2' },
  { id: '17', name: 'Võ Thị Tâm', dateOfBirth: '2005-07-16', classId: '11b', room: 'P204', mealGroup: 'M1' },
  { id: '18', name: 'Dương Văn Uy', dateOfBirth: '2004-03-29', classId: '12a', room: 'P205', mealGroup: 'M1' },
  { id: '19', name: 'Lưu Thị Vân', dateOfBirth: '2004-09-02', classId: '12a', room: 'P206', mealGroup: 'M2' },
  { id: '20', name: 'Mai Văn Xuân', dateOfBirth: '2004-01-31', classId: '12b', room: 'P207', mealGroup: 'M1' },
];

export const mockTeachers: Teacher[] = [
  { id: '1', name: 'Nguyễn Hồng Dân', subject: 'Tin học', phone: '0888 770 699' },
  { id: '2', name: 'Trần Văn Bình', subject: 'Toán', phone: '0912345678' },
  { id: '3', name: 'Lê Thị Hoa', subject: 'Ngữ văn', phone: '0923456789' },
  { id: '4', name: 'Phạm Văn Cường', subject: 'Vật lý', phone: '0934567890' },
  { id: '5', name: 'Hoàng Thị Mai', subject: 'Hóa học', phone: '0945678901' },
];
