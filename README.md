# FlashCard MinMin (Vite + React + Tailwind + Supabase)

Ứng dụng học Flashcard phong cách **Liquid Glass** tối ưu cho iOS Safari (PWA) & PC, hỗ trợ cây thư mục N-cấp giống Google Drive, đa dạng loại thẻ (`Basic`, `Cloze`, `Case`, `Image`), Spaced Repetition, và đồng bộ Cloud qua Supabase.

## Cấu trúc thư mục
- `src/lib/supabase.js`: Đồng bộ Cloud theo bảng chuẩn hóa `mm_folders`, `mm_decks`, `mm_cards` (tương thích fallback `minmin_store`).
- `src/lib/spacedRepetition.js`: Thuật toán Leitner / Spaced Repetition và thống kê tiến độ riêng từng người.
- `src/lib/importParser.js`: Bộ phân tích file JSON / CSV / Pipe `|` và chống trùng lặp giữ nguyên tiến độ cũ.
- `src/components/`: Các giao diện tách module (`DriveExplorer`, `StudyView`, `ImportModal`, `PromptModal`, `EditorModal`, `SettingsModal`).
- `supabase_schema.sql`: File SQL tạo 3 bảng chuẩn trên Supabase để chịu tải hàng nghìn thẻ.

## Triển khai lên GitHub & Vercel
1. (Khuyên dùng) Vào **Supabase SQL Editor** chạy nội dung file `supabase_schema.sql` để kích hoạt lưu trữ phân bảng.
2. Đẩy toàn bộ thư mục này lên GitHub repo `DucMinh7805/FlashCard_MinMin`.
3. Vào **Vercel** -> **Add New Project** -> Import repo `FlashCard_MinMin` -> bấm **Deploy** (Vercel tự nhận diện Vite).
