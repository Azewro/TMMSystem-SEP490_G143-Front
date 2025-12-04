### Tổng hợp validate frontend theo từng component/page

**Mục tiêu**: Ghi rõ, chi tiết, **cho từng file cụ thể**: mỗi field đang được validate thế nào (required, regex, min/max, rule custom).

---

### 1. Nhóm `pages/auth/*`

- **`pages/auth/LoginPage.jsx`** (Đăng nhập khách hàng)
  - Hàm `handleSubmit`:
    - Nếu `email` trống hoặc chỉ khoảng trắng → `setError('Email không được để trống.')` và **không** gọi API.
    - Nếu `password` trống hoặc chỉ khoảng trắng → `setError('Mật khẩu không được để trống.')`.
  - Input HTML:
    - Email:
      - `type="email"` (trình duyệt kiểm tra format cơ bản).
      - `required` (bắt buộc nhập).
    - Password:
      - `type="password"`.
      - `required`.

- **`pages/auth/InternalLoginPage.jsx`** (Đăng nhập nội bộ)
  - Hàm `handleSubmit`:
    - Nếu `!formData.email.trim() || !formData.password` → lỗi chung `setError('Vui lòng nhập đầy đủ email và mật khẩu')`, dừng xử lý.
  - Input HTML:
    - Email nhân viên:
      - `type="email"`, `required`.
    - Password:
      - `type="password"`, `required`.

- **`pages/auth/CustomerForgotPassword.jsx`**
  - Hàm `validateEmail(email)`:
    - Regex: `/\S+@\S+\.\S+/` → kiểm tra định dạng email cơ bản.
  - Hàm `handleRequest` (bước gửi yêu cầu mã):
    - Nếu `email` rỗng hoặc chỉ khoảng trắng → `setError('Email không được để trống.')`.
    - Nếu `!validateEmail(email)` → `setError('Vui lòng nhập đúng định dạng Email')`.
  - Input:
    - Email:
      - `type="email"`, `required`, `disabled` khi `step === 'done'`.
    - Mã xác minh:
      - `required={step === 'verify'}` (bắt buộc nhập ở bước xác minh, không bắt buộc ở bước request).

- **`pages/auth/InternalForgotPassword.jsx`**
  - Tương tự `CustomerForgotPassword` nhưng dùng API nội bộ:
    - `validateEmail()` với cùng regex `/\S+@\S+\.\S+/`.
    - `handleRequest`:
      - Rỗng → “Email không được để trống.”
      - Sai định dạng → “Vui lòng nhập đúng định dạng Email”.
  - Input:
    - Email nội bộ: `type="email"`, `required`, `disabled` khi `done`.
    - Mã xác minh: `required={step === 'verify'}`.

---

### 2. Nhóm `pages/customer/*`

- **`pages/customer/QuoteRequest.jsx`** (Khách tạo yêu cầu báo giá – 3 bước)
  - Dùng `isVietnamesePhoneNumber` (regex VN) cho số điện thoại.
  - **`validateStep1` – Thông tin liên hệ & địa chỉ**
    - `contactPerson`:
      - Bắt buộc, nếu không `.trim()` → `newErrors.contactPerson = 'Họ và tên là bắt buộc.'`.
    - `contactPhone`:
      - Bắt buộc → “Số điện thoại là bắt buộc.”.
      - Nếu `!isVietnamesePhoneNumber` → “Số điện thoại không hợp lệ.”.
    - `contactEmail`:
      - Bắt buộc → “Email là bắt buộc.”.
      - Regex `/\S+@\S+\.\S+/` → “Email không hợp lệ.”.
    - Địa chỉ nhận hàng (tổng hợp 3 trường):
      - Nếu thiếu **bất kỳ**: `selectedProvince`, `selectedCommune`, `detailedAddress.trim()` → lỗi chung `errors.address = 'Vui lòng điền đầy đủ địa chỉ nhận hàng.'`.
  - **`validateStep2` – Danh sách sản phẩm & ngày giao**
    - Mỗi phần tử `quoteItems[index]`:
      - `productId`:
        - Bắt buộc: nếu không chọn → `itemErrors.product = 'Vui lòng chọn sản phẩm.'`.
      - `quantity`:
        - Dùng `parseInt(item.quantity, 10)`.
        - Nếu `< 100` → `itemErrors.quantity = 'Số lượng tối thiểu là 100.'`.
        - Hiển thị lỗi bằng `isInvalid={!!errors.items?.[index]?.quantity}` + `Form.Control.Feedback`.
    - `expectedDeliveryDate`:
      - Bắt buộc → `newErrors.expectedDeliveryDate = 'Ngày giao hàng mong muốn là bắt buộc.'`.
  - **Luồng bước & submit**
    - `handleNext`:
      - Bước 1 → chỉ chuyển nếu `validateStep1()` true.
      - Bước 2 → chỉ chuyển nếu `validateStep2()` true.
    - `handleSubmit`:
      - Nếu **bất kỳ** `validateStep1()` hoặc `validateStep2()` false → toast `'Vui lòng kiểm tra lại các thông tin bắt buộc ở các bước trước.'` và không gọi API.
  - HTML:
    - Select sản phẩm: `required`.
    - Ô số lượng: `type="number"`, `min="100"`, `required`.

Các page customer khác sẽ được liệt kê rõ ở mục 6 bên dưới.

---

### 3. Nhóm `pages/sales/*`

- **`pages/sales/CreateRfqPage.jsx`** (Tạo RFQ hộ khách hàng)
  - Dùng `isVietnamesePhoneNumber` và chia thành 2 bước validate.
  - **`validateStep1` – Thông tin khách hàng**
    - `contactPerson`:
      - Bắt buộc → “Họ và tên là bắt buộc.”.
    - `contactPhone`:
      - Bắt buộc → “Số điện thoại là bắt buộc.”.
      - Nếu `!isVietnamesePhoneNumber` → “Số điện thoại không hợp lệ.”.
    - `contactEmail`:
      - Bắt buộc → “Email là bắt buộc.”.
      - Regex `/\S+@\S+\.\S+/` → “Email không hợp lệ.”.
    - Địa chỉ:
      - Bắt buộc: `selectedProvince`, `selectedCommune`, `detailedAddress` → “Vui lòng điền đầy đủ địa chỉ nhận hàng.”.
  - **`validateStep2` – Sản phẩm & ngày giao**
    - Mảng `quoteItems`:
      - `productId`: bắt buộc, nếu không → lỗi `product: 'Vui lòng chọn sản phẩm.'`.
      - `quantity`:
        - Bắt buộc; nếu rỗng hoặc `parseInt(quantity, 10) < 100` → “Số lượng tối thiểu là 100.”.
        - Lỗi hiển thị qua `errors.items[index]?.quantity` + `isInvalid`.
    - `expectedDeliveryDate`:
      - Bắt buộc → “Ngày giao hàng mong muốn là bắt buộc.”.
      - Phải >= hôm nay + 30 ngày (`getMinExpectedDeliveryDate`) → “Ngày giao hàng phải ít nhất 30 ngày kể từ hôm nay.”.
  - Submit:
    - Nếu `!validateStep1()` hoặc `!validateStep2()` → toast `'Vui lòng kiểm tra lại các thông tin bắt buộc ở các bước trước.'`.

`pages/sales/MyRfqs.jsx` sẽ được liệt kê rõ ở mục 6 bên dưới.

---

### 4. Nhóm modal User/Customer/Profile/Mật khẩu

- **`components/modals/CreateUserModal.jsx`**
  - Hàm `validateEmail(email)` với regex `/\S+@\S+\.\S+/`.
  - Hàm `validateName(name)`:
    - Nếu rỗng → false.
    - Nếu chứa ký tự đặc biệt (`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`) → false.
  - Hàm `validate()`:
    - `email`:
      - Bắt buộc → “Email là bắt buộc”.
      - Sai regex → “Email không hợp lệ.”.
    - `password`:
      - Khi **tạo user mới**: bắt buộc → “Mật khẩu là bắt buộc”.
      - Khi sửa user: optional, nhưng nếu nhập thì phải `length >= 8` → “Mật khẩu phải có ít nhất 8 ký tự.”.
    - `name`:
      - Bắt buộc → “Họ và tên là bắt buộc”.
      - Nếu `validateName` fail → “Tên người liên hệ không hợp lệ.”.
    - `phoneNumber`:
      - Bắt buộc → “Số điện thoại là bắt buộc”.
      - Nếu `!isVietnamesePhoneNumber` → “Số điện thoại không hợp lệ.”.
    - `roleId`:
      - Bắt buộc → “Vai trò là bắt buộc”.
  - Khi submit thất bại do backend:
    - Nếu message chứa “email đã được sử dụng” → set lỗi cụ thể cho `email`: “Email này đã được sử dụng.”.
    - Nếu message chứa “số điện thoại đã được sử dụng” → lỗi cho `phoneNumber`: “Số điện thoại đã tồn tại trong hệ thống.”.

- **`components/modals/CreateCustomerModal.jsx`**
  - Hàm `validateEmail`, `validateTaxCode`, `validateContactPerson`:
    - `validateTaxCode`: nếu có giá trị thì phải khớp `/^[0-9]{10,13}$/`.
    - `validateContactPerson`: không được rỗng, không chứa ký tự đặc biệt (pattern giống `CreateUserModal`).
  - Hàm `validate()`:
    - `companyName`: bắt buộc → “Tên công ty là bắt buộc”.
    - `contactPerson`:
      - Bắt buộc → “Người liên hệ là bắt buộc”.
      - Nếu fail `validateContactPerson` → “Tên người liên hệ không hợp lệ.”.
    - `email`:
      - Bắt buộc → “Email là bắt buộc”.
      - Regex `/\S+@\S+\.\S+/` → “Email không hợp lệ.”.
    - `phoneNumber`:
      - Bắt buộc → “Số điện thoại là bắt buộc”.
      - Nếu `!isVietnamesePhoneNumber` → “Số điện thoại không hợp lệ.”.
    - `taxCode`:
      - Nếu có và `!validateTaxCode` → “Mã số thuế không hợp lệ.”.
  - Khi submit lỗi backend:
    - Nếu message liên quan đến email đã dùng → `errors.email = 'Email này đã được sử dụng.'`.
    - Nếu liên quan đến số điện thoại đã dùng → `errors.phoneNumber = 'Số điện thoại đã tồn tại trong hệ thống.'`.

- **`components/modals/ProfileModal.jsx`**
  - Hàm `validate()` phân biệt Customer vs Internal user:
    - Nếu là **Customer**:
      - `companyName`: bắt buộc → “Tên công ty là bắt buộc”.
      - `contactPerson`: bắt buộc → “Người liên hệ là bắt buộc”.
    - Nếu là **user nội bộ**:
      - `name`: bắt buộc → “Họ và tên là bắt buộc”.
    - Chung:
      - `email`:
        - Bắt buộc → “Email là bắt buộc”.
        - Regex `/\S+@\S+\.\S+/` → “Email không hợp lệ”.
      - `phoneNumber`:
        - Bắt buộc → “Số điện thoại là bắt buộc”.
        - `!isVietnamesePhoneNumber` → “Số điện thoại không hợp lệ.”.
  - Khi cập nhật lỗi backend:
    - Nếu message chứa “Email đã được sử dụng” → `errors.email = 'Email đã được sử dụng bởi khách hàng khác'`.
    - Nếu message chứa “Số điện thoại đã được sử dụng” → `errors.phoneNumber = 'Số điện thoại đã được sử dụng bởi khách hàng khác'`.

- **`components/modals/ChangePasswordModal.jsx`**
  - Hàm `validate()`:
    - `currentPassword`:
      - Bắt buộc → “Mật khẩu hiện tại không được để trống.”.
    - `newPassword`:
      - Bắt buộc → “Mật khẩu mới không được để trống.”.
      - Nếu `length < 8` → “Mật khẩu mới phải có ít nhất 8 ký tự.”.
      - Nếu có khoảng trắng → “Mật khẩu không được chứa khoảng trắng”.
      - Nếu **không** chứa ít nhất một chữ hoa và một chữ số (`/[A-Z]/` và `/\d/`) → “Mật khẩu phải chứa ít nhất 1 chữ số và 1 chữ in hoa”.
      - Nếu trùng `currentPassword` → “Mật khẩu mới không được trùng với mật khẩu hiện tại.”.
    - `confirmPassword`:
      - Bắt buộc → “Vui lòng nhập lại mật khẩu mới.”.
      - Nếu khác `newPassword` → “Mật khẩu xác nhận không khớp.”.
  - Khi backend báo mật khẩu hiện tại sai (các từ khóa `mật khẩu hiện tại`, `current password`, `sai`, `incorrect`, `wrong`) → set lỗi cụ thể cho `currentPassword` là “Mật khẩu hiện tại không chính xác.”.

- **`components/modals/ConfirmOrderProfileModal.jsx`**
  - Hàm `validate()`:
    - `companyName`: bắt buộc → “Tên công ty là bắt buộc”.
    - `contactPerson`: bắt buộc → “Người liên hệ là bắt buộc”.
    - `address`: bắt buộc → “Địa chỉ là bắt buộc”.
    - `taxCode`: bắt buộc → “Mã số thuế là bắt buộc”.
    - `email`:
      - Bắt buộc → “Email là bắt buộc”.
      - Regex `/\S+@\S+\.\S+/` → “Email không hợp lệ”.
    - `phoneNumber`:
      - Bắt buộc → “Số điện thoại là bắt buộc”.
      - `!isVietnamesePhoneNumber` → “Số điện thoại không hợp lệ.”.
  - Nếu validate fail khi bấm xác nhận → toast `'Vui lòng điền đầy đủ các trường bắt buộc.'`.

---

### 5. Nhóm modal vật tư, máy móc, RFQ chi tiết

- **`components/modals/MaterialStockModal.jsx`**
  - Hàm `validate()`:
    - `materialId`:
      - Bắt buộc chọn → “Vui lòng chọn nguyên liệu”.
    - `quantity`:
      - Bắt buộc, `parseFloat(quantity) <= 0` → “Vui lòng nhập số lượng hợp lệ”.
    - `unitPrice`:
      - Bắt buộc, `parseFloat(unitPrice) <= 0` → “Vui lòng nhập đơn giá hợp lệ”.
    - `receivedDate`:
      - Bắt buộc → “Vui lòng chọn ngày nhập hàng”.
  - Các field khác (`location`, `batchNumber`, `expiryDate`) là optional, không có rule validate riêng.

- **`components/modals/CreateMachineModal.jsx`**
  - Hàm `validateCode(code)`:
    - Bắt buộc, format: chỉ chữ/số/gạch ngang/gạch dưới (`/^[A-Z0-9_-]+$/i`) → ví dụ: `WEAV-001`.
  - Hàm `validatePower(power)`:
    - Bắt buộc, format như `5kW`, `3kW`, `10kW`… → regex `/^\d+(\.\d+)?\s*(kw|w|kW|W)?$/i`.
  - Hàm `validateYear(year)`:
    - Bắt buộc, 4 chữ số (`/^\d{4}$/`), trong khoảng `1900` → `năm hiện tại + 1`.
  - Hàm `validate()`:
    - `code`: bắt buộc + `validateCode` → lỗi “Mã máy là bắt buộc” / “Mã máy không hợp lệ. VD: WEAV-001”.
    - `name`:
      - Bắt buộc → “Tên máy là bắt buộc”.
      - Độ dài từ 2–100 ký tự.
    - `location`:
      - Bắt buộc → “Vị trí là bắt buộc”.
      - Độ dài từ 2–50 ký tự.
    - `maintenanceIntervalDays`:
      - Bắt buộc, `> 0` và `<= 3650` (10 năm) → nếu không, lỗi tương ứng.
    - `brand`:
      - Bắt buộc, độ dài 2–50 ký tự.
    - `power`: bắt buộc + `validatePower`.
    - `modelYear`: bắt buộc + `validateYear`.
    - Công suất theo loại máy:
      - Nếu `type` là `WEAVING`/`WARPING`:
        - `capacityPerDay` bắt buộc, > 0, <= 1,000,000.
      - Nếu `type` là `SEWING`/`CUTTING`:
        - `capacityPerHour.bathTowels`, `faceTowels`, `sportsTowels` đều bắt buộc, > 0, <= 10,000, mỗi field có thông báo lỗi riêng (“Công suất khăn tắm/giờ…”, “khăn mặt/giờ…”, “khăn thể thao/giờ…”).

- **`components/modals/RFQDetailModal.jsx`**
  - Khi **Sales chỉnh sửa** RFQ (trong `handleSave`):
    - Validate từng dòng sản phẩm trong `editedRfq.rfqDetails`:
      - `productId`:
        - `parseInt(productId)` phải là số > 0, nếu không → throw `Error('ProductId không hợp lệ: ...')`.
      - `quantity`:
        - `parseFloat(quantity)` phải >= 100, nếu không → `Error('Số lượng phải từ 100 trở lên. Giá trị hiện tại: ...')`.
      - `unit`:
        - Không được rỗng (fallback `'cái'` nếu trống).
      - Vòng for cuối cùng:
        - Nếu `!detail.productId` / `quantity < 100` / `unit` trống → throw lỗi mô tả “Sản phẩm thứ X: …”.
    - Validate email liên hệ nếu có:
      - Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` → nếu fail → throw `Error('Email không hợp lệ. Vui lòng nhập đúng định dạng email.')`.
    - Validate số điện thoại nếu có:
      - Nếu `!isVietnamesePhoneNumber(editedRfq.contactPhone)` → throw `Error('Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.')`.
    - Nếu không có **bất kỳ** detail nào (`details.length === 0`) → throw `Error('RFQ phải có ít nhất một sản phẩm.')`.

---

### 6. Các `pages/*` khác không có validate custom

- **`pages/admin/AdminCustomerManagement.jsx`**: Không có hàm validate riêng; chỉ hiển thị danh sách khách hàng, mở `CreateCustomerModal` để thêm/sửa (validate nằm trong modal).
- **`pages/admin/AdminUserManagement.jsx`**: Không validate riêng; hiển thị danh sách user, mở `CreateUserModal` để thêm/sửa.

- **`pages/customer/CustomerOrders.jsx`**: Không validate input; chỉ hiển thị danh sách đơn hàng khách, filter/sort và điều hướng sang chi tiết.
- **`pages/customer/CustomerOrderDetail.jsx`**: Không validate; chỉ hiển thị chi tiết đơn hàng.
- **`pages/customer/CustomerRfqs.jsx`**: Không validate; hiển thị danh sách RFQ của khách, mở chi tiết/navigate.
- **`pages/customer/CustomerRfqDetail.jsx`**: Không validate; hiển thị chi tiết RFQ.
- **`pages/customer/CustomerQuotations.jsx`**: Không validate; hiển thị danh sách báo giá.
- **`pages/customer/CustomerQuotationDetail.jsx`**: Không validate; hiển thị chi tiết báo giá.
- **`pages/customer/Dashboard.jsx`**: Không validate; trang tổng quan, chỉ hiển thị số liệu/thống kê.
- **`pages/customer/OrderTracking.jsx`**: Không có hàm validate JS riêng; nếu có input tracking thì chỉ dùng validate HTML cơ bản, backend kiểm tra chính.
- **`pages/customer/WishlistPage.jsx`**: Không validate; hiển thị danh sách sản phẩm yêu thích, thao tác thêm/xóa.

- **`pages/director/DirectorRfqList.jsx`**: Không validate; hiển thị danh sách RFQ cho giám đốc, filter/navigate.
- **`pages/director/DirectorOrderList.jsx`**: Không validate; hiển thị danh sách đơn hàng, điều hướng sang chi tiết/kế hoạch.
- **`pages/director/ContractApproval.jsx`**: Không validate dữ liệu nhập; chỉ hiển thị danh sách hợp đồng chờ duyệt và nút phê duyệt/từ chối.
- **`pages/director/ProductionPlanApprovals.jsx`**: Không validate input; hiển thị kế hoạch sản xuất chờ duyệt, thao tác phê duyệt.

- **`pages/internal/Dashboard.jsx`**: Không validate; dashboard nội bộ, chỉ hiển thị số liệu.
- **`pages/internal/OrderList.jsx`**: Không validate input; hiển thị danh sách đơn hàng nội bộ.
- **`pages/internal/OrderDetail.jsx`**: Không validate; hiển thị chi tiết đơn hàng.
- **`pages/internal/QuoteRequests.jsx`**: Không validate; danh sách yêu cầu báo giá nội bộ, chỉ filter/navigate.
- **`pages/internal/QuotesList.jsx`**: Không validate; hiển thị danh sách báo giá.
- **`pages/internal/QuoteDetail.jsx`**: Không validate; hiển thị chi tiết báo giá.
- **`pages/internal/QuoteManagement.jsx`**: Không validate form riêng; trang quản lý báo giá, các thao tác chỉnh sửa/phê duyệt dùng modal hoặc gọi API.
- **`pages/internal/ContractUpload.jsx`**: Nếu có form upload, chỉ dùng validate HTML cơ bản (file required); không có hàm validate JS chi tiết.
- **`pages/internal/ContractApproval.jsx`**: Không validate; hiển thị danh sách hợp đồng, nút duyệt/từ chối.

- **`pages/planning/PlanningRfqs.jsx`**: Không validate; hiển thị danh sách RFQ cho kế hoạch, filter/navigate.
- **`pages/planning/PlanningRFQDetail.jsx`**: Không validate dữ liệu nhập; chủ yếu hiển thị chi tiết RFQ và báo cáo năng lực, gọi API tính toán.
- **`pages/planning/ConsolidatedOrders.jsx`**: Không validate; trang tổng hợp đơn hàng.
- **`pages/planning/ProductionPlans.jsx`**: Không validate form riêng; hiển thị danh sách kế hoạch.
- **`pages/planning/ProductionPlanDetail.jsx`**: Không validate; hiển thị chi tiết kế hoạch.
- **`pages/planning/ProductionLots.jsx`**: Không validate; hiển thị danh sách lô sản xuất.

- **`pages/productionLeader/LeaderOrderList.jsx`**: Không validate form nhập (chỉ có ô tìm kiếm text đơn giản, không validate logic); các nút Bắt đầu/Cập nhật chỉ dựa trên trạng thái stage.
- **`pages/productionLeader/LeaderOrderDetail.jsx`**: Không validate; hiển thị chi tiết đơn hàng cho Leader.
- **`pages/productionLeader/LeaderStageProgress.jsx`**: Không có validate JS chi tiết cho tiến độ; backend kiểm tra phần trăm hợp lệ.
- **`pages/productionLeader/LeaderDefectList.jsx`**: Không validate; hiển thị danh sách lỗi cho Leader.
- **`pages/productionLeader/LeaderDefectDetail.jsx`**: Không validate dữ liệu text; chỉ hiển thị chi tiết lỗi và nút thao tác.

- **`pages/productionManager/ProductionOrderList.jsx`**: Không validate form nhập; chỉ có filter/search text cơ bản.
- **`pages/productionManager/ProductionOrderDetail.jsx`**: Không validate; hiển thị chi tiết và kế hoạch đơn hàng.
- **`pages/productionManager/StageProgressDetail.jsx`**: Không validate JS chi tiết; gửi tiến độ cho backend kiểm tra.
- **`pages/productionManager/ProductionReworkOrders.jsx`**: Không validate; danh sách đơn sửa lỗi.
- **`pages/productionManager/ProductionReworkOrderDetail.jsx`**: Không validate; chi tiết đơn sửa lỗi.
- **`pages/productionManager/ProductionReworkStageDetail.jsx`**: Không validate riêng; thao tác cập nhật tiến độ rework do backend kiểm soát.
- **`pages/productionManager/ProductionFiberRequests.jsx`**: Không validate; danh sách yêu cầu cấp sợi.
- **`pages/productionManager/ProductionFiberRequestDetail.jsx`**: Không validate; chi tiết yêu cầu cấp sợi, nút phê duyệt.
- **`pages/productionManager/MaterialStockManagement.jsx`**: Không validate trực tiếp; mở `MaterialStockModal` (validate trong modal) để nhập kho.

- **`pages/public/HomePage.jsx`**: Không validate; trang public/marketing, chỉ hiển thị nội dung.
- **`pages/public/UnauthorizedPage.jsx`**: Không validate; chỉ hiển thị thông báo không có quyền.

- **`pages/qa/QaOrderList.jsx`**: Không validate; hiển thị danh sách đơn cần kiểm tra, filter/navigate.
- **`pages/qa/QaOrderDetail.jsx`**: Không validate dữ liệu text; hiển thị chi tiết đơn hàng và công đoạn.
- **`pages/qa/QaStageQualityCheck.jsx`**: Không có hàm validate form phức tạp ở frontend; các rule đánh giá chi tiết (mức độ lỗi, tiêu chí) do backend (`QcService`) xử lý.
- **`pages/qa/QaStageCheckResult.jsx`**: Không validate; hiển thị kết quả kiểm tra đã lưu.
- **`pages/qa/QaScanHandler.jsx`**: Không validate dữ liệu text; đọc mã/QR và điều hướng, lỗi định dạng do backend trả về.

- **`pages/sales/MyRfqs.jsx`**: Không có validate input; chỉ hiển thị danh sách RFQ của sale, filter/navigate.

- **`pages/technical/MachineManagement.jsx`**: Không validate trực tiếp; danh sách máy, mở `CreateMachineModal` để thêm/sửa (validate trong modal).
- **`pages/technical/MachineDetail.jsx`**: Không validate; hiển thị chi tiết máy.
- **`pages/technical/TechnicalDefectList.jsx`**: Không validate; hiển thị danh sách lỗi gửi tới kỹ thuật.
- **`pages/technical/TechnicalDefectDetail.jsx`**: Không validate text; các rule với quyết định REWORK/MATERIAL_REQUEST nằm ở backend, frontend chỉ gửi dữ liệu (ghi chú, số lượng, v.v.).

---

### 7. Các `components/*` khác không có validate custom

- **`components/common/Header.jsx`**: Không validate; chỉ điều hướng, hiển thị thông tin user và dropdown thông báo.
- **`components/common/Footer.jsx`**: Không validate; hiển thị footer tĩnh.
- **`components/common/Sidebar.jsx`**, **`InternalSidebar.jsx`**, **`CustomerSidebar.jsx`**: Không validate dữ liệu; chỉ render menu điều hướng.
- **`components/common/InternalLayout.jsx`**: Không validate; layout khung nội bộ.
- **`components/common/LoadingSpinner.jsx`**: Không validate; chỉ hiển thị spinner.
- **`components/common/NotificationDropdown.jsx`**: Không validate input; hiển thị danh sách thông báo từ API.
- **`components/common/ProtectedRoute.jsx`**: Không validate form; chỉ kiểm tra token/role để cho/không cho truy cập route.
- **`components/common/CameraCapture.jsx`**: Không validate text; xử lý camera/ảnh để gửi lên backend.
- **`components/common/ErrorMessage.jsx`**: Không validate; component hiển thị lỗi.

- **`components/customer/CartItemRow.jsx`**: Không validate logic riêng; nhận props (số lượng, tên sản phẩm) đã được kiểm tra trước đó, hiển thị và gọi callback tăng/giảm.
- **`components/customer/RfqDetailView.jsx`**: Không validate; hiển thị chi tiết RFQ cho khách.

- **`components/forms/FileUpload.jsx`**: Không có hàm validate JS chi tiết; chỉ rely vào thuộc tính HTML (loại file) và validate backend.
- **`components/forms/QuoteRequestForm.jsx`**: Phần lớn validate chính đã chuyển vào `pages/customer/QuoteRequest.jsx`; component này không bổ sung validate mới ngoài việc nhận props và render field.

- **`components/modals/AddProductToRfqModal.jsx`**: Không có validate custom; chỉ chọn sản phẩm và số lượng cơ bản, backend kiểm tra chi tiết hơn.
- **`components/modals/AssignRfqModal.jsx`**: Không validate text; chỉ chọn user/role để gán RFQ, backend kiểm soát hợp lệ.
- **`components/modals/CustomerRfqDetailModal.jsx`**: Không validate; hiển thị chi tiết RFQ.
- **`components/modals/EditProductionStageModal.jsx`**: Không validate nội dung text sâu; chủ yếu gửi dữ liệu chỉnh sửa công đoạn cho backend kiểm tra.
- **`components/modals/InsufficientCapacityModal.jsx`**: Không validate; chỉ hiển thị thông tin thiếu năng lực.
- **`components/modals/QuotationViewModal.jsx`**: Không validate; hiển thị chi tiết báo giá.
- **`components/production/MaterialRequestApprovalModal.jsx`**: Không validate dữ liệu text; chỉ xác nhận/phê duyệt yêu cầu cấp vật tư, logic chính ở backend.

- **`components/Pagination.jsx`**: Không validate business; chỉ xử lý số trang/giới hạn hiển thị.
- **`components/ProductCard.jsx`**: Không validate; hiển thị thông tin sản phẩm, xử lý click thêm giỏ.

---

### 8. Tổng kết

- Mỗi file `pages/*` và `components/*` hiện đều đã được liệt kê **cụ thể**: hoặc mô tả chi tiết rule validate, hoặc ghi rõ “không có validate custom, chỉ hiển thị dữ liệu / điều hướng / thao tác nút”. 
