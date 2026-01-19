# 📋 ĐẶC TẢ ỨNG DỤNG QUẢN LÝ HỌC SINH NỘI TRÚ

## 1. TỔNG QUAN

### 1.1 Mục đích
Ứng dụng quản lý học sinh nội trú dành cho trường THPT, hỗ trợ:
- Quản lý thông tin học sinh
- Điểm danh tự học tối, nội trú, ăn uống
- Lịch trực giáo viên
- Thống kê báo cáo
- Phân quyền người dùng

### 1.2 Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **Mobile**: PWA + Capacitor (Android/iOS)
- **Font**: Be Vietnam Pro, Inter

---

## 2. DESIGN SYSTEM

### 2.1 Color Palette (HSL)
```css
/* Light Mode */
--background: 210 20% 98%;
--foreground: 222 47% 11%;
--card: 0 0% 100%;
--primary: 217 91% 40%;        /* Xanh dương chính */
--secondary: 210 40% 96%;
--accent: 24 95% 53%;          /* Cam */
--success: 142 76% 36%;        /* Xanh lá */
--warning: 38 92% 50%;         /* Vàng */
--destructive: 0 84% 60%;      /* Đỏ */
--muted: 210 40% 96%;
--border: 214 32% 91%;

/* Sidebar */
--sidebar-background: 222 47% 11%;   /* Tối */
--sidebar-foreground: 210 40% 98%;
--sidebar-primary: 217 91% 60%;
--sidebar-accent: 222 47% 18%;
```

### 2.2 Typography
- **Font chính**: 'Be Vietnam Pro', fallback 'Inter'
- **Heading**: font-semibold, tracking-tight
- **Body**: font-normal, antialiased

### 2.3 Spacing & Radius
- **Border radius**: 0.75rem (lg), calc(0.75rem - 2px) (md)
- **Container padding**: 2rem
- **Max width**: 1400px

### 2.4 Animations
```css
/* fadeIn, slideUp, slideInLeft, scaleIn, pulseSoft */
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
.animate-slide-up { animation: slideUp 0.4s ease-out; }
```

### 2.5 Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

---

## 3. DATABASE SCHEMA

### 3.1 Bảng `students`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| name | TEXT NOT NULL | Họ tên học sinh |
| class_id | TEXT NOT NULL | Mã lớp (10A1, 11B2...) |
| gender | TEXT | Nam/Nữ |
| date_of_birth | DATE | Ngày sinh |
| phone | TEXT | SĐT học sinh |
| parent_phone | TEXT | SĐT phụ huynh |
| address | TEXT | Địa chỉ |
| cccd | TEXT | Số CCCD |
| is_boarding | BOOLEAN DEFAULT false | Học sinh nội trú |
| meal_group | TEXT | Nhóm ăn (Sáng, Trưa, Tối, Đầy đủ) |
| room | TEXT | Phòng ký túc xá |
| created_at | TIMESTAMPTZ | now() |
| updated_at | TIMESTAMPTZ | now() |

### 3.2 Bảng `profiles`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | Liên kết với auth.users |
| full_name | TEXT NOT NULL | Họ tên |
| username | TEXT UNIQUE | Tên đăng nhập |
| phone | TEXT | SĐT |
| class_id | TEXT | Lớp chủ nhiệm (nếu là GVCN) |
| created_at | TIMESTAMPTZ | now() |
| updated_at | TIMESTAMPTZ | now() |

### 3.3 Bảng `user_roles`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| user_id | UUID NOT NULL | FK → profiles.id |
| role | app_role ENUM | admin, teacher, class_teacher, accountant, kitchen |

**ENUM app_role**: `admin`, `teacher`, `class_teacher`, `accountant`, `kitchen`

### 3.4 Bảng `attendance_reports`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| type | TEXT NOT NULL | evening_study, boarding, meal |
| date | DATE NOT NULL | Ngày báo cáo |
| session | TEXT | Buổi (morning, afternoon, evening) |
| meal_type | TEXT | breakfast, lunch, dinner |
| class_id | TEXT | Mã lớp |
| total_students | INTEGER | Tổng số HS |
| present_count | INTEGER | Số có mặt |
| absent_count | INTEGER | Số vắng |
| absent_students | JSONB | Danh sách HS vắng [{id, name, reason}] |
| notes | TEXT | Ghi chú |
| reporter_id | UUID NOT NULL | Người báo cáo |
| reporter_name | TEXT NOT NULL | Tên người báo cáo |
| created_at | TIMESTAMPTZ | now() |
| updated_at | TIMESTAMPTZ | now() |

### 3.5 Bảng `duty_schedules`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| user_id | UUID | FK → profiles.id |
| teacher_name | TEXT NOT NULL | Tên giáo viên |
| duty_date | DATE NOT NULL | Ngày trực |
| notes | TEXT | Ghi chú |
| created_by | UUID | Người tạo |
| created_at | TIMESTAMPTZ | now() |
| updated_at | TIMESTAMPTZ | now() |

### 3.6 Bảng `permission_groups`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| name | TEXT NOT NULL | Tên nhóm quyền |
| description | TEXT | Mô tả |
| created_at | TIMESTAMPTZ | now() |
| updated_at | TIMESTAMPTZ | now() |

### 3.7 Bảng `permission_group_permissions`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| group_id | UUID NOT NULL | FK → permission_groups.id |
| feature_code | TEXT NOT NULL | Mã tính năng |
| can_view | BOOLEAN DEFAULT false | Quyền xem |
| can_create | BOOLEAN DEFAULT false | Quyền tạo |
| can_edit | BOOLEAN DEFAULT false | Quyền sửa |
| can_delete | BOOLEAN DEFAULT false | Quyền xóa |

### 3.8 Bảng `user_permission_groups`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| user_id | UUID NOT NULL | FK → profiles.id |
| group_id | UUID NOT NULL | FK → permission_groups.id |
| created_at | TIMESTAMPTZ | now() |

### 3.9 Bảng `user_permissions` (quyền riêng lẻ)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| user_id | UUID NOT NULL | FK → profiles.id |
| feature | TEXT NOT NULL | Mã tính năng |
| can_view, can_create, can_edit, can_delete | BOOLEAN | Các quyền |

### 3.10 Bảng `app_features`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| code | TEXT UNIQUE NOT NULL | dashboard, students, evening_study, boarding, meals, statistics, user_management, settings |
| label | TEXT NOT NULL | Tên hiển thị |
| description | TEXT | Mô tả |
| icon_name | TEXT | Tên icon Lucide |
| display_order | INTEGER | Thứ tự hiển thị |
| is_active | BOOLEAN DEFAULT true | Đang hoạt động |

### 3.11 Bảng `login_history`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID (PK) | gen_random_uuid() |
| user_id | UUID NOT NULL | FK → profiles.id |
| login_at | TIMESTAMPTZ | Thời gian đăng nhập |
| ip_address | TEXT | Địa chỉ IP |
| user_agent | TEXT | Thông tin trình duyệt |
| success | BOOLEAN DEFAULT true | Đăng nhập thành công |

---

## 4. DATABASE FUNCTIONS

### 4.1 `has_role(user_id, role)`
Kiểm tra user có role không.

### 4.2 `is_class_teacher(user_id, class_id)`
Kiểm tra user có phải GVCN của lớp không.

### 4.3 `has_permission(user_id, feature, action)`
Kiểm tra quyền truy cập tính năng.

### 4.4 `get_teacher_class(user_id)`
Lấy lớp chủ nhiệm của giáo viên.

### 4.5 `get_email_by_login(login_input)`
Lấy email từ username hoặc phone.

---

## 5. RLS POLICIES

### 5.1 `students`
- SELECT: Tất cả authenticated users
- INSERT/UPDATE/DELETE: admin hoặc class_teacher của lớp đó

### 5.2 `attendance_reports`
- SELECT: Tất cả authenticated users
- INSERT: reporter_id = auth.uid()
- UPDATE/DELETE: reporter_id = auth.uid() hoặc admin

### 5.3 `duty_schedules`
- SELECT: Tất cả authenticated users
- INSERT/UPDATE/DELETE: admin hoặc user có quyền quản lý

### 5.4 `profiles`
- SELECT: Tất cả authenticated users
- UPDATE: id = auth.uid() hoặc admin

---

## 6. EDGE FUNCTIONS

### 6.1 `admin-get-users`
- **Chức năng**: Lấy danh sách tất cả users (dành cho admin)
- **Method**: GET
- **Auth**: Bearer token, role = admin
- **Response**: `{ users: [...] }`

### 6.2 `admin-reset-password`
- **Chức năng**: Reset mật khẩu user
- **Method**: POST
- **Body**: `{ userId: string, newPassword: string }`
- **Auth**: Bearer token, role = admin

### 6.3 `admin-delete-user`
- **Chức năng**: Xóa user
- **Method**: DELETE
- **Body**: `{ userId: string }`
- **Auth**: Bearer token, role = admin

---

## 7. CẤU TRÚC ROUTING

```
/                   → Redirect to /dashboard (nếu đã đăng nhập)
/auth               → Trang đăng nhập/đăng ký
/dashboard          → Tổng quan (Protected)
/students           → Quản lý học sinh (Protected, permission: students)
/evening-study      → Điểm danh tự học tối (Protected, permission: evening_study)
/boarding           → Điểm danh nội trú (Protected, permission: boarding)
/meals              → Điểm danh bữa ăn (Protected, permission: meals)
/statistics         → Thống kê (Protected, permission: statistics)
/duty-schedule      → Lịch trực (Protected)
/user-management    → Quản lý người dùng (Protected, role: admin)
/settings           → Cài đặt (Protected)
/install            → Hướng dẫn cài đặt PWA
/menu               → Menu mobile
```

---

## 8. GIAO DIỆN CHI TIẾT

### 8.1 Layout
- **Desktop**: Sidebar bên trái (280px) + Main content
- **Mobile**: Header + Bottom Navigation

### 8.2 Sidebar (Desktop)
- Logo + Tên trường
- Menu navigation với icons (Lucide)
- User info + Logout button
- Màu tối (#1a1f36)

### 8.3 Mobile Header
- Menu hamburger
- Logo
- User avatar

### 8.4 Mobile Bottom Navigation
- 5 tabs: Dashboard, Tự học, Nội trú, Bữa ăn, Menu
- Active state với màu primary

### 8.5 Trang Dashboard
- Thẻ chào mừng với gradient
- 4 StatCards: Tổng HS, HS có mặt, HS vắng, Lớp
- Danh sách báo cáo gần đây
- Quick actions

### 8.6 Trang Học sinh
- Search box + Filter buttons
- Nút "Thêm HS" + "Import Excel"
- Table với columns: STT, Họ tên, Lớp, Nội trú, Nhóm ăn, Actions
- Responsive: Table trên desktop, Cards trên mobile
- Dialog thêm/sửa với form đầy đủ

### 8.7 Trang Điểm danh (Tự học/Nội trú/Bữa ăn)
- Date picker
- Chọn lớp (dropdown)
- Session/Meal type selector
- Danh sách học sinh với checkbox
- Ghi chú cho từng HS vắng
- Nút "Lưu báo cáo"
- Lịch sử báo cáo phía dưới

### 8.8 Trang Thống kê
- Date range picker
- Charts (Recharts):
  - Line chart: Xu hướng điểm danh theo thời gian
  - Bar chart: So sánh các lớp
  - Pie chart: Tỷ lệ có mặt/vắng
- Summary cards

### 8.9 Trang Lịch trực
- Calendar view (react-day-picker)
- List view toggle
- Thêm/sửa/xóa lịch trực
- Import từ Excel

### 8.10 Trang Quản lý người dùng (Admin only)
- Tab: Danh sách users | Nhóm quyền | Tính năng
- Table users với columns: Họ tên, Email, Role, Trạng thái, Actions
- Dialog thêm user mới
- Phân quyền theo nhóm hoặc cá nhân
- Reset password
- Xóa user

### 8.11 Trang Cài đặt
- Thông tin cá nhân
- Đổi mật khẩu
- Cài đặt thông báo
- Theme (Light/Dark)

---

## 9. COMPONENTS CHÍNH

### 9.1 UI Components (shadcn/ui)
- Button, Card, Dialog, Form, Input, Select, Checkbox
- Table, Tabs, Badge, Avatar, Dropdown
- Toast (sonner), Calendar, Popover

### 9.2 Custom Components
```
src/components/
├── attendance/
│   ├── AttendanceForm.tsx        # Form điểm danh đầy đủ
│   ├── CompactAttendanceForm.tsx # Form điểm danh gọn
│   ├── CompactMealForm.tsx       # Form điểm danh bữa ăn
│   ├── MealAttendanceForm.tsx    # Form điểm danh bữa ăn đầy đủ
│   └── AbsentStudentRow.tsx      # Row học sinh vắng
├── auth/
│   └── ProtectedRoute.tsx        # Route bảo vệ
├── dashboard/
│   └── StatCard.tsx              # Thẻ thống kê
├── duty/
│   ├── DutyCalendarView.tsx      # Lịch trực dạng calendar
│   ├── DutyListView.tsx          # Lịch trực dạng list
│   ├── DutyScheduleManager.tsx   # Quản lý lịch trực
│   ├── AddDutyDialog.tsx         # Dialog thêm lịch trực
│   ├── DutyExcelImport.tsx       # Import Excel
│   └── TodayDutyCard.tsx         # Thẻ lịch trực hôm nay
├── layout/
│   ├── MainLayout.tsx            # Layout chính
│   ├── Header.tsx                # Header desktop
│   ├── Sidebar.tsx               # Sidebar desktop
│   ├── MobileHeader.tsx          # Header mobile
│   └── MobileNavigation.tsx      # Bottom nav mobile
├── meals/
│   └── MealReportReminder.tsx    # Nhắc nhở báo cáo bữa ăn
├── reports/
│   ├── ReportHistory.tsx         # Lịch sử báo cáo
│   └── ReportImageExport.tsx     # Export báo cáo dạng ảnh
├── statistics/
│   ├── MealDailyStats.tsx        # Thống kê bữa ăn theo ngày
│   └── StatsSummaryCard.tsx      # Card tổng hợp
├── students/
│   ├── StudentTable.tsx          # Table học sinh
│   └── ExcelImport.tsx           # Import học sinh từ Excel
└── users/
    ├── AddUserDialog.tsx         # Dialog thêm user
    ├── PermissionManager.tsx     # Quản lý quyền
    ├── PermissionGroupManager.tsx# Quản lý nhóm quyền
    ├── FeatureManager.tsx        # Quản lý tính năng
    ├── UserExcelImport.tsx       # Import users
    ├── UserExcelExport.tsx       # Export users
    ├── LoginHistory.tsx          # Lịch sử đăng nhập
    ├── BulkGroupAssignment.tsx   # Gán nhóm hàng loạt
    └── UserGroupAssignment.tsx   # Gán nhóm cho user
```

---

## 10. HOOKS

### 10.1 `useStudents()`
- Fetch danh sách học sinh từ Supabase
- CRUD operations với React Query mutations
- Bulk import students

### 10.2 `useReports()`
- Fetch danh sách báo cáo điểm danh
- Create/Delete reports

### 10.3 `useDutySchedule()`
- Fetch lịch trực theo tháng/ngày
- CRUD operations
- Bulk import từ Excel

### 10.4 `useAuth()` (Context)
- User state, session
- Sign in/up/out
- Role checking: hasRole(), isClassTeacher()
- Permission checking: canAccessMeals(), canAccessAttendance()

### 10.5 `useApp()` (Context)
- Students, teachers, attendance records
- Reports
- School info, classes

---

## 11. TÍNH NĂNG ĐẶC BIỆT

### 11.1 PWA Support
- Service Worker với vite-plugin-pwa
- Offline caching
- Install prompt
- Push notifications (tuỳ chọn)

### 11.2 Capacitor Mobile
- Android APK build
- iOS build
- Native features: Camera, Storage

### 11.3 Excel Import/Export
- Library: exceljs, xlsx
- Import học sinh từ file Excel
- Import lịch trực từ Excel
- Export danh sách, báo cáo

### 11.4 Image Export
- Library: html2canvas
- Export báo cáo dạng hình ảnh
- Share qua social media

### 11.5 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly controls

---

## 12. AUTHENTICATION FLOW

### 12.1 Đăng ký
1. User nhập: Họ tên, Email, Username (optional), SĐT (optional), Password
2. Auto-confirm email (không cần xác nhận)
3. Tạo profile trong bảng `profiles`
4. Gán role mặc định: `teacher`
5. Redirect → Dashboard

### 12.2 Đăng nhập
1. Nhập Email/Username/SĐT + Password
2. Nếu nhập Username/SĐT → gọi `get_email_by_login()` để lấy email
3. Supabase signIn
4. Ghi log vào `login_history`
5. Redirect → Dashboard

### 12.3 Protected Routes
- Check session
- Check role/permission nếu cần
- Redirect → /auth nếu chưa đăng nhập

---

## 13. MOCK DATA

```typescript
// Danh sách lớp
const classes = [
  { id: '10A1', name: 'Lớp 10A1', grade: 10 },
  { id: '10A2', name: 'Lớp 10A2', grade: 10 },
  { id: '11A1', name: 'Lớp 11A1', grade: 11 },
  { id: '12A1', name: 'Lớp 12A1', grade: 12 },
  // ... thêm các lớp
];

// Thông tin trường
const schoolInfo = {
  name: 'Trường THPT Nội Trú',
  address: 'Địa chỉ trường...',
  phone: '0123456789',
  email: 'contact@school.edu.vn',
};

// Meal groups
const mealGroups = ['Sáng', 'Trưa', 'Tối', 'Đầy đủ', 'Không ăn'];

// Sessions
const sessions = ['morning', 'afternoon', 'evening'];

// Meal types
const mealTypes = ['breakfast', 'lunch', 'dinner'];
```

---

## 14. ERROR HANDLING

### 14.1 ErrorBoundary
- Bắt lỗi React ở top level
- Hiển thị UI thân thiện
- Nút retry

### 14.2 DatabaseErrorFallback
- Hiển thị khi kết nối DB thất bại
- Hướng dẫn user

### 14.3 Toast Notifications
- Success: Xanh lá
- Error: Đỏ
- Warning: Vàng
- Info: Xanh dương

---

## 15. PERFORMANCE OPTIMIZATIONS

### 15.1 React Query
- Caching với stale time
- Background refetch
- Optimistic updates

### 15.2 useMemo/useCallback
- Stable context values
- Prevent unnecessary re-renders

### 15.3 Code Splitting
- Lazy load pages
- Dynamic imports

---

## 16. SECURITY

### 16.1 Row Level Security (RLS)
- Tất cả bảng đều enable RLS
- Policies theo role/permission

### 16.2 Edge Functions Auth
- Verify JWT token
- Check admin role

### 16.3 Input Validation
- Zod schemas
- Form validation với react-hook-form

---

## KẾT LUẬN

Với đặc tả này, Lovable có thể tạo lại ứng dụng với:
1. Database schema đầy đủ
2. RLS policies bảo mật
3. Edge functions cho admin
4. UI/UX responsive
5. Authentication flow
6. Permission system
7. PWA + Mobile support

**Lưu ý**: Một số logic nghiệp vụ phức tạp có thể cần điều chỉnh thêm trong quá trình phát triển.
