# Rà soát logic website và landing page — 07/11/2026

## Kết luận và giới hạn

Chưa nên xem website là đã hoàn thiện để vận hành bán hàng. Luồng chính có cấu trúc hợp lý nhưng còn lỗi xác thực quản trị, tính tiền và đồng bộ giỏ hàng cần xử lý trước.

Đã rà mã frontend và các nhánh backend liên quan tới đăng nhập, sản phẩm, tự phối hạt, mã giảm giá, tạo đơn và cập nhật trạng thái. `npx tsc --noEmit` chạy thành công. Đây là kiểm tra tĩnh, không phải xác nhận toàn bộ chức năng chạy end-to-end.

Server Next báo Ready, nhưng trình duyệt in-app và detector không truy cập được localhost (timeout). Detector Chromium trong sandbox còn gặp lỗi khởi động; thử ngoài sandbox vẫn timeout. Vì vậy chưa quan sát được giao diện render ở desktop/mobile, chưa đo overflow, contrast, tốc độ hoặc thử bàn phím ảo/cảm ứng. Không chấm điểm thị giác hay tuyên bố responsive đã đạt. Chưa gửi đơn thật, tin nhắn thật, hoặc thay đổi dữ liệu quản trị. Không sửa mã ứng dụng.

## Các lỗi có bằng chứng trong mã nguồn

### 1. P0 — Mã quản trị mặc định luôn hợp lệ

- `backend/src/NguyetnhanPhohien.Infrastructure/Services/AuthService.cs:54–73`: `TryLoginWithCode` chấp nhận cả hash mã cấu hình **hoặc** hash mã mặc định, kể cả khi đã thay `Admin:LoginCode`.
- `DiscountService.cs:21–25` cấp JWT quản trị từ endpoint áp mã công khai. Mã mặc định còn hiện diện trong bundle frontend (`useOrderForm.ts`).
- Tác động: người biết mã mặc định có thể nhận JWT Admin từ bản backend dùng logic này. Đổi biến môi trường riêng lẻ không vô hiệu hóa đường vào.
- Khắc phục: bỏ nhánh mã mặc định/backdoor; tách xác thực quản trị khỏi mã giảm giá; thu hồi phiên liên quan sau khi vá. Không thử khai thác trên hệ thống triển khai.

### 2. P1 — Tổng tiền không khớp chính sách giao hàng

- `frontend/src/app/chinh-sach/giao-hang/page.tsx`: công bố phí 30.000đ và miễn phí từ 1.000.000đ.
- `frontend/src/hooks/useOrderForm.ts` / `calculateTotal`: chỉ cộng hàng và trừ giảm giá.
- `backend/src/NguyetnhanPhohien.Infrastructure/Services/OrderService.cs:334–336`: `TotalAmount = baseAmount - discountAmount`, không cộng vận chuyển.
- Tác động: đơn dưới ngưỡng có số tiền khác chính sách; người mua không biết cần trả thêm bao nhiêu.
- Khắc phục: thống nhất quy tắc ngưỡng trước/sau giảm giá; tính phí trên server, trả chi tiết hàng/giảm giá/vận chuyển/tổng. Nếu nhân viên báo phí sau, phải ghi rõ đây là tạm tính.

### 3. P1 — Giỏ và form đặt hàng có thể chứa hai đơn khác nhau

- `LandingPage.tsx:297–310` chỉ tự đồng bộ giỏ vào form một lần; những lần khác chỉ đồng bộ trong một số handler.
- Nút mua trên desktop (`:742`) chỉ cuộn tới form; nút mua cố định mobile (`:2586`) lại nạp giỏ vào form.
- Tái hiện theo mã: thêm A → form nhận A → sửa giỏ, thêm B → đóng giỏ → bấm mua trên header desktop. Form có thể vẫn chỉ chứa A. Đi qua nút checkout trong drawer thì mới nạp đủ.
- Khắc phục: một nguồn dữ liệu chung cho checkout; mọi CTA dùng chung handler, thể hiện rõ lựa chọn mua ngay hay toàn bộ giỏ.

### 4. P1 — Xóa sai/thiếu sản phẩm tự phối sau khi đặt hàng

- `LandingPage.tsx:269–281`: tìm dòng cần xóa bằng bao bì + tên + lời nhắn, bỏ qua thành phần hạt và ID dòng giỏ. Vòng lặp dùng cùng snapshot `cartStore.items`.
- `useCartStore.ts` cho phép hai dòng cùng bao bì/tên/lời nhắn nhưng khác công thức.
- Tái hiện: đặt cả hai công thức trên; cả hai lượt tìm đều có thể chọn dòng đầu từ snapshot cũ, khiến dòng thứ hai vẫn nằm trong giỏ sau khi đã đặt. Nếu chỉ đặt một công thức, có thể xóa nhầm dòng còn lại.
- Khắc phục: giữ `cartItemId` trong trạng thái checkout và xóa theo ID chính xác. Nếu cho sửa số lượng trong form, xác định rõ trừ số đã mua hay xóa toàn bộ dòng.

### 5. P1 — Sản phẩm ngừng bán được dựng lại thành lựa chọn đang bán

- `LandingPage.tsx:185–213`: sản phẩm không còn trong API nhưng có trong giỏ được bổ sung vào `effectiveProducts` với `isActive: true`.
- `useCartStore.ts` / `syncProductPrices` giữ nguyên dòng không tìm thấy trong danh mục mới.
- Tác động: khách vẫn thấy và chọn hàng đã bị ẩn/xóa, điền thông tin rồi mới gặp lỗi backend. Cần phân biệt API mất kết nối với sản phẩm thực sự không còn bán.
- Khắc phục: đánh dấu dòng không khả dụng, cho xóa/thay thế, ngăn submit và giải thích ngay trong giỏ.

### 6. P2 — Đăng nhập giả khi API lỗi

- `useOrderForm.ts:251` trở đi tạo JWT với chữ ký `.sig`, lưu phiên rồi chuyển dashboard khi nhập mã đặc biệt và API thất bại.
- `api.service.ts:647` kiểm tra claim/hạn token tại frontend, trong khi `backend/.../Program.cs:53` xác thực chữ ký thật.
- Tác động: giao diện coi là đã đăng nhập nhưng API quản trị sẽ từ chối token này. Đây là lỗi trạng thái đăng nhập, không phải bằng chứng token giả vượt được xác thực backend.
- Khắc phục: chỉ lưu phiên sau xác thực thành công; API lỗi thì giữ người dùng tại màn hình đăng nhập và cho thử lại.

### 7. P2 — Đổi ngôn ngữ làm đổi đơn vị tiền không nhất quán

- `LandingPage.tsx:2028–2060` hiển thị USD bằng phép chia cố định 25.000 ở chế độ EN.
- `components/cart/CartSummary.tsx` luôn hiển thị VND; backend cũng tính bằng VND.
- Tác động: cùng một đơn chuyển từ giỏ sang checkout đổi đơn vị tiền, không ghi đây là quy đổi tham khảo.
- Khắc phục: thống nhất VND trong giao dịch; nếu giữ USD phải ghi rõ ước tính và tiền thanh toán thực tế.

### 8. P2 — Thành công đặt hàng thiếu biên nhận để tra cứu

- `useOrderForm.ts` chỉ lưu email và trạng thái gửi email, sau đó reset form; không giữ ID và tổng tiền của đơn trả về.
- `LandingPage.tsx:1588–1640` hiện cảm ơn và lời hẹn liên hệ, không có mã đơn/tóm tắt đơn.
- Tác động: khách không nhập email hoặc email lỗi không có mã tham chiếu để hỏi hỗ trợ; refresh làm mất thông báo.
- Khắc phục: lưu biên nhận tối thiểu, hiện mã đơn, hàng đã mua, tổng tiền, trạng thái chờ xác nhận và bước tiếp theo. Thiết kế tra cứu phải có xác minh phù hợp.

### 9. P2 — Drawer giỏ thiếu hành vi hộp thoại cho bàn phím

- `components/cart/CartDrawer.tsx`: khóa scroll và có overlay, nhưng thiếu role dialog/aria-modal, chuyển focus, giữ focus trong drawer, Escape và trả focus khi đóng.
- Tác động: người dùng bàn phím có thể tiếp tục tab vào nội dung sau lớp phủ; trình đọc màn hình không được thông báo đúng ngữ cảnh.
- Khắc phục: dùng primitive dialog/sheet có sẵn và nhãn truy cập; kiểm chứng bằng bàn phím sau khi sửa.

### 10. P2 — Tự phối hạt nuốt mọi lỗi xác thực API

- `CustomMixStudio.tsx:777–799`: bất kỳ exception từ API validate đều được coi là lý do fallback, sau đó thêm giỏ và báo thành công.
- Tác động: lỗi mạng và lỗi HTTP nghiệp vụ đi chung một nhánh; cấu hình chưa được server chấp thuận vẫn trông như đã hợp lệ. Backend tạo đơn kiểm tra lại nên chưa có bằng chứng vượt kiểm tra server.
- Khắc phục: phân biệt 4xx, 5xx, mất mạng; giữ bản nháp khi offline, báo chưa xác minh và xác thực lại trước checkout.

## Desktop/mobile: đánh giá cấu trúc và việc cần kiểm chứng

### Desktop/tablet

- Rủi ro cao tại 768–1024px: menu desktop bật bằng `md:flex`, chứa 7 mục + tự chọn hạt, bên cạnh logo, đổi ngôn ngữ, giỏ, chat và mua ngay. Nhiều phần dùng `shrink-0`/`whitespace-nowrap` (`LandingPage.tsx:665–746`). Nên chuyển sang menu thu gọn tới khi thực sự đủ chiều rộng, kiểm tra cả EN và zoom 200%. Chưa đo được tràn thực tế.
- Cấu trúc landing có đưa sản phẩm lên sớm sau hero — hợp lý cho người muốn mua nhanh.
- Form đặt hàng ở sau nhiều khối kể chuyện, lịch sử, video, quy trình và văn hóa. CTA anchor giúp đi nhanh, nhưng nên thử một lộ trình checkout riêng hoặc summary gọn sau phần sản phẩm. Đây là đề xuất UX, chưa phải kết luận về tỷ lệ chuyển đổi.
- Hero có nhiều hướng hành động (sản phẩm, tự phối, câu chuyện, video). Nên ưu tiên rõ một hành động mua hàng và một hành động tìm hiểu.

### Mobile

- Có menu riêng, thanh hành động dưới cùng và safe-area; chat dùng `100dvh`/visualViewport. Đây là các nền tảng tốt trong mã.
- Header nhỏ vẫn chứa tên thương hiệu không xuống dòng cùng nhiều nút. Cần kiểm tra 320/360/390px để quyết định rút gọn tên hoặc giảm số nút trùng với thanh dưới.
- Kiểm tra kích thước chạm, khoảng cách các nút, focus form khi bàn phím mở và drawer cao toàn màn hình. Một số nút như nút đóng giỏ là 36px, nhỏ hơn mục tiêu thao tác thoải mái 44px; không tự động coi đây là vi phạm WCAG khi chưa xét khoảng cách/ngoại lệ.
- Giảm số điểm chuyển động cạnh tranh: marquee, vòng sáng, toast đơn hàng, parallax và pháo hoa. Cần đo trên máy yếu, không suy diễn hiệu năng từ số animation.

## Điểm tốt nên giữ

- Validate trường nhập, chỉ hiện lỗi sau blur/submit, reset phường/xã khi đổi tỉnh, có nhập địa chỉ thủ công.
- Mã giảm giá gắn với số điện thoại và bị vô hiệu hóa khi thay dữ liệu liên quan.
- Tạo đơn tính lại giá từ database; custom mix kiểm tra lại phía server.
- Có idempotency khi retry trong cùng phiên hook, transaction, chống tranh chấp lượt mã giảm giá, version trạng thái đơn.
- Giỏ và bản nháp tự phối được lưu; nội dung có error boundary theo section.

## Detector và mức độ tin cậy

Detector source ghi nhận `border-l-4` tại LandingPage:1400 và bounce easing tại globals.css:59. Đây là cảnh báo phong cách, không đủ để kết luận lỗi UX; không đưa vào danh sách lỗi cần ưu tiên. Output nguồn tại `audit-source.json`. `audit-mobile.json` rỗng vì scan URL thất bại, không có nghĩa trang sạch lỗi.

Không chấm tổng điểm /20 vì accessibility, performance và responsive chưa được đo trên render; dùng điểm từ suy đoán sẽ gây hiểu nhầm.

## Thứ tự xử lý và kiểm chứng tiếp

1. Vá xác thực quản trị; kiểm tra mã cũ không được chấp nhận kể cả khi thay cấu hình.
2. Thống nhất phí giao hàng và tổng tiền, thử dưới/bằng/trên ngưỡng, có/không có giảm giá.
3. Đồng bộ checkout; thử đổi giỏ sau lần sync đầu, desktop/mobile, hai công thức cùng tên, hàng ngừng bán.
4. Bổ sung biên nhận, trạng thái API lỗi, đơn vị tiền và hành vi dialog (`impeccable harden`).
5. Kiểm tra layout ở 320, 360, 390, 768, 1024, 1280, 1440px; VI/EN, zoom, bàn phím và cảm ứng thật (`impeccable adapt`, rồi `impeccable audit`).
6. Chỉ sau khi luồng đúng và render đã kiểm tra, tinh chỉnh hình thức (`impeccable polish`).
