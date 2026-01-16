-- Thêm cột CCCD (Căn cước công dân) vào bảng students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cccd TEXT;

-- Thêm cột phone (Số điện thoại học sinh) 
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone TEXT;

-- Đổi tên parent_phone thành phụ huynh để rõ ràng hơn nếu cần