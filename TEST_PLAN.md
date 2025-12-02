# Kế Hoạch Test Toàn Diện Hệ Thống TMMSystem (Code-Verified)

> [!IMPORTANT]
> Tài liệu này được xây dựng dựa trên sự đối chiếu chặt chẽ giữa:
> 1.  **Nghiệp vụ**: `LUONG_DAT_HANG.md`, `LUONG_SAN_XUAT.txt`, `LUONG_LOI.pdf`
> 2.  **Frontend Code**: `src/pages/**`, `src/utils/statusMapper.js`
> 3.  **Backend Entities**: `ProductionOrder.java`, `ProductionStage.java`, `Rfq.java`, `Quotation.java`
> 4.  **API Specs**: `api docs.json`

## I. Luồng Đặt Hàng (Order Flow)

### 1. Tổng quan Trạng thái (State Machine)

| Entity | Status Code (Backend) | UI Label (Frontend) | Trigger Action |
| :--- | :--- | :--- | :--- |
| **RFQ** | `DRAFT` | Chờ xác nhận | KH tạo mới |
| | `SENT` | Chờ xác nhận | KH gửi đi |
| | `PRELIMINARY_CHECKED` | Đã xác nhận | Sales "Xác nhận" |
| | `FORWARDED_TO_PLANNING` | Đã xác nhận | Hệ thống auto-forward |
| | `QUOTED` | Đã báo giá | Planning "Gửi báo giá" |
| | `ACCEPTED` | Đã xác nhận | KH "Chấp nhận" báo giá |
| **Quotation** | `DRAFT` | Chờ báo giá | Planning tạo nháp |
| | `SENT` | Chờ phê duyệt | Planning "Gửi báo giá" |
| | `ACCEPTED` | Đã duyệt | KH "Chấp nhận" |
| | `REJECTED` | Từ chối | KH "Từ chối" |
| **Order** | `PENDING_APPROVAL` | Chờ phê duyệt HĐ | Sau khi Sales upload HĐ |
| | `APPROVED` | Hợp đồng đã ký được phê duyệt | Director "Phê duyệt" |

### 2. Kịch bản Test Chi Tiết

#### Scenario 1: Quy trình Đặt hàng Chuẩn (Happy Path)

**Bước 1: Khách hàng tạo RFQ**
*   **Role**: Customer (Mới hoặc Cũ)
*   **Page**: `/customer/quote-request`
*   **Action**: Điền form và Submit.
*   **Code Check**: API `POST /v1/rfqs` -> Backend tạo RFQ với status `SENT` (hoặc `DRAFT` nếu lưu nháp).
*   **Expected**: Hiển thị thông báo thành công, mã RFQ.

**Bước 2: Sales xác nhận RFQ**
*   **Role**: Sales
*   **Page**: `/sales/rfqs`
*   **Action**: Chọn RFQ (Status: "Chờ xác nhận") -> Xem chi tiết -> Bấm **"Xác nhận"**.
*   **Code Check**: API `PUT /v1/rfqs/{id}` (hoặc endpoint riêng) -> Backend update status `PRELIMINARY_CHECKED` -> Auto transition to `FORWARDED_TO_PLANNING`.
*   **Expected**: Trạng thái RFQ đổi thành **"Đã xác nhận"**. Planning nhận được RFQ.

**Bước 3: Planning kiểm tra năng lực & Tạo báo giá**
*   **Role**: Planning
*   **Page**: `/planning/rfqs/:id`
*   **Action**:
    1.  Kiểm tra năng lực -> Bấm **"Đủ năng lực"** (Capacity: SUFFICIENT).
    2.  Bấm **"Tạo báo giá"** -> Điền giá -> Bấm **"Gửi báo giá"**.
*   **Code Check**:
    *   API `POST /v1/rfqs/{id}/check-capacity` -> `capacityStatus: 'SUFFICIENT'`.
    *   API `POST /v1/quotations` -> Backend tạo Quotation với status `SENT`. RFQ status update to `QUOTED`.
*   **Expected**: Trạng thái RFQ: **"Đã báo giá"**. Khách hàng nhận được thông báo.

**Bước 4: Khách hàng phê duyệt Báo giá**
*   **Role**: Customer
*   **Page**: `/customer/quotations`
*   **Action**: Xem chi tiết báo giá -> Bấm **"Chấp nhận"**.
*   **Code Check**: API `PUT /v1/quotations/{id}/accept` -> Backend update Quotation status `ACCEPTED`.
*   **Expected**: Hệ thống yêu cầu điền thông tin Hợp đồng (nếu thiếu). Đơn hàng (Order) được tạo ngầm định hoặc chuyển sang bước làm Hợp đồng.

**Bước 5: Sales upload Hợp đồng**
*   **Role**: Sales
*   **Page**: `/sales/orders` (hoặc Contracts)
*   **Action**: Upload PDF hợp đồng đã ký.
*   **Code Check**: API Upload -> Order status `PENDING_APPROVAL`.
*   **Expected**: Trạng thái đơn hàng: **"Chờ phê duyệt hợp đồng đã ký"**.

**Bước 6: Director phê duyệt Hợp đồng**
*   **Role**: Director
*   **Page**: `/director/contracts`
*   **Action**: Xem PDF -> Bấm **"Phê duyệt"**.
*   **Code Check**: API Approve -> Order status `APPROVED`.
*   **Expected**: Trạng thái đơn hàng: **"Hợp đồng đã ký được phê duyệt"**.

---

## II. Luồng Sản Xuất (Production Flow)

### 1. Tổng quan Trạng thái (State Machine)

| Entity | Status Code (Backend) | UI Label (Frontend) | Trigger Action |
| :--- | :--- | :--- | :--- |
| **ProductionOrder** | `WAITING_PRODUCTION` | Chờ sản xuất | Director duyệt kế hoạch |
| | `IN_PROGRESS` | Đang sản xuất | PM "Bắt đầu lệnh làm việc" |
| **Stage** | `PENDING` | Đợi | Mặc định ban đầu |
| | `WAITING` | Chờ làm | Đủ điều kiện bắt đầu (Stage trước xong) |
| | `READY` | Sẵn sàng sản xuất | (Tương tự WAITING, tùy logic backend) |
| | `IN_PROGRESS` | Đang làm | Leader "Bắt đầu" |
| | `WAITING_QC` | Chờ kiểm tra | Leader cập nhật 100% |
| | `QC_PASSED` | Đạt | KCS "Gửi kết quả" (Pass) |
| | `QC_FAILED` | Không đạt | KCS "Gửi kết quả" (Fail) |

### 2. Kịch bản Test Chi Tiết

#### Scenario 2: Quy trình Sản xuất (Happy Path)

**Bước 1: PM Bắt đầu lệnh làm việc**
*   **Role**: Production Manager (PM)
*   **Page**: `/production/orders` -> Chi tiết đơn hàng.
*   **Condition**: Order status là `WAITING_PRODUCTION` ("Chờ sản xuất").
*   **Action**: Bấm nút **"Bắt đầu lệnh làm việc"**.
*   **Code Check**: API `POST /v1/production/orders/{id}/start`.
*   **Backend Logic**:
    *   Order status -> `IN_PROGRESS`.
    *   Stage 1 (Cuồng mắc) status -> `WAITING` (hoặc `READY`).
    *   Stage 2-6 status -> `PENDING` ("Đợi").
*   **Expected**: Toast success. Leader Cuồng mắc thấy đơn hàng "Sẵn sàng".

**Bước 2: Leader sản xuất (Cuồng mắc)**
*   **Role**: Leader Cuồng mắc
*   **Page**: `/leader/orders`
*   **Action**:
    1.  Thấy đơn hàng có Badge màu xanh **"Sẵn sàng"** (hoặc "Chờ làm").
    2.  Bấm **"Bắt đầu"** -> API `POST /v1/execution/stages/{id}/start`.
    3.  Trạng thái chuyển **"Đang làm"** (`IN_PROGRESS`).
    4.  Nhập tiến độ 100% -> Bấm **"Cập nhật"** -> API `POST /v1/execution/stages/{id}/progress`.
*   **Expected**: Trạng thái chuyển **"Chờ kiểm tra"** (`WAITING_QC`).

**Bước 3: KCS kiểm tra (Cuồng mắc)**
*   **Role**: KCS (QA)
*   **Page**: `/qa/orders` -> Chi tiết.
*   **Action**:
    1.  Thấy công đoạn "Cuồng mắc" màu vàng **"Chờ kiểm tra"**.
    2.  Bấm **"Kiểm tra"**.
    3.  Check tất cả tiêu chí -> **Đạt**.
    4.  Bấm **"Gửi kết quả"**.
*   **Code Check**: API `POST /v1/qc/inspections` với `result: 'PASS'`.
*   **Backend Logic**:
    *   Stage 1 status -> `QC_PASSED` ("Đạt").
    *   Stage 2 (Dệt) status -> `WAITING` ("Sẵn sàng").
*   **Expected**: Leader Dệt nhận được thông báo.

**Bước 4: Các công đoạn tiếp theo**
*   Lặp lại quy trình cho: **Dệt -> Nhuộm (PM làm) -> Cắt -> May -> Đóng gói**.
*   **Lưu ý**: Công đoạn Nhuộm do PM thực hiện trên giao diện `/production/orders`.

#### Scenario 3: Rolling Production (Gối đầu)

*   **Logic**: Hệ thống cho phép Leader xử lý đơn hàng theo hàng đợi (Queue).
*   **Test**:
    1.  PM start Order A -> Leader 1 thấy Order A "Sẵn sàng".
    2.  PM start Order B -> Leader 1 thấy Order B "Đợi" (hoặc "Sẵn sàng" nếu không bị block, tùy logic `ProductionStage.java` index).
    3.  *Theo mô tả*: "Các tổ trưởng... sẽ làm theo thứ tự đơn hàng mà quản lý sản xuất đó bấm".
    4.  **Verify**: Leader 1 xong Order A -> Order A sang Leader 2. Leader 1 bắt đầu làm Order B.

---

## III. Luồng Xử Lý Lỗi (Defect Flow)

### 1. Tổng quan Trạng thái

| Entity | Status Code | UI Label | Trigger Action |
| :--- | :--- | :--- | :--- |
| **Stage** | `QC_FAILED` | Không đạt | KCS đánh giá Fail |
| | `WAITING_REWORK` | Chờ sửa | Technical chọn "Rework" |
| | `REWORK_IN_PROGRESS` | Đang sửa | Leader bấm "Bắt đầu sửa" |
| | `WAITING_MATERIAL` | Chờ cấp sợi | Technical chọn "Material Request" |

### 2. Kịch bản Test Chi Tiết

#### Scenario 4: Lỗi Nhẹ (Minor) - Rework

**Bước 1: KCS báo lỗi**
*   **Role**: KCS
*   **Action**: Kiểm tra công đoạn -> Đánh dấu 1 tiêu chí Fail -> Chọn mức độ **"Lỗi nhẹ"** (Minor) -> Gửi.
*   **Code Check**: API `POST /v1/qc/inspections` -> `result: 'FAIL'`, `severity: 'MINOR'`.
*   **Expected**: Stage status -> `QC_FAILED`. Technical nhận thông báo.

**Bước 2: Technical xử lý (Rework)**
*   **Role**: Technical
*   **Page**: `/technical/defects/:id`
*   **Action**:
    1.  Xem chi tiết lỗi.
    2.  Nhập hướng dẫn sửa.
    3.  Bấm **"Yêu cầu làm lại"**.
*   **Code Check**: API `POST /v1/technical/defects/handle` -> `decision: 'REWORK'`.
*   **Backend Logic**: Stage status -> `WAITING_REWORK`.
*   **Expected**: Leader nhận thông báo "Yêu cầu sửa lỗi".

**Bước 3: Leader sửa lỗi**
*   **Role**: Leader
*   **Page**: `/leader/orders` (Tab "Đơn hàng bổ sung/Sửa lỗi" nếu có, hoặc danh sách chính).
*   **Action**:
    1.  Thấy trạng thái **"Chờ sửa"** (Màu vàng/cam).
    2.  Bấm **"Bắt đầu sửa lỗi"**.
    3.  Cập nhật tiến độ Rework 100%.
*   **Code Check**: API `POST /v1/execution/stages/{id}/start-rework`.
*   **Expected**: Trạng thái -> **"Chờ kiểm tra"**. KCS kiểm tra lại.

#### Scenario 5: Lỗi Nặng (Major) - Cấp Sợi

**Bước 1: KCS báo lỗi nặng**
*   **Role**: KCS
*   **Action**: Đánh giá Fail -> Mức độ **"Lỗi nặng"** (Major).

**Bước 2: Technical yêu cầu cấp sợi**
*   **Role**: Technical
*   **Page**: `/technical/defects/:id`
*   **Action**:
    1.  Form "Yêu cầu cấp lại sợi" hiện ra (do `severity === 'MAJOR'`).
    2.  Chọn vật tư, nhập số lượng.
    3.  Bấm **"Tạo phiếu yêu cầu cấp sợi"**.
*   **Code Check**: API `POST /v1/technical/defects/handle` -> `decision: 'MATERIAL_REQUEST'`.
*   **Expected**: Tạo `MaterialRequisition` (Status: `PENDING`). PM nhận thông báo.

**Bước 3: PM phê duyệt cấp sợi**
*   **Role**: PM
*   **Page**: `/production/fiber-requests` (hoặc tương tự).
*   **Action**: Xem yêu cầu -> Bấm **"Phê duyệt"**.
*   **Code Check**: API Approve Material Request.
*   **Expected**: Kho xuất sợi -> Leader nhận sợi -> Tiến hành sửa/làm lại.

---

## IV. Checklist Dữ Liệu Test

Để chạy được các kịch bản trên, cần chuẩn bị dữ liệu trong Database (hoặc tạo mới từ đầu):

1.  **Users**: Đủ các role (Director, Sales, Planning, PM, Leader x5, KCS, Technical).
2.  **Master Data**:
    *   `Product`: Ít nhất 1 sản phẩm.
    *   `Machine`: Gán đúng `stage_type` (WARPING, WEAVING...).
    *   `QcStandard`: Tiêu chí kiểm tra cho từng công đoạn.
3.  **Backend Config**: Đảm bảo `status` flow trong code Java không bị bypass.
