# BÁO CÁO PHÂN TÍCH LUỒNG WORKFLOW - FRONTEND & BACKEND

## TỔNG QUAN

Báo cáo này phân tích việc triển khai luồng workflow theo mô tả và so sánh với code hiện tại của Frontend và Backend.

---

## 1. STATUS MAPPING (Backend → Frontend)

### Backend Status Values:
- `PENDING` → "đợi"
- `WAITING` hoặc `READY` → "chờ làm" 
- `IN_PROGRESS` → "đang làm"
- `WAITING_QC` → "chờ kiểm tra"
- `QC_IN_PROGRESS` → "đang kiểm tra"
- `QC_PASSED` → "đạt"
- `QC_FAILED` → "không đạt"
- `WAITING_REWORK` → "chờ sửa"
- `REWORK_IN_PROGRESS` → "đang sửa"

### Frontend Display Labels cần:
- "đợi" / "chờ làm" / "đang làm" / "chờ kiểm tra" / "đang kiểm tra" / "đạt" / "không đạt" / "chờ sửa" / "đang sửa"

---

## 2. PHÂN TÍCH THEO LUỒNG WORKFLOW

### 2.1. BƯỚC 1: PM bắt đầu lệnh làm việc

**Luồng mô tả:**
- PM vào danh sách đơn hàng → ấn "xem kế hoạch"
- Vào xem kế hoạch → ấn "bắt đầu lệnh làm việc"
- Backend gửi thông báo đến tất cả Leaders và KCS
- Stage đầu tiên: `WAITING` (chờ làm)
- Các stage khác: `PENDING` (đợi)

**Backend:** ✅ Đã OK
- `ProductionService.startWorkOrder()` đã xử lý đúng
- Gửi notification đến Leaders và QC
- Set status đúng: WAITING cho stage đầu, PENDING cho các stage khác

**Frontend:** ⚠️ CẦN SỬA

**File: `ProductionOrderDetail.jsx`**
- ✅ Có button "Bắt đầu lệnh làm việc"
- ✅ Có gọi API `startWorkOrder`
- ⚠️ **THIẾU:** Cần fetch stages data để hiển thị đúng
- ⚠️ **THIẾU:** Cần refresh data sau khi start để cập nhật status

**Cần sửa:**
```javascript
// Cần fetch stages từ backend
const stages = await productionService.getOrderStages(orderId);
// Hoặc stages đã có trong order data nhưng cần map đúng
```

---

### 2.2. BƯỚC 2: Leader bắt đầu công đoạn

**Luồng mô tả:**
- Leader nhận thông báo → vào danh sách đơn hàng
- Thấy button "Bắt đầu" (khi status = WAITING/READY)
- Ấn "Bắt đầu" → chuyển vào màn "cập nhật tiến độ"
- Status đổi thành `IN_PROGRESS` (đang làm)
- Button đổi thành "Cập nhật tiến độ"

**Backend:** ✅ Đã OK
- `ExecutionOrchestrationService.startStage()` xử lý đúng
- Chuyển status từ WAITING → IN_PROGRESS

**Frontend:** ❌ CẦN SỬA NHIỀU

**File: `LeaderOrderList.jsx`**
- ❌ **LỖI:** Button luôn hiển thị "Chi tiết" thay vì "Bắt đầu"
- ❌ **THIẾU:** Không check status để hiển thị button đúng
- ❌ **THIẾU:** Không fetch stages data để biết status

**Cần sửa:**
```javascript
// Cần fetch stages để check status
// Nếu stage.executionStatus === 'WAITING' hoặc 'READY' → hiển thị "Bắt đầu"
// Nếu stage.executionStatus === 'IN_PROGRESS' → hiển thị "Cập nhật tiến độ"
// Nếu stage.executionStatus === 'WAITING_QC' → hiển thị "Xem chi tiết"
```

**File: `LeaderOrderDetail.jsx`**
- ❌ **THIẾU:** Không có button "Bắt đầu" ở đây
- ❌ **THIẾU:** Chỉ có button "Chi tiết" → cần thêm logic hiển thị button đúng

**File: `LeaderStageProgress.jsx`**
- ✅ Có button "Bắt đầu công đoạn" khi status = READY
- ✅ Có form "Cập nhật tiến độ" khi status = IN_PROGRESS
- ⚠️ **CẦN KIỂM TRA:** Logic check status có đúng không (WAITING vs READY)
- ⚠️ **THIẾU:** Sau khi start, cần tự động redirect hoặc refresh để ẩn button "Bắt đầu"

---

### 2.3. BƯỚC 3: Leader cập nhật tiến độ = 100%

**Luồng mô tả:**
- Leader cập nhật tiến độ = 100%
- Thanh nhập "cập nhật tiến độ" biến mất
- Button đổi thành "Xem chi tiết"
- Status đổi thành `WAITING_QC` (chờ kiểm tra)
- Gửi thông báo đến KCS

**Backend:** ✅ Đã OK
- `ExecutionOrchestrationService.updateProgress()` xử lý đúng
- Khi progress = 100% → chuyển status thành WAITING_QC
- Gửi notification đến QC

**Frontend:** ⚠️ CẦN SỬA

**File: `LeaderStageProgress.jsx`**
- ✅ Có form cập nhật tiến độ
- ⚠️ **THIẾU:** Sau khi cập nhật = 100%, cần ẩn form và đổi button
- ⚠️ **THIẾU:** Cần refresh data sau khi update để cập nhật status
- ⚠️ **THIẾU:** Cần check nếu progress = 100% thì ẩn form input

**File: `LeaderOrderList.jsx`**
- ❌ **THIẾU:** Sau khi progress = 100%, button cần đổi thành "Xem chi tiết"
- ❌ **THIẾU:** Status cần hiển thị "chờ kiểm tra"

---

### 2.4. BƯỚC 4: KCS kiểm tra

**Luồng mô tả:**
- KCS nhận thông báo → vào danh sách đơn hàng
- Ấn "xem kế hoạch"
- Thấy stage với status = `WAITING_QC` (chờ kiểm tra)
- Có button "Kiểm tra"
- Ấn "Kiểm tra" → vào màn kiểm tra chất lượng
- Đánh giá theo tiêu chí, chụp ảnh nếu lỗi
- Nếu có lỗi → hiện form chọn mức độ lỗi và mô tả
- Ấn "Gửi kết quả kiểm tra"
- Nếu "đạt" → thông báo đến Leader tiếp theo (hoặc PM cho nhuộm)
- Nếu "không đạt" → thông báo đến Kỹ thuật

**Backend:** ✅ Đã OK
- `QcService.startQcSession()` xử lý đúng
- `QcService.submitQcSession()` xử lý đúng
- Gửi notification đúng (đạt → next leader, không đạt → technical)

**Frontend:** ❌ CẦN SỬA NHIỀU

**File: `QaOrderList.jsx`**
- ✅ Có danh sách đơn hàng
- ✅ Có button "Xem kế hoạch"
- ⚠️ **OK:** Đã có API call

**File: `QaOrderDetail.jsx`**
- ❌ **LỖI NGHIÊM TRỌNG:** Không fetch stages data từ backend
- ❌ **LỖI:** Đang dùng mock data `MOCK_QA_ORDER.stages`
- ❌ **THIẾU:** Không map stages từ backend response
- ❌ **THIẾU:** Button "Kiểm tra" hiển thị cho tất cả stages thay vì chỉ stage có status = WAITING_QC
- ❌ **THIẾU:** Không check status để hiển thị button đúng

**Cần sửa:**
```javascript
// Cần fetch stages từ backend
const orderData = await orderService.getOrderById(orderId);
// Backend có thể trả về stages trong orderData hoặc cần gọi API riêng
// Cần map stages và check status để hiển thị button "Kiểm tra" chỉ khi:
// stage.executionStatus === 'WAITING_QC'
```

**File: `QaStageQualityCheck.jsx`**
- ✅ Có form kiểm tra chất lượng
- ✅ Có logic xử lý kết quả đạt/không đạt
- ✅ Có form chọn mức độ lỗi và mô tả khi không đạt
- ✅ Có gọi API submit
- ⚠️ **CẦN KIỂM TRA:** Logic check status để start session có đúng không

---

### 2.5. BƯỚC 5: Stage tiếp theo (lặp lại từ bước 2)

**Luồng mô tả:**
- Sau khi stage trước "đạt" → stage tiếp theo chuyển từ `PENDING` → `WAITING`
- Leader tiếp theo nhận thông báo và làm tương tự

**Backend:** ✅ Đã OK
- `ExecutionOrchestrationService` xử lý chuyển status đúng
- Gửi notification đến Leader tiếp theo

**Frontend:** ⚠️ CẦN SỬA
- Các vấn đề tương tự như bước 2-4

---

### 2.6. BƯỚC ĐẶC BIỆT: Công đoạn Nhuộm (PM quản lý)

**Luồng mô tả:**
- PM nhận thông báo stage dệt "đạt"
- PM vào "xem kế hoạch"
- Thấy công đoạn nhuộm với status từ "đợi" → "chờ làm"
- Có button "Bắt đầu"
- PM ấn "Bắt đầu" → chuyển vào "cập nhật tiến độ"
- PM cập nhật tiến độ, khi = 100% → chuyển thành "chờ kiểm tra"

**Backend:** ✅ Đã OK
- Logic xử lý tương tự các stage khác

**Frontend:** ❌ CẦN SỬA

**File: `ProductionOrderDetail.jsx`**
- ❌ **THIẾU:** Cần hiển thị button "Bắt đầu" cho stage nhuộm khi status = WAITING
- ❌ **THIẾU:** Cần hiển thị button "Cập nhật tiến độ" khi status = IN_PROGRESS
- ❌ **THIẾU:** Cần fetch và hiển thị stages với đúng status

---

## 3. DANH SÁCH CÁC VẤN ĐỀ CẦN SỬA

### 3.1. Frontend - Leader Pages

#### `LeaderOrderList.jsx`
- [ ] **CRITICAL:** Fetch stages data để check status
- [ ] **CRITICAL:** Hiển thị button "Bắt đầu" khi stage.executionStatus === 'WAITING' hoặc 'READY'
- [ ] **CRITICAL:** Hiển thị button "Cập nhật tiến độ" khi stage.executionStatus === 'IN_PROGRESS'
- [ ] **CRITICAL:** Hiển thị button "Xem chi tiết" khi stage.executionStatus === 'WAITING_QC' hoặc các status khác
- [ ] **CRITICAL:** Hiển thị status label đúng theo mapping

#### `LeaderOrderDetail.jsx`
- [ ] **CRITICAL:** Fetch stages data từ backend
- [ ] **CRITICAL:** Hiển thị button "Bắt đầu" khi status = WAITING/READY
- [ ] **CRITICAL:** Hiển thị button "Cập nhật tiến độ" khi status = IN_PROGRESS
- [ ] **CRITICAL:** Hiển thị button "Xem chi tiết" khi status = WAITING_QC

#### `LeaderStageProgress.jsx`
- [ ] **MEDIUM:** Verify status check logic (WAITING vs READY)
- [ ] **MEDIUM:** Sau khi start, refresh data để ẩn button "Bắt đầu"
- [ ] **MEDIUM:** Sau khi update progress = 100%, ẩn form và đổi button
- [ ] **MEDIUM:** Check nếu progress = 100% thì ẩn form input

### 3.2. Frontend - KCS/QA Pages

#### `QaOrderDetail.jsx`
- [ ] **CRITICAL:** Fetch stages data từ backend (hiện đang dùng mock)
- [ ] **CRITICAL:** Map stages từ backend response
- [ ] **CRITICAL:** Chỉ hiển thị button "Kiểm tra" khi stage.executionStatus === 'WAITING_QC'
- [ ] **CRITICAL:** Hiển thị status label đúng
- [ ] **MEDIUM:** Hiển thị button "Chi tiết" cho các status khác

#### `QaStageQualityCheck.jsx`
- [ ] **LOW:** Verify logic check status để start session
- [ ] **LOW:** Verify redirect sau khi submit thành công

### 3.3. Frontend - PM Pages

#### `ProductionOrderDetail.jsx`
- [ ] **CRITICAL:** Fetch stages data từ backend
- [ ] **CRITICAL:** Hiển thị button "Bắt đầu" cho stage nhuộm khi status = WAITING
- [ ] **CRITICAL:** Hiển thị button "Cập nhật tiến độ" cho stage nhuộm khi status = IN_PROGRESS
- [ ] **CRITICAL:** Refresh data sau khi start work order
- [ ] **MEDIUM:** Hiển thị đúng status cho từng stage

### 3.4. API Service

#### `productionService.js`
- [ ] **MEDIUM:** Verify API endpoint để fetch stages của order
- [ ] **MEDIUM:** Verify API endpoint để fetch order detail với stages

#### `orderService.js`
- [ ] **CRITICAL:** Verify API `getOrderById` có trả về stages không
- [ ] **CRITICAL:** Nếu không có, cần thêm API hoặc sử dụng API khác

---

## 4. STATUS MAPPING FUNCTION CẦN TẠO

Cần tạo helper function để map backend status sang display label:

```javascript
// utils/statusMapper.js
export const getStatusLabel = (status) => {
  const statusMap = {
    'PENDING': 'đợi',
    'WAITING': 'chờ làm',
    'READY': 'chờ làm',
    'IN_PROGRESS': 'đang làm',
    'WAITING_QC': 'chờ kiểm tra',
    'QC_IN_PROGRESS': 'đang kiểm tra',
    'QC_PASSED': 'đạt',
    'QC_FAILED': 'không đạt',
    'WAITING_REWORK': 'chờ sửa',
    'REWORK_IN_PROGRESS': 'đang sửa',
    'COMPLETED': 'hoàn thành'
  };
  return statusMap[status] || status;
};

export const getButtonForStage = (status, userRole) => {
  if (userRole === 'leader') {
    if (status === 'WAITING' || status === 'READY') {
      return { text: 'Bắt đầu', action: 'start' };
    }
    if (status === 'IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update' };
    }
    if (status === 'WAITING_QC' || status === 'QC_PASSED' || status === 'QC_FAILED') {
      return { text: 'Xem chi tiết', action: 'detail' };
    }
  }
  if (userRole === 'qa' || userRole === 'kcs') {
    if (status === 'WAITING_QC') {
      return { text: 'Kiểm tra', action: 'inspect' };
    }
    return { text: 'Chi tiết', action: 'detail' };
  }
  if (userRole === 'production' || userRole === 'pm') {
    // Cho stage nhuộm
    if (status === 'WAITING' || status === 'READY') {
      return { text: 'Bắt đầu', action: 'start' };
    }
    if (status === 'IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update' };
    }
    return { text: 'Chi tiết', action: 'detail' };
  }
  return { text: 'Chi tiết', action: 'detail' };
};
```

---

## 5. BACKEND - ĐÁNH GIÁ

### ✅ ĐÃ OK:
1. `ProductionService.startWorkOrder()` - xử lý đúng
2. `ExecutionOrchestrationService.startStage()` - xử lý đúng
3. `ExecutionOrchestrationService.updateProgress()` - xử lý đúng
4. `QcService.startQcSession()` - xử lý đúng
5. `QcService.submitQcSession()` - xử lý đúng
6. Notification service - gửi thông báo đúng
7. Status transitions - chuyển đổi đúng

### ⚠️ CẦN KIỂM TRA:
1. API endpoint để fetch stages của order có đầy đủ không?
2. Response format có đúng không? (stages có trong order data không?)

---

## 6. KẾT LUẬN

### Backend: ✅ ĐÃ OK (95%)
- Logic workflow đã đúng
- Status transitions đã đúng
- Notifications đã đúng

### Frontend: ❌ CẦN SỬA NHIỀU (40%)
- **CRITICAL Issues:** 15+ vấn đề cần sửa ngay
- **MEDIUM Issues:** 5+ vấn đề cần sửa
- **LOW Issues:** 2+ vấn đề

### Ưu tiên sửa:
1. **P0 (CRITICAL):** Fetch stages data từ backend thay vì mock
2. **P0 (CRITICAL):** Hiển thị button đúng theo status
3. **P0 (CRITICAL):** Map status labels đúng
4. **P1 (MEDIUM):** Refresh data sau các actions
5. **P2 (LOW):** Polish UI/UX

---

## 7. GHI CHÚ

- Frontend hiện tại đang dùng nhiều mock data
- Cần thay thế mock data bằng API calls thật
- Cần đảm bảo không thay đổi UI/UX, chỉ thay mock data thành API
- Các trường và button không được đổi, chỉ logic hiển thị dựa trên status

