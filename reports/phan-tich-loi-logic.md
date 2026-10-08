# Phân tích logic toàn dự án — Nguyệt Nhãn Phố Hiến

**Phạm vi:** 65 file `.cs` backend (56 file nghiệp vụ + 9 file sinh tự động trong `Migrations/`) và 54 file frontend `.ts/.tsx` — đọc từng file/từng hàm. Bỏ qua: `bin/`, `obj/`, `node_modules/`, `*.Designer.cs`, `globals.css`, 4 trang chính sách tĩnh (24–25 dòng/trang, không có logic).

**Ngày phân tích:** 2026-10-08 · **Nhánh:** `main` · Lưu ý: working tree đang có 10 file sửa dở chưa commit (phần `resend-invoice` + toast). Tôi **không sửa gì** trong lần này — phân tích đúng theo trạng thái hiện tại trên đĩa.

---

## 0. Kết quả chạy kiểm tra (bằng chứng)

| Lệnh | Kết quả |
|---|---|
| `dotnet build NguyetnhanPhohien.sln` | ✅ exit 0 — Build succeeded, 0 warnings, 0 errors |
| `npx tsc --noEmit` (frontend) | ✅ exit 0 |
| `npx eslint src` (frontend) | ❌ **exit 1 — 1 error `react-hooks/purity` tại `Orders.tsx:58`** |
| `npx next build` | ✅ exit 0 (Next 16 không chạy ESLint trong build → lỗi lint chỉ lộ khi CI chạy `npm run lint`) |
| Thực nghiệm `Enum.TryParse<OrderStatus>("99")` | ✅ trả `ok=True`, `defined=False` → xác nhận lỗi #7 |
| Thực nghiệm `vi.ts` vs `en.ts` | ✅ 71 key = 71 key, không thiếu key nào |
| Thực nghiệm `toLocaleDateString("vi-VN", {hour,minute})` | ⚠️ V8 **có** in giờ → `Orders.tsx:307` không phải lỗi (đã loại khỏi báo cáo) |
| Thực nghiệm payload JWT base64url | ⚠️ với claim hiện tại không chứa `-`/`_` → lỗi #27 là **tiềm ẩn**, chưa hỏng |

---

## 1. Danh sách file đang sai logic (tổng hợp)

| # | File | Mức | Lỗi chính |
|---|---|---|---|
| 1 | `backend/.../Infrastructure/Services/OrderService.cs` | 🔴 P1 | Gửi lại hóa đơn báo "thành công" dù email thất bại; `Enum.TryParse` nhận số vô nghĩa; HTML mail không escape; email admin hardcode; `Task.Run` fire-and-forget |
| 2 | `backend/.../Infrastructure/Services/DiscountService.cs` | 🔴 P1 | Backdoor hardcode `NguyetNhanPhoHienAdmin` cấp JWT Admin 7 ngày qua API public |
| 3 | `backend/.../Infrastructure/Persistence/DbSeeder.cs` | 🔴 P1 | Ghi đè tên/mô tả sản phẩm 1–3 **mỗi lần khởi động**; bật RLS toàn schema mỗi startup |
| 4 | `backend/.../API/Hubs/ChatHub.cs` | 🔴 P1 | IDOR: khách join được group phiên của người khác (group key = chuỗi client tự khai) |
| 5 | `backend/.../API/Controllers/ChatController.cs` | 🔴 P1 | `GET` tạo phiên chat (ghi DB); giới hạn sessionId 100 ≠ 128 của Hub |
| 6 | `frontend/src/views/orders/Orders.tsx` | 🔴 P1 | ESLint fail (`Date.now()` trong render); optimistic update rồi invalidate ngay |
| 7 | `backend/.../Infrastructure/Services/ChatService.cs` | 🟠 P2 | Giới hạn sessionId 100 ≠ Hub 128; race mất tên/SĐT khách; preview luôn rỗng |
| 8 | `frontend/src/views/landing/LandingPage.tsx` | 🟠 P2 | Lỗi submit bị thay bằng câu chung chung (mất nguyên nhân thật); monkey-patch `console.error`; hero 1 từ → dòng 2 rỗng |
| 9 | `frontend/src/hooks/useOrderForm.ts` | 🟠 P2 | `addItem` tạo dòng trùng sản phẩm (backend cộng dồn SL); tự động login backdoor admin |
| 10 | `frontend/src/views/content/ContentCMS.tsx` | 🟠 P2 | queryKey `["website","content"]` có **2 queryFn khác nhau**; `displayOrder: products.length+1` trùng thứ tự; "đặt ảnh chính" 400 khi vừa xóa ảnh; validate ảnh client ≠ server; refetch + invalidate trùng lặp |
| 11 | `backend/.../Infrastructure/Services/ContentService.cs` | 🟠 P2 | Whitelist key không phân biệt hoa/thường nhưng ghi key nguyên bản → tạo row lạ; gốc file khác `ProductService` |
| 12 | `backend/.../Infrastructure/Services/ProductService.cs` | 🟠 P2 | URL ảnh hardcode `/uploads/products` dù có `FileStorage:UploadsPath`; ghi/xóa file trước khi `SaveChanges` |
| 13 | `backend/.../API/Controllers/ProductsController.cs` | 🟠 P2 | `[Authorize]` thiếu `Roles="Admin"`; `GET /{id}` trả cả sản phẩm đang ẩn |
| 14 | `backend/.../API/Program.cs` | 🟠 P2 | `GET /` redirect `/scalar/v1` chỉ tồn tại ở Development → 404 ở production |
| 15 | `frontend/src/hooks/useAdminChat.ts` | 🟠 P2 | markRead lỗi → không tải được tin nhắn; không tự restart sau khi hết auto-reconnect |
| 16 | `frontend/src/hooks/useLiveChat.ts` | 🟠 P2 | Không tự restart SignalR sau `onclose` (khác `useRealtimeSync`) |
| 17 | `frontend/src/services/api.service.ts` | 🟠 P2 | `isLoggedIn()` decode base64 thuần (JWT là base64url); không dùng `/api/auth/me` |
| 18 | `frontend/src/views/dashboard/Dashboard.tsx` | 🟠 P2 | "Khách hàng" = SĐT từ đơn **+ khách chat**; không realtime đơn hàng; biên ngày theo giờ máy khách ≠ báo cáo tuần (giờ VN) |
| 19 | `frontend/src/app/page.tsx` | 🟡 P3 | `prefetchQuery` retry 3 lần khi backend chết → SSR treo vài giây |
| 20 | `frontend/src/components/layout/AppSidebar.tsx` | 🟡 P3 | `router.push` thay vì `<Link>`; logout về `/`; `<img>` thô |
| 21 | `frontend/src/views/discounts/DiscountManager.tsx` | 🟡 P3 | Mã "Không rõ" → form amount 0 → lỗi validate; `maxUsageCount = 0` thành "không giới hạn" |
| 22 | `backend/.../API/Controllers/AuthController.cs` | 🟡 P3 | Trả 500 kèm `ex.Message` cấu hình; không rate-limit/lockout đăng nhập |
| 23 | `frontend/src/components/ui/sidebar.tsx` | 🟡 P3 | Ghi cookie `sidebar_state` nhưng **không bao giờ đọc lại** |
| 24 | `frontend/src/views/products/ProductCMS.tsx` | ⚪ Dead | File rỗng `export {}`; `/products` render trùng `ContentCMS` |
| 25 | `frontend/src/lib/supabase.ts` | ⚪ Dead | `createClient("")` ném lỗi khi thiếu env; không dùng ở đâu |
| 26 | `frontend/src/types/api.types.ts` | ⚪ Sai kiểu | `id`/`updatedAt` không có trong response thật; `ContentKey` snake_case chết |
| 27 | `backend/.../Domain/Entities/Product.cs` | ⚪ Dead | `ImageUrl` (cột NOT NULL) không set/không đọc ở đâu |
| 28 | `backend/.../Persistence/AppDbContext.cs` | ⚪ Dead | 8 bảng Facebook legacy + 8 entity không service nào dùng |
| 29 | `backend/.../Application/Class1.cs`, `Common/Class1.cs`, `Domain/Class1.cs`, `Infrastructure/Class1.cs` | ⚪ Dead | File scaffold rỗng |
| 30 | `frontend/src/components/ui/{dropdown-menu,collapsible,avatar}.tsx` | ⚪ Dead | 0 nơi sử dụng (392 dòng) |

---

## 2. Lỗi mức P1 — sai nghiệp vụ / bảo mật

### P1-1. "Gửi lại hóa đơn" luôn báo thành công dù email thất bại
`backend/src/NguyetnhanPhohien.Infrastructure/Services/OrderService.cs:333`, `:368-371`, `:427`

```csharp
catch (Exception ex) {
    _logger.LogError(...);          // :330-335
    if (throwOnFailure) throw;      // :333  ← ném ra...
}
...
catch (Exception ex) {              // :368  ← ...rồi bị chính hàm này nuốt
    _logger.LogError(ex, "Lỗi bất ngờ khi xử lý email cho đơn {OrderId}.", order.Id);
}
```
`ResendInvoiceAsync` (`:427`) truyền `throwOnFailure: true` với chủ đích "để API trả 500" (ghi rõ ở comment `:425-426`), nhưng `try` bao ngoài bắt lại toàn bộ → `OrdersController.ResendInvoice` luôn trả **200 "Hóa đơn đã được gửi lại thành công"**, và `Orders.tsx:87` hiện toast xanh "Đã gửi hóa đơn tới …" kể cả khi SMTP sai cấu hình.
**Sửa:** đổi `SendOrderEmailsAsync` trả `bool`/ném lỗi có kiểm soát (`if (throwOnFailure) throw;` phải nằm NGOÀI catch-all), hoặc bỏ catch-all khi `throwOnFailure == true`.

### P1-2. Backdoor: bất kỳ ai cũng lấy được JWT Admin 7 ngày
`DiscountService.cs:27-37` + `GenerateAdminJwt` `:213`, phơi qua endpoint public `POST /api/discount/apply` (`DiscountController.cs:22`).

```csharp
if (code.Equals("NguyetNhanPhoHienAdmin", StringComparison.OrdinalIgnoreCase)) {
    var token = GenerateAdminJwt();    // role Admin, hạn 7 ngày
    return new DiscountResult { IsValid = true, IsAdminBackdoor = true, Token = token, ... };
}
```
Mâu thuẫn trực tiếp với `DbSeeder.cs:37` (xóa mọi row backdoor) và comment `DbSeeder.cs` "Đăng nhập admin KHÔNG còn qua mã backdoor". Frontend còn tự động hoá đường này: `useOrderForm.ts:98-100` (`adminAuth.login(result.token); router.push("/orders")`). Đây là master key vĩnh viễn, muốn tắt phải deploy lại.
**Sửa:** xoá hẳn nhánh backdoor khỏi `ApplyCodeAsync` (dùng `/api/auth/admin-login`), bỏ `IsAdminBackdoor`/`Token` khỏi DTO nếu không còn dùng.

### P1-3. Seed ghi đè sản phẩm mỗi lần khởi động backend
`DbSeeder.cs:88-102` — `UPDATE "Products" SET Name/Description … WHERE DisplayOrder IN (1,2,3)` chạy **vô điều kiện, mỗi startup** (không nằm trong `if (!AnyAsync())`).
Hệ quả: admin sửa tên/mô tả 3 sản phẩm đầu → restart backend → mất sạch, lại về chữ cứng trong code. Trớ trêu là nó còn nằm ngoài nhánh seed nên chạy cả khi DB đã có dữ liệu.
**Sửa:** đưa vào một lần migration/seed có điều kiện, hoặc xóa khối UPDATE này.

### P1-4. Bật RLS toàn bộ schema ở mọi lần khởi động
`DbSeeder.cs:22-34` — vòng lặp `ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY` cho **mọi bảng**, không tạo policy nào.
Trên Postgres: owner bảng vẫn qua được, nhưng mọi role khác (Supabase `anon`/`authenticated`/PostgREST, user chỉ đọc) bị chặn sạch. Đây là DDL thay đổi hành vi truy cập toàn DB, chạy lại mỗi boot, không được ghi lại dưới dạng migration.
**Sửa:** chuyển thành migration 1 lần + tạo policy tường minh (hoặc bỏ, vì API đã là cửa duy nhất).

### P1-5. IDOR phiên chat — khách đọc được hội thoại của người khác
`ChatHub.cs:55` (`Groups.AddToGroupAsync(ConnectionId, GroupFor(sessionId))`) + `:73`.

Group được đặt tên bằng **chuỗi sessionId do client tự khai** (`guest-{timestamp}-{random}` sinh ở `useLiveChat.ts:20`) và chuỗi này còn đi qua URL REST `/api/chat/messages/{sessionId}` (log, proxy, Referer). Không có bước nào xác nhận "phiên này thuộc về kết nối này". Ai đoán/đọc được sessionId của người khác chỉ cần gọi `JoinAsGuest(sessionId)` là nhận trọn `ReceiveAdminMessage` (nội dung admin trả lời), cùng vấn đề ở `ChatController.MarkGuestRead` (`:110`).
**Sửa:** cấp session token phía server (HMAC của sessionId + secret, hoặc Guid bí mật do server sinh) và verify trước khi add group; không nhận sessionId thô không chữ ký.

### P1-6. `GET /api/chat/messages/{sessionId}` ghi DB
`ChatController.cs:33` → `ChatService.GetOrCreateSessionAsync` (`ChatService.cs:22-56`).
Một GET không xác thực **tạo row `ChatSessions` mới** cho mọi `sessionId` lạ → crawler/scanner gọi `?sessionId=abc123…` sinh vô hạn bản ghi (bảng phình, dashboard đếm sai "Phiên nhắn tin").
**Sửa:** GET chỉ đọc (`GetSessionAsync` trả null → 404/[]), chỉ tạo phiên ở POST/SignalR.

### P1-7. Trạng thái đơn hàng nhận giá trị số vô nghĩa
`OrderService.cs:400`
```csharp
if (!Enum.TryParse<OrderStatus>(status, true, out var newStatus))
```
Đã kiểm chứng bằng chương trình thật: `"5"` → `ok=True, value=5, defined=False`; `"99"`, `"-1"` tương tự. `PUT /api/orders/{id}/status` với body `{"status":"99"}` ghi thẳng (OrderStatus)99 vào DB. Hậu quả dây chuyền: `Orders.tsx` `STATUS_LABELS[status]` rơi về chuỗi số thô, `STATUS_COLORS` mất màu; `WeeklyReportBackgroundService.StatusLabels` không khớp key → đơn đó không được đếm; `order.Status.ToString()` trả "99".
**Sửa:** `if (!Enum.TryParse<OrderStatus>(status, true, out var s) || !Enum.IsDefined(s)) throw new ArgumentException(...)`.

### P1-8. ESLint đang đỏ (CI sẽ fail)
`frontend/src/views/orders/Orders.tsx:57-58`
```
58:16  error  Error: Cannot call impure function during render
`Date.now` is an impure function.  react-hooks/purity
```
`npx eslint src` → **exit 1**. `next build` vẫn xanh vì Next 16 không chạy ESLint trong build → lỗi âm thầm tới lúc CI (`npm run lint`) mới nổ.
**Sửa:** dùng bộ đếm tăng dần trong `useRef` (hoặc `crypto.randomUUID()` bên trong một hàm được gọi từ event handler, không phải biến render).

---

## 3. Lỗi mức P2

### P2-1. Lỗi submit ở Landing Page bị "nuốt" nguyên nhân
`LandingPage.tsx:681-686` hiện câu chung `t.order.error`, còn `errorMessage` (lý do thật: "Mã giảm giá đã hết hạn", "Số lượng phải từ 1 đến 999"…) chỉ render ở `:821-822` với điều kiện `!submitStatus.includes("error")` → **đúng lúc submit lỗi thì lý do không bao giờ hiện**. Sửa: render `errorMessage` trong khối đỏ.

### P2-2. `addItem` sinh dòng trùng sản phẩm
`useOrderForm.ts:50` `products.find(p => !selectedIds.has(p.id)) || products[0]` — khi đã chọn hết sản phẩm, dòng mới lặp lại sản phẩm đầu. Backend gom nhóm theo `ProductId` và **cộng dồn số lượng** (`OrderService.cs:60-64`) → khách thấy 2 dòng nhưng đơn chỉ 1 dòng với SL gấp đôi; xoá 1 dòng không xoá được mặt hàng khỏi đơn. Sửa: chặn/disable khi đã dùng hết sản phẩm.

### P2-3. Hai `queryFn` khác nhau cho cùng `queryKey ["website","content"]`
`ContentCMS.tsx:91-101` map thô (chỉ thêm `""` cho key nó biết) vs `lib/contentQuery.ts:27-40` (`fetchWebsiteContent` có merge `defaultContents` ở `:11`).
React Query dùng queryFn của observer đang hoạt động → mở `/content` rồi điều hướng trong cùng tab sang `/` (cùng `QueryClient`) có thể nhận bản **không có giá trị mặc định** → mất text mặc định trên landing. Đây đúng lớp lỗi đã sửa trước đó nhưng còn sót lại ở ContentCMS. Sửa: dùng chung `fetchWebsiteContent` (+ merge `""` cho key thiếu ngay trong `contentQuery.ts`).

### P2-4. `displayOrder: products.length + 1` gây trùng thứ tự
`ContentCMS.tsx:161`. Xoá sản phẩm giữa danh sách rồi thêm mới → `length+1` đụng thứ tự đang có → thứ tự hiển thị không xác định. Sửa: `Math.max(0, ...products.map(p => p.displayOrder)) + 1`.

### P2-5. "Đặt ảnh chính" báo lỗi khi vừa xoá ảnh (chưa lưu)
`ContentCMS.tsx:199-213`: gửi `reorderImages(editingId, next.map(i => i.id))` với `next` = `existingImages` **đã bỏ ảnh vừa bấm ✕** (ảnh đó vẫn còn trong DB) → `ProductService.ReorderImagesAsync` (`:149-167`) kiểm tra "gửi đủ id, không thừa/thiếu" → 400 → alert "Lỗi khi đặt ảnh chính". Sửa: gọi API xoá trước, hoặc gửi danh sách dựa trên ảnh còn trên server rồi mới xoá.

### P2-6. Validate ảnh client ≠ server
Client: `accept="image/*"` + kiểm `file.type.startsWith("image/")` (`ContentCMS.tsx:175`, `:739`). Server: whitelist **đuôi file** `.jpg/.jpeg/.png/.webp/.gif` (`ProductsController.cs:143-145`, `ContentController.cs:132-134`).
Chọn `.heic/.bmp/.svg` → client cho qua → nén xong vẫn giữ tên gốc → server 400 giữa luồng lưu sản phẩm (sản phẩm đã tạo/sửa xong) → người dùng thấy "Lỗi khi lưu sản phẩm" dù thực ra đã lưu một phần. Sửa: chặn theo đuôi ở client và đổi tên file nén theo MIME.

### P2-7. Hai gốc lưu file khác nhau; URL ảnh hardcode
`ProductService.cs:19-23` theo `FileStorage:UploadsPath` (khác thì dùng), nhưng `ContentService.cs:70` luôn `Directory.GetCurrentDirectory()/wwwroot`; và `ProductService.cs:118` hardcode `ImagePath = $"/uploads/products/{file}"`.
Nếu cấu hình `FileStorage:UploadsPath` trỏ nơi khác (đúng như tên cấu hình gợi ý), ảnh sản phẩm ghi ra ngoài `wwwroot` nhưng URL vẫn trỏ `/uploads/products/…` → mọi ảnh 404. Sửa: một nguồn duy nhất (`IWebHostEnvironment.WebRootPath`) và lưu path tương đối theo gốc đó.

### P2-8. Ghi file trước, ghi DB sau (và ngược lại khi xoá)
- `ProductService.AddImageAsync` `:104-124`: ghi file trước `SaveChangesAsync` → DB lỗi = file rác vĩnh viễn.
- `ProductService.DeleteAsync` `:88-93` và `DeleteImageAsync` `:141-145`: xoá file **trước** khi `SaveChangesAsync` → DB lỗi = row trỏ tới file đã mất.
(Đối chiếu: `ContentService.cs:98-110` xoá ảnh cũ **sau** khi lưu — thứ tự đúng.)

### P2-9. Whitelist key ảnh không phân biệt hoa/thường nhưng ghi key nguyên bản
`ContentService.cs:67` kiểm tra `ImageKeys.Contains(contentKey, StringComparer.OrdinalIgnoreCase)`, nhưng `:83-87` + `UpsertContentAsync(Key = contentKey)` dùng đúng chuỗi nhận được.
`POST /api/content/upload-image?key=herobannerurl` → hợp lệ → nhưng tạo/lưu row key `herobannerurl`, còn landing đọc `HeroBannerUrl` → **ảnh không bao giờ hiện** + file rác. Sửa: map về key chuẩn (`First(k => k.Equals(..., OrdinalIgnoreCase))`).

### P2-10. Giới hạn sessionId 100 ≠ 128
Hub cho 128 (`ChatHub.cs:51,81,149`), REST + service chỉ cho 100 (`ChatController.cs:29,110`, `ChatService.cs:96`). Khách có id dài 101–128 gửi được qua WebSocket nhưng khi WS bị chặn (fallback REST) sẽ nhận 400 "SessionId không hợp lệ". Sửa: hằng số dùng chung.

### P2-11. `selectSession`: markRead lỗi → không tải được tin nhắn
`useAdminChat.ts:51-66` — `await chatApi.markRead()` (`:56`) và `await chatApi.getSessionMessages()` (`:63`) nằm trong CÙNG một `try`; markRead fail (mạng/401) là toàn bộ tin nhắn của phiên không được tải, chỉ `console.warn`. Tách 2 `try` độc lập.

### P2-12. Chat không tự khôi phục kết nối
`useLiveChat.ts:81,118` và `useAdminChat.ts:157,236` dùng `withAutomaticReconnect()` mặc định (5 lần, ~1 phút), `onclose` chỉ set `isConnected=false` — **không có timer start() lại**, trong khi `useRealtimeSync.ts:42-70` có đúng cơ chế đó (10s). Hệ quả: backend restart/mất mạng lâu → admin mất realtime chat âm thầm, phải F5; khách phải gửi qua REST fallback.
Sửa: dùng chung một builder/config (delay + restart) cho cả 3 hook.

### P2-13. `adminAuth.isLoggedIn()` decode base64 thuần
`api.service.ts:356-368`, dòng `:362` `JSON.parse(atob(token.split(".")[1]))` — JWT dùng **base64url**; nếu payload có `-`/`_` thì `atob` ném → `catch { return false }` → coi như hết hạn → `useAdminGuard` đá về `/admin-login` dù token còn hạn. Kiểm chứng với payload hiện tại (claim Microsoft/SOAP URI) chưa xuất hiện ký tự đó → **tiềm ẩn**, nhưng chỉ cần đổi claim (thêm `nbf`/`iat`, username có ký tự đặc biệt) là hỏng.
Sửa: `atob(s.replace(/-/g,"+").replace(/_/g,"/"))` + kiểm padding; và gọi `GET /api/auth/me` (đã có nhưng **không nơi nào dùng**) để xác thực thật thay vì chỉ tin đồng hồ client.

### P2-14. `/api/products/{id}` trả cả sản phẩm đang ẩn; `[Authorize]` thiếu role
`ProductsController.cs:83-88` (`GetById`) không `[Authorize]` và `ProductService.GetByIdAsync:42-46` không lọc `IsActive` → ai có GUID vẫn xem được sản phẩm admin đã ẩn (khác hẳn ngữ nghĩa "Ẩn").
`ProductsController.cs:77,93,102,112,125,161,175` dùng `[Authorize]` trần, trong khi Orders/Discount/Chat đều `[Authorize(Roles = "Admin")]` → sai lệch phân quyền, nguy hiểm ngay khi có user không phải admin.
Sửa: thêm `Roles="Admin"` cho toàn bộ endpoint admin; `GetById` public thì lọc `IsActive`.

### P2-15. `GET /` của API trỏ tới trang chỉ có ở Development
`Program.cs:186` `app.MapGet("/", … Redirect("/scalar/v1"))` nhưng `MapOpenApi/MapScalarApiReference` chỉ chạy `if (IsDevelopment())` (`Program.cs:149-158`) → production: `/` → 404. Sửa: điều kiện hoá theo env hoặc trả JSON thông tin API.

### P2-16. HTML email không escape dữ liệu khách nhập
`OrderService.cs` nội suy `CustomerName/CustomerAddress/Note/ProductName` trực tiếp vào HTML gửi khách **và** gửi admin (không `WebUtility.HtmlEncode`), trong khi `WeeklyReportBackgroundService.BuildReportHtml` có `Esc()` (WebUtility.HtmlEncode). Khách nhập `<img src=x onerror=...>` vào ghi chú/tên là chèn được HTML vào mail admin. Sửa: escape đồng bộ mọi trường người dùng nhập.

### P2-17. Email admin hardcode
`OrderService.cs:202` `string adminEmail = "nhotungdo89@gmail.com";` — nên là `Order:AdminNotifyEmail` trong config (đổi người nhận hiện phải deploy lại).

### P2-18. `Orders`/`Dashboard` không realtime
`Orders.tsx:48-58` query `["orders","admin"]` chỉ fetch một lần (staleTime toàn cục 5 phút), không có event SignalR nào cho đơn hàng (`ProductsHub` chỉ có `ProductsChanged`/`ContentChanged`) → đơn mới không xuất hiện cho tới khi F5, trong khi sản phẩm/nội dung đã realtime. Đây là **khoảng trống logic** so với kỳ vọng của dự án ("tăng tốc & realtime"). Sửa: thêm `OrdersChanged`/`SessionsChanged` vào `ProductsHub` + broadcast trong `OrdersController`/`ChatController` + invalidate ở `useRealtimeSync`.

### P2-19. Dashboard: số liệu "Khách hàng" và mốc ngày không nhất quán
`Dashboard.tsx:66-74`: `uniquePhones` = SĐT trong đơn **+ SĐT khách chat** → người chỉ chat (chưa mua) vẫn tính là khách hàng → KPI lệch.
`Dashboard.tsx:94-124` gom ngày theo giờ **máy khách** (`new Date(o.createdAt)`), còn `WeeklyReportBackgroundService` gom theo giờ **VN** → cùng kỳ báo cáo cho 2 con số khác nhau khi máy khách không ở UTC+7.
Sửa: thống nhất múi giờ (dùng `Intl` với `timeZone: "Asia/Ho_Chi_Minh"`) và tách "khách hàng" = khách có đơn, "khách chat" = phiên chat.

---

## 4. Mức P3 / code smell / dead code

| Vấn đề | Vị trí |
|---|---|
| Monkey-patch `console.error` toàn cục ở 2 file (trùng lặp, lọc theo chuỗi lỗi SignalR, không bao giờ khôi phục) | `LandingPage.tsx:3-14`, `Messenger.tsx:3-14` |
| Hero tách 2 dòng: `HeroTitle` 1 từ → dòng 2 rỗng; giá EN quy đổi cứng `/25000` | `LandingPage.tsx:74-82`, `:333` |
| `useWebsiteContent` không override `staleTime` → nội dung CMS có thể cũ tới 5 phút khi SignalR bị chặn (products đã 60s) | `hooks/useWebsiteContent.ts:10-15` |
| `prefetchQuery` SSR mặc định retry 3 lần → backend chết thì mỗi lượt vào trang chờ vài giây | `app/page.tsx:18-37` |
| `lang="vi"` cố định dù có chế độ EN | `app/layout.tsx:33` |
| `refetchProducts()` + `invalidateQueries(["products","public"])` sau mỗi thao tác (invalidate prefix `["products"]` đã bao trùm cả `["products","admin"]`) → gọi API thừa | `ContentCMS.tsx:206,267,275,285` (+ invalidate `:133,146`) |
| `setQueryData` rồi `invalidateQueries` ngay → giá trị optimistic bị ghi đè, thừa 1 request | `Orders.tsx:67-70` |
| Mã "Không rõ" (percentOff & amountOff đều null) mở form `amount` value 0 → lưu lỗi validate; `maxUsageCount` nhập `0` thành "không giới hạn" (falsy) | `DiscountManager.tsx:52-53,67-70` |
| `useDiscounts` gửi `Partial<DiscountDto>` (kèm `usageCount`, `createdAt`, `isAdminBackdoor`) → server bỏ qua, dễ hiểu nhầm là set được | `hooks/useDiscounts.ts:24-36` |
| `LastMessagePreview` luôn rỗng ở đường REST (`MapSessionToResponse(session, string.Empty)`) | `ChatService.cs:53,214-225` |
| Race tạo phiên: request thua mất `guestName/guestPhone` | `ChatService.cs:37-46` |
| Không giới hạn độ dài `CustomerName/Phone/Address/Note` → đơn rác/DB phình | `OrdersController.cs:25-40`, `OrderService.CreateOrderAsync` |
| Không rate-limit/lockout đăng nhập admin; trang login ghi "Mọi truy cập được ghi log" nhưng **không có log nào** | `AuthController.cs:25-44`, `admin-login/page.tsx` |
| Trả 500 kèm `ex.Message` (lộ trạng thái cấu hình nội bộ) | `AuthController.cs:42` |
| `Task.Run` fire-and-forget trong service scoped (chạy ngoài vòng đời request, dễ vỡ nếu thêm truy cập DB) | `OrderService.cs:193` |
| Báo cáo tuần tính theo `CreatedAt` (đơn hoàn thành muộn vẫn vào tuần đặt) | `WeeklyReportBackgroundService.cs:106,115` |
| `Playfair Display` được khai trong font-family email nhưng không nạp — vô hại | `OrderService.cs` (email HTML) |
| Cookie `sidebar_state` ghi mà không đọc; `defaultOpen` cứng | `ui/sidebar.tsx:26,84`, `DashboardLayout.tsx:19` |
| `router.push` trong `onClick` (mất prefetch/mở tab mới); logout đẩy về `/` thay vì `/admin-login`; dùng `<img>` thô thay `FastImage` | `AppSidebar.tsx:59`, `:29-31`, `:41` |
| Modal gallery không khoá scroll body; phím ←/→ vô nghĩa khi 0 ảnh (index NaN) | `ProductGalleryModal.tsx:31-42` |
| `src/lib/utils.ts` chỉ re-export `cn` nhưng các file UI import thẳng từ package `cn` → không nhất quán | `lib/utils.ts`, `ui/*.tsx` |
| `BOM + CRLF` không nhất quán với phần còn lại của repo | `components/Providers.tsx` |

### Dead code / dư thừa (không sai logic nhưng nên dọn)
1. `frontend/src/views/products/ProductCMS.tsx` — rỗng (`export {}`), trong khi `app/(admin)/products/page.tsx` render `ContentCMS` → 2 URL cùng nội dung nặng; sidebar không có mục Sản phẩm.
2. `frontend/src/lib/supabase.ts` — `createClient("")` ném lỗi ngay khi import nếu thiếu env; **không file nào import nó** (dependency `@supabase/supabase-js` + 2 biến env còn nằm trong `.env`).
3. `frontend/src/assets/*` — `hero.png, react.svg, logo.jpg, tuizip.jpg, hopnhua.jpg, setqua.jpg` không được import ở đâu; `hopqua.jpg`/`lonhua.jpg` đang ở trạng thái **deleted chưa commit** (nếu commit thì dọn cả cụm).
4. `frontend/src/components/ui/dropdown-menu.tsx` (265 dòng), `collapsible.tsx`, `avatar.tsx` (108 dòng) — 0 nơi sử dụng.
5. Backend: `Domain/Entities/{User,FacebookPage,FacebookPost,Conversation,Message,Customer,AutoReplyRule,BotSetting}.cs` + 8 `DbSet` + ~70 dòng cấu hình EF (`AppDbContext.cs:11-19,47-84`) không service/controller nào dùng.
6. `Product.ImageUrl` (`Domain/Entities/Product.cs:33`, cột NOT NULL trong migration) — không được set ở `CreateAsync/UpdateAsync` và không map ra `ProductResponse`.
7. `Class1.cs` × 4 project — file scaffold rỗng.
8. Rác build/dev trong backend: `src/.../bin/Release9/`, `obj/_verifybin/`, `run-test.log`, `run-test-err.log` (đã nằm trong `.gitignore` nhưng vẫn chiếm đĩa).
9. `types/api.types.ts`: `ContentKey` (snake_case, chết), `WebsiteContentResponse.id/updatedAt` (backend không trả → luôn `undefined`), `ProductResponse` không có `imageUrl` (khớp backend — ổn).

---

## 5. Điểm **không** phải lỗi (đã kiểm chứng để tránh báo nhầm)

- `Orders.tsx:307` `toLocaleDateString("vi-VN", { hour, minute })` — V8 **có** in cả giờ (đã test) → không phải bug.
- `vi.ts` vs `en.ts` — đủ 71/71 key, không thiếu key nào (đã test).
- `Enum.TryParse` case-insensitive cho `"shipping"` → đúng như mong đợi.
- `FastImage` + `dangerouslyAllowLocalIP` + `remotePatterns` — logic `canOptimize` đúng (chặn `data:`/`blob:`/`//`/host lạ).
- `ProductService.MapToResponse`, `ReorderImagesAsync` (kiểm tra đủ/không trùng/không id lạ), `maxOrder ?? -1 + 1` — logic đúng.
- `AppDbContext` cấu hình EF (precision, cascade, unique index `ChatSession.SessionId`, `DiscountCode.Code`) — đúng.
- `useRealtimeSync.ts` — đúng, có restart timer + invalidate khi reconnect.
- `DbSeeder` seed sản phẩm/nội dung (`if (!AnyAsync())`) — đúng (khác với khối UPDATE ở P1-3).

---

## 6. Thứ tự sửa đề xuất

1. **P1-2** (bỏ backdoor) + **P1-5/P1-6** (IDOR/GET ghi DB) — bảo mật, sửa nhỏ, rủi ro cao.
2. **P1-1** (resend-invoice báo ảo) + **P1-7** (status số) — sai nghiệp vụ, ảnh hưởng tiền/thống kê.
3. **P1-3/P1-4** (seeder ghi đè + RLS) — mất dữ liệu admin gõ tay mỗi lần restart.
4. **P1-8** (ESLint) — để CI xanh.
5. **P2-1 → P2-9** — trải nghiệm admin/khách + tính đúng đắn của upload ảnh.
6. Dọn dead code (mục 4) — giảm ~1.000 dòng và 1 dependency không dùng.
