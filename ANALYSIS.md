# Phân Tích Luồng Đặt Hàng (Order Flow Analysis)

Dựa trên tài liệu `LUONG_DAT_HANG.md` và cấu trúc mã nguồn hiện tại, dưới đây là phân tích chi tiết về quy trình đặt hàng và sự tương ứng trong hệ thống.

## 1. Tổng Quan Quy Trình

Quy trình đi từ lúc khách hàng có nhu cầu (RFQ) đến khi đơn hàng được đưa vào sản xuất (Production Order).

### Các Bước Chính:
1.  **Yêu Cầu Báo Giá (RFQ)**: Khách hàng hoặc Sales tạo yêu cầu.
2.  **Kiểm Tra & Báo Giá**: Bộ phận Kế hoạch kiểm tra năng lực và tạo báo giá.
3.  **Phê Duyệt Báo Giá**: Khách hàng xem và phê duyệt báo giá.
4.  **Hợp Đồng & Đơn Hàng**: Khách hàng cung cấp thông tin hợp đồng -> Hệ thống tạo Đơn hàng -> Sales upload hợp đồng đã ký -> Giám đốc duyệt.
5.  **Kế Hoạch Sản Xuất**: Hệ thống gộp đơn -> Kế hoạch lập kế hoạch sản xuất -> Giám đốc duyệt -> Lệnh sản xuất.

## 2. Ánh Xạ Mã Nguồn (Codebase Mapping)

Hệ thống Frontend (`tmmsystem-frontend`) đã có cấu trúc thư mục tương ứng với các vai trò và quy trình này.

### A. Frontend Pages (`src/pages`)

| Bước | Vai Trò | Trang Tương Ứng | Chức Năng |
| :--- | :--- | :--- | :--- |
| **1. Tạo RFQ** | Customer / Sales | `customer/QuoteRequest.jsx` | Form tạo RFQ mới. |
| | Customer | `customer/CustomerRfqs.jsx` | Danh sách RFQ của khách hàng. |
| | Sales | `sales/SalesRfqs.jsx` (Dự đoán) | Quản lý RFQ (cần kiểm tra lại folder `sales`). |
| **2. Kiểm Tra & Báo Giá** | Planning | `planning/PlanningRfqs.jsx` | Danh sách RFQ cần xử lý. |
| | Planning | `planning/PlanningRFQDetail.jsx` | Chi tiết RFQ, kiểm tra năng lực, tạo báo giá. |
| **3. Phê Duyệt Báo Giá** | Customer | `customer/CustomerQuotations.jsx` | Danh sách báo giá nhận được. |
| | Customer | `customer/CustomerQuotationDetail.jsx` | Xem chi tiết, phê duyệt/từ chối. |
| **4. Hợp Đồng & Đơn Hàng** | Customer | `customer/CustomerQuotationDetail.jsx` | Điền thông tin hợp đồng sau khi duyệt giá. |
| | Sales | `sales/SalesContracts.jsx` (Dự đoán) | Upload hợp đồng. |
| | Director | `director/DirectorContracts.jsx` (Dự đoán) | Duyệt hợp đồng. |
| | Customer | `customer/CustomerOrders.jsx` | Xem đơn hàng đã tạo. |
| **5. Kế Hoạch Sản Xuất** | Planning | `planning/ProductionPlans.jsx` | Lập kế hoạch sản xuất. |
| | Director | `director/DirectorProductionPlans.jsx` (Dự đoán) | Duyệt kế hoạch sản xuất. |

### B. Backend Services (`src/api`)

Các service sau đây hỗ trợ các bước trên:
*   `rfqService.js`: Xử lý CRUD cho RFQ.
*   `quoteService.js` / `quotationService.js`: Xử lý Báo giá (Cần kiểm tra sự khác biệt giữa 2 file này).
*   `contractService.js`: Xử lý Hợp đồng.
*   `orderService.js`: Xử lý Đơn hàng.
*   `productionPlanService.js`: Xử lý Kế hoạch sản xuất.
*   `authService.js`, `userService.js`: Quản lý người dùng và xác thực.

## 3. Nhận Xét & Câu Hỏi

1.  **`quoteService.js` vs `quotationService.js`**: Có sự tồn tại của cả 2 file này. Cần kiểm tra xem chúng có bị trùng lặp hay phục vụ mục đích khác nhau (ví dụ: `quote` là hành động báo giá, `quotation` là đối tượng báo giá?).
2.  **Backend Code**: Hiện tại tôi chỉ thấy Frontend. Để "chạy lại luồng" và debug sâu, tôi có thể cần quyền truy cập vào Backend hoặc đảm bảo Backend đang chạy ổn định.
3.  **Dữ liệu mẫu**: Để chạy thử luồng, cần có dữ liệu mẫu cho các vai trò (Customer, Sales, Planning, Director).

## 4. Kế Hoạch Tiếp Theo

1.  Xác nhận quyền truy cập Backend (nếu cần sửa lỗi Backend).
2.  Thực hiện chạy thử luồng trên giao diện (hoặc qua API) theo kịch bản `LUONG_DAT_HANG.md`.
3.  Ghi nhận lỗi và tiến hành sửa chữa (Coding).
