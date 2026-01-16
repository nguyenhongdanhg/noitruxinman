-- Thêm feature mới cho phân công trực
INSERT INTO app_features (code, label, description, icon_name, display_order, is_active)
VALUES ('duty_schedule', 'Phân công trực', 'Quản lý lịch phân công trực', 'ClipboardList', 6, true)
ON CONFLICT (code) DO NOTHING;

-- Cập nhật display_order cho các feature sau nó
UPDATE app_features SET display_order = display_order + 1 WHERE display_order >= 6 AND code != 'duty_schedule';