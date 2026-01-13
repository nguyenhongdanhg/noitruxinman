import ExcelJS from 'exceljs';
import { format, eachDayOfInterval } from 'date-fns';
import { Student, ClassInfo, Report } from '@/types';

// Common styles
const headerFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4472C4' }
};

const subHeaderFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF8FAADC' }
};

const totalRowFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF2CC' }
};

const alternateFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF2F2F2' }
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

const headerFont: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 10
};

const titleFont: Partial<ExcelJS.Font> = {
  bold: true,
  size: 14,
  color: { argb: 'FF1F4E79' }
};

const subTitleFont: Partial<ExcelJS.Font> = {
  italic: true,
  size: 10,
  color: { argb: 'FF666666' }
};

interface ExportMealSchoolParams {
  dateRange: { start: Date; end: Date };
  reports: Report[];
  students: Student[];
  classes: ClassInfo[];
  schoolInfo: { name: string };
}

export async function exportMealExcelSchoolFormatted({
  dateRange,
  reports,
  students,
  classes,
  schoolInfo
}: ExportMealSchoolParams): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hệ thống quản lý trường học';
  workbook.created = new Date();

  const days = eachDayOfInterval(dateRange);
  const mealReports = reports.filter(r => r.type === 'meal');

  // Sort classes by grade and name
  const sortedClasses = [...classes].sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return a.name.localeCompare(b.name);
  });

  // Determine if landscape is needed based on number of columns
  const totalColumns = 2 + (sortedClasses.length * 3) + 4;
  const isLandscape = totalColumns > 15;

  // ===== SUMMARY SHEET =====
  const summarySheet = workbook.addWorksheet('Tổng hợp', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: isLandscape ? 'landscape' : 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3
      }
    }
  });

  // Title rows
  summarySheet.mergeCells(1, 1, 1, totalColumns);
  const titleCell = summarySheet.getCell(1, 1);
  titleCell.value = `BÁO CÁO THỐNG KÊ BỮA ĂN - ${schoolInfo.name.toUpperCase()}`;
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 25;

  summarySheet.mergeCells(2, 1, 2, totalColumns);
  const dateRangeCell = summarySheet.getCell(2, 1);
  dateRangeCell.value = `Từ ngày: ${format(dateRange.start, 'dd/MM/yyyy')} - Đến ngày: ${format(dateRange.end, 'dd/MM/yyyy')}`;
  dateRangeCell.font = subTitleFont;
  dateRangeCell.alignment = { horizontal: 'center', vertical: 'middle' };

  summarySheet.mergeCells(3, 1, 3, totalColumns);
  const exportTimeCell = summarySheet.getCell(3, 1);
  exportTimeCell.value = `Xuất lúc: ${format(new Date(), 'HH:mm dd/MM/yyyy')} | Chú thích: S = Sáng, T = Trưa, To = Tối`;
  exportTimeCell.font = subTitleFont;
  exportTimeCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Header row 1 - Class names
  const headerRow1 = summarySheet.getRow(5);
  headerRow1.height = 20;
  
  let col = 1;
  summarySheet.getCell(5, col).value = 'STT';
  summarySheet.getCell(5, col).fill = headerFill;
  summarySheet.getCell(5, col).font = headerFont;
  summarySheet.getCell(5, col).border = thinBorder;
  summarySheet.getCell(5, col).alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.mergeCells(5, col, 6, col);
  col++;

  summarySheet.getCell(5, col).value = 'Ngày';
  summarySheet.getCell(5, col).fill = headerFill;
  summarySheet.getCell(5, col).font = headerFont;
  summarySheet.getCell(5, col).border = thinBorder;
  summarySheet.getCell(5, col).alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.mergeCells(5, col, 6, col);
  col++;

  // Class columns with merged headers
  sortedClasses.forEach(cls => {
    const startCol = col;
    summarySheet.getCell(5, col).value = cls.name;
    summarySheet.getCell(5, col).fill = headerFill;
    summarySheet.getCell(5, col).font = headerFont;
    summarySheet.getCell(5, col).alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.mergeCells(5, startCol, 5, startCol + 2);
    
    // Sub-headers S, T, To
    ['S', 'T', 'To'].forEach((label, i) => {
      const subCell = summarySheet.getCell(6, startCol + i);
      subCell.value = label;
      subCell.fill = subHeaderFill;
      subCell.font = { bold: true, size: 9 };
      subCell.border = thinBorder;
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    col += 3;
  });

  // Total columns
  const totalHeaders = ['Tổng S', 'Tổng T', 'Tổng To', 'Gạo (kg)'];
  totalHeaders.forEach((header, i) => {
    const cell = summarySheet.getCell(5, col + i);
    cell.value = header;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    summarySheet.mergeCells(5, col + i, 6, col + i);
  });

  // Apply border to row 5 merged cells
  for (let c = 1; c <= totalColumns; c++) {
    summarySheet.getCell(5, c).border = thinBorder;
  }

  // Set row 6 height
  summarySheet.getRow(6).height = 18;

  // Data rows
  let grandTotalBreakfast = 0;
  let grandTotalLunch = 0;
  let grandTotalDinner = 0;

  days.forEach((day, idx) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayReports = mealReports.filter(r => r.date === dayStr);
    
    const breakfast = dayReports.find(r => r.mealType === 'breakfast');
    const lunch = dayReports.find(r => r.mealType === 'lunch');
    const dinner = dayReports.find(r => r.mealType === 'dinner');

    const rowNum = 7 + idx;
    const row = summarySheet.getRow(rowNum);
    row.height = 18;

    let c = 1;
    
    // STT
    const sttCell = row.getCell(c++);
    sttCell.value = idx + 1;
    sttCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sttCell.border = thinBorder;
    if (idx % 2 === 1) sttCell.fill = alternateFill;

    // Date
    const dateCell = row.getCell(c++);
    dateCell.value = format(day, 'dd/MM/yyyy');
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.border = thinBorder;
    if (idx % 2 === 1) dateCell.fill = alternateFill;

    let totalBreakfast = 0;
    let totalLunch = 0;
    let totalDinner = 0;

    sortedClasses.forEach(cls => {
      const classStudents = students.filter(s => s.classId === cls.id);
      const classTotal = classStudents.length;
      
      const breakfastAbsent = breakfast?.absentStudents.filter(a => a.classId === cls.id).length || 0;
      const lunchAbsent = lunch?.absentStudents.filter(a => a.classId === cls.id).length || 0;
      const dinnerAbsent = dinner?.absentStudents.filter(a => a.classId === cls.id).length || 0;
      
      const classBreakfast = breakfast ? classTotal - breakfastAbsent : 0;
      const classLunch = lunch ? classTotal - lunchAbsent : 0;
      const classDinner = dinner ? classTotal - dinnerAbsent : 0;

      [classBreakfast, classLunch, classDinner].forEach(val => {
        const cell = row.getCell(c++);
        cell.value = val;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder;
        if (idx % 2 === 1) cell.fill = alternateFill;
      });

      totalBreakfast += classBreakfast;
      totalLunch += classLunch;
      totalDinner += classDinner;
    });

    grandTotalBreakfast += totalBreakfast;
    grandTotalLunch += totalLunch;
    grandTotalDinner += totalDinner;

    // Totals
    const totalRice = ((totalLunch + totalDinner) * 0.2);
    [totalBreakfast, totalLunch, totalDinner, parseFloat(totalRice.toFixed(1))].forEach((val, i) => {
      const cell = row.getCell(c++);
      cell.value = val;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
      cell.font = { bold: true };
      if (idx % 2 === 1) cell.fill = alternateFill;
    });
  });

  // Grand total row
  const grandTotalRowNum = 7 + days.length + 1;
  const grandTotalRow = summarySheet.getRow(grandTotalRowNum);
  grandTotalRow.height = 22;

  summarySheet.getCell(grandTotalRowNum, 1).value = '';
  summarySheet.getCell(grandTotalRowNum, 1).fill = totalRowFill;
  summarySheet.getCell(grandTotalRowNum, 1).border = thinBorder;
  
  summarySheet.getCell(grandTotalRowNum, 2).value = 'TỔNG CỘNG';
  summarySheet.getCell(grandTotalRowNum, 2).font = { bold: true, size: 11 };
  summarySheet.getCell(grandTotalRowNum, 2).fill = totalRowFill;
  summarySheet.getCell(grandTotalRowNum, 2).border = thinBorder;
  summarySheet.getCell(grandTotalRowNum, 2).alignment = { horizontal: 'center', vertical: 'middle' };

  let gtCol = 3;
  sortedClasses.forEach(cls => {
    let classBreakfastTotal = 0;
    let classLunchTotal = 0;
    let classDinnerTotal = 0;
    
    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayReports = mealReports.filter(r => r.date === dayStr);
      
      const breakfast = dayReports.find(r => r.mealType === 'breakfast');
      const lunch = dayReports.find(r => r.mealType === 'lunch');
      const dinner = dayReports.find(r => r.mealType === 'dinner');
      
      const classStudents = students.filter(s => s.classId === cls.id);
      const classTotal = classStudents.length;
      
      const breakfastAbsent = breakfast?.absentStudents.filter(a => a.classId === cls.id).length || 0;
      const lunchAbsent = lunch?.absentStudents.filter(a => a.classId === cls.id).length || 0;
      const dinnerAbsent = dinner?.absentStudents.filter(a => a.classId === cls.id).length || 0;
      
      classBreakfastTotal += breakfast ? classTotal - breakfastAbsent : 0;
      classLunchTotal += lunch ? classTotal - lunchAbsent : 0;
      classDinnerTotal += dinner ? classTotal - dinnerAbsent : 0;
    });

    [classBreakfastTotal, classLunchTotal, classDinnerTotal].forEach(val => {
      const cell = summarySheet.getCell(grandTotalRowNum, gtCol++);
      cell.value = val;
      cell.font = { bold: true };
      cell.fill = totalRowFill;
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  });

  const grandTotalRice = ((grandTotalLunch + grandTotalDinner) * 0.2);
  [grandTotalBreakfast, grandTotalLunch, grandTotalDinner, parseFloat(grandTotalRice.toFixed(1))].forEach(val => {
    const cell = summarySheet.getCell(grandTotalRowNum, gtCol++);
    cell.value = val;
    cell.font = { bold: true, size: 11 };
    cell.fill = totalRowFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Set column widths
  summarySheet.getColumn(1).width = 5;
  summarySheet.getColumn(2).width = 12;
  for (let i = 3; i < 3 + sortedClasses.length * 3; i++) {
    summarySheet.getColumn(i).width = 4;
  }
  for (let i = 3 + sortedClasses.length * 3; i <= totalColumns; i++) {
    summarySheet.getColumn(i).width = 9;
  }

  // ===== CLASS DETAIL SHEETS =====
  for (const cls of sortedClasses) {
    const classStudents = students.filter(s => s.classId === cls.id);
    if (classStudents.length === 0) continue;

    const classColCount = 3 + days.length + 4;
    const classIsLandscape = classColCount > 12;

    const classSheet = workbook.addWorksheet(`Lớp ${cls.name}`, {
      pageSetup: {
        paperSize: 9,
        orientation: classIsLandscape ? 'landscape' : 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.25,
          right: 0.25,
          top: 0.5,
          bottom: 0.5,
          header: 0.3,
          footer: 0.3
        }
      }
    });

    // Title
    classSheet.mergeCells(1, 1, 1, classColCount);
    const classTitleCell = classSheet.getCell(1, 1);
    classTitleCell.value = `THỐNG KÊ BỮA ĂN - LỚP ${cls.name}`;
    classTitleCell.font = titleFont;
    classTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    classSheet.getRow(1).height = 25;

    classSheet.mergeCells(2, 1, 2, classColCount);
    classSheet.getCell(2, 1).value = `Từ ngày: ${format(dateRange.start, 'dd/MM/yyyy')} - Đến ngày: ${format(dateRange.end, 'dd/MM/yyyy')}`;
    classSheet.getCell(2, 1).font = subTitleFont;
    classSheet.getCell(2, 1).alignment = { horizontal: 'center', vertical: 'middle' };

    classSheet.mergeCells(3, 1, 3, classColCount);
    classSheet.getCell(3, 1).value = 'Chú thích: 1 = Có mặt, 0 = Vắng, - = Chưa điểm danh | Định dạng: Sáng-Trưa-Tối (VD: 101 = Ăn sáng, vắng trưa, ăn tối)';
    classSheet.getCell(3, 1).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
    classSheet.getCell(3, 1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Header row
    const classHeaderRow = classSheet.getRow(5);
    classHeaderRow.height = 22;
    
    const classHeaders = ['STT', 'Họ và tên', 'Mâm ăn'];
    days.forEach(day => classHeaders.push(format(day, 'dd/MM')));
    classHeaders.push('Tổng S', 'Tổng T', 'Tổng To', 'Gạo (kg)');

    classHeaders.forEach((header, i) => {
      const cell = classSheet.getCell(5, i + 1);
      cell.value = header;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Student rows
    classStudents.forEach((student, idx) => {
      const rowNum = 6 + idx;
      const row = classSheet.getRow(rowNum);
      row.height = 18;

      let totalBreakfast = 0;
      let totalLunch = 0;
      let totalDinner = 0;

      // STT
      const sttCell = row.getCell(1);
      sttCell.value = idx + 1;
      sttCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sttCell.border = thinBorder;
      if (idx % 2 === 1) sttCell.fill = alternateFill;

      // Name
      const nameCell = row.getCell(2);
      nameCell.value = student.name;
      nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
      nameCell.border = thinBorder;
      if (idx % 2 === 1) nameCell.fill = alternateFill;

      // Meal group
      const mealGroupCell = row.getCell(3);
      mealGroupCell.value = student.mealGroup || '';
      mealGroupCell.alignment = { horizontal: 'center', vertical: 'middle' };
      mealGroupCell.border = thinBorder;
      if (idx % 2 === 1) mealGroupCell.fill = alternateFill;

      // Days
      days.forEach((day, dayIdx) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayReports = mealReports.filter(r => r.date === dayStr);
        
        const breakfastReport = dayReports.find(r => r.mealType === 'breakfast');
        const lunchReport = dayReports.find(r => r.mealType === 'lunch');
        const dinnerReport = dayReports.find(r => r.mealType === 'dinner');

        let dayCode = '';
        if (!breakfastReport && !lunchReport && !dinnerReport) {
          dayCode = '-';
        } else {
          // Breakfast
          if (!breakfastReport) {
            dayCode += '-';
          } else {
            const isAbsent = breakfastReport.absentStudents.some(a => a.studentId === student.id);
            dayCode += isAbsent ? '0' : '1';
            if (!isAbsent) totalBreakfast++;
          }
          // Lunch
          if (!lunchReport) {
            dayCode += '-';
          } else {
            const isAbsent = lunchReport.absentStudents.some(a => a.studentId === student.id);
            dayCode += isAbsent ? '0' : '1';
            if (!isAbsent) totalLunch++;
          }
          // Dinner
          if (!dinnerReport) {
            dayCode += '-';
          } else {
            const isAbsent = dinnerReport.absentStudents.some(a => a.studentId === student.id);
            dayCode += isAbsent ? '0' : '1';
            if (!isAbsent) totalDinner++;
          }
        }

        const dayCell = row.getCell(4 + dayIdx);
        dayCell.value = dayCode;
        dayCell.alignment = { horizontal: 'center', vertical: 'middle' };
        dayCell.border = thinBorder;
        if (idx % 2 === 1) dayCell.fill = alternateFill;
        
        // Highlight absent (contains 0)
        if (dayCode.includes('0')) {
          dayCell.font = { color: { argb: 'FFFF0000' } };
        }
      });

      // Totals
      const riceAmount = parseFloat(((totalLunch + totalDinner) * 0.2).toFixed(1));
      const totals = [totalBreakfast, totalLunch, totalDinner, riceAmount];
      
      totals.forEach((val, i) => {
        const cell = row.getCell(4 + days.length + i);
        cell.value = val;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder;
        cell.font = { bold: true };
        if (idx % 2 === 1) cell.fill = alternateFill;
      });
    });

    // Set column widths
    classSheet.getColumn(1).width = 5;
    classSheet.getColumn(2).width = 25;
    classSheet.getColumn(3).width = 8;
    for (let i = 4; i <= 3 + days.length; i++) {
      classSheet.getColumn(i).width = 7;
    }
    for (let i = 4 + days.length; i <= classColCount; i++) {
      classSheet.getColumn(i).width = 8;
    }
  }

  // Generate buffer and return as Blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

interface ExportMealClassParams {
  dateRange: { start: Date; end: Date };
  reports: Report[];
  students: Student[];
  classInfo: ClassInfo;
}

export async function exportMealExcelClassFormatted({
  dateRange,
  reports,
  students,
  classInfo
}: ExportMealClassParams): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hệ thống quản lý trường học';
  workbook.created = new Date();

  const days = eachDayOfInterval(dateRange);
  const mealReports = reports.filter(r => r.type === 'meal');
  const classStudents = students.filter(s => s.classId === classInfo.id);

  const colCount = 3 + days.length + 4;
  const isLandscape = colCount > 12;

  const sheet = workbook.addWorksheet('Chi tiết', {
    pageSetup: {
      paperSize: 9,
      orientation: isLandscape ? 'landscape' : 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3
      }
    }
  });

  // Title
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `THỐNG KÊ BỮA ĂN - LỚP ${classInfo.name}`;
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 25;

  sheet.mergeCells(2, 1, 2, colCount);
  sheet.getCell(2, 1).value = `Từ ngày: ${format(dateRange.start, 'dd/MM/yyyy')} - Đến ngày: ${format(dateRange.end, 'dd/MM/yyyy')}`;
  sheet.getCell(2, 1).font = subTitleFont;
  sheet.getCell(2, 1).alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.mergeCells(3, 1, 3, colCount);
  sheet.getCell(3, 1).value = `Xuất lúc: ${format(new Date(), 'HH:mm dd/MM/yyyy')}`;
  sheet.getCell(3, 1).font = subTitleFont;
  sheet.getCell(3, 1).alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.mergeCells(4, 1, 4, colCount);
  sheet.getCell(4, 1).value = 'Chú thích: 1 = Có mặt, 0 = Vắng, - = Chưa điểm danh | Định dạng: Sáng-Trưa-Tối';
  sheet.getCell(4, 1).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  sheet.getCell(4, 1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Header row
  const headers = ['STT', 'Họ và tên', 'Mâm ăn'];
  days.forEach(day => headers.push(format(day, 'dd/MM')));
  headers.push('Tổng S', 'Tổng T', 'Tổng To', 'Gạo (kg)');

  const headerRow = sheet.getRow(6);
  headerRow.height = 22;
  headers.forEach((header, i) => {
    const cell = sheet.getCell(6, i + 1);
    cell.value = header;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  // Student rows
  classStudents.forEach((student, idx) => {
    const rowNum = 7 + idx;
    const row = sheet.getRow(rowNum);
    row.height = 18;

    let totalBreakfast = 0;
    let totalLunch = 0;
    let totalDinner = 0;

    // STT
    const sttCell = row.getCell(1);
    sttCell.value = idx + 1;
    sttCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sttCell.border = thinBorder;
    if (idx % 2 === 1) sttCell.fill = alternateFill;

    // Name
    const nameCell = row.getCell(2);
    nameCell.value = student.name;
    nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
    nameCell.border = thinBorder;
    if (idx % 2 === 1) nameCell.fill = alternateFill;

    // Meal group
    const mealGroupCell = row.getCell(3);
    mealGroupCell.value = student.mealGroup || '';
    mealGroupCell.alignment = { horizontal: 'center', vertical: 'middle' };
    mealGroupCell.border = thinBorder;
    if (idx % 2 === 1) mealGroupCell.fill = alternateFill;

    // Days
    days.forEach((day, dayIdx) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayReports = mealReports.filter(r => r.date === dayStr);
      
      const breakfastReport = dayReports.find(r => r.mealType === 'breakfast');
      const lunchReport = dayReports.find(r => r.mealType === 'lunch');
      const dinnerReport = dayReports.find(r => r.mealType === 'dinner');

      let dayCode = '';
      if (!breakfastReport && !lunchReport && !dinnerReport) {
        dayCode = '-';
      } else {
        if (!breakfastReport) {
          dayCode += '-';
        } else {
          const isAbsent = breakfastReport.absentStudents.some(a => a.studentId === student.id);
          dayCode += isAbsent ? '0' : '1';
          if (!isAbsent) totalBreakfast++;
        }
        if (!lunchReport) {
          dayCode += '-';
        } else {
          const isAbsent = lunchReport.absentStudents.some(a => a.studentId === student.id);
          dayCode += isAbsent ? '0' : '1';
          if (!isAbsent) totalLunch++;
        }
        if (!dinnerReport) {
          dayCode += '-';
        } else {
          const isAbsent = dinnerReport.absentStudents.some(a => a.studentId === student.id);
          dayCode += isAbsent ? '0' : '1';
          if (!isAbsent) totalDinner++;
        }
      }

      const dayCell = row.getCell(4 + dayIdx);
      dayCell.value = dayCode;
      dayCell.alignment = { horizontal: 'center', vertical: 'middle' };
      dayCell.border = thinBorder;
      if (idx % 2 === 1) dayCell.fill = alternateFill;
      
      if (dayCode.includes('0')) {
        dayCell.font = { color: { argb: 'FFFF0000' } };
      }
    });

    // Totals
    const riceAmount = parseFloat(((totalLunch + totalDinner) * 0.2).toFixed(1));
    const totals = [totalBreakfast, totalLunch, totalDinner, riceAmount];
    
    totals.forEach((val, i) => {
      const cell = row.getCell(4 + days.length + i);
      cell.value = val;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
      cell.font = { bold: true };
      if (idx % 2 === 1) cell.fill = alternateFill;
    });
  });

  // Legend
  const legendRow = 7 + classStudents.length + 1;
  sheet.mergeCells(legendRow, 1, legendRow, colCount);
  sheet.getCell(legendRow, 1).value = 'Số gạo tính: 0.2kg × số bữa trưa/tối có mặt';
  sheet.getCell(legendRow, 1).font = { italic: true, size: 9, color: { argb: 'FF666666' } };

  // Set column widths
  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 25;
  sheet.getColumn(3).width = 8;
  for (let i = 4; i <= 3 + days.length; i++) {
    sheet.getColumn(i).width = 7;
  }
  for (let i = 4 + days.length; i <= colCount; i++) {
    sheet.getColumn(i).width = 8;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
