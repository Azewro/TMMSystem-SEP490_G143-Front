# Mô Tả Luồng Đặt Hàng

Dựa trên tài liệu "Luồng đặt hàng.pdf", dưới đây là tóm tắt quy trình đặt hàng của hệ thống sản xuất khăn bông.

## I. Các Loại Khách Hàng

Hệ thống phân biệt 3 loại khách hàng chính khi tạo Yêu Cầu Báo Giá (RFQ):

1.  **Khách hàng không sử dụng hệ thống:**
    *   Nhân viên Sales sẽ tạo RFQ hộ.
    *   Sau khi có báo giá, hệ thống sẽ gửi link báo giá và thông tin đăng nhập (tài khoản mới) cho khách hàng qua Email/SĐT.
    *   Khách hàng phải đổi mật khẩu ở lần đăng nhập đầu tiên.

2.  **Khách hàng lần đầu sử dụng hệ thống:**
    *   Tự tạo RFQ trên trang chủ mà không cần đăng nhập.
    *   Quy trình nhận báo giá và tài khoản tương tự như khách hàng không sử dụng hệ thống.

3.  **Khách hàng đã sử dụng hệ thống:**
    *   Đăng nhập và tạo RFQ.
    *   Hệ thống sẽ tự động điền các thông tin đã có, khách hàng chỉ cần nhập thông tin mới (số lượng, ngày giao mong muốn) và có thể chỉnh sửa thông tin cũ.
    *   Sau khi có báo giá, khách hàng nhận thông báo và link để xem trực tiếp trên hệ thống.

## II. Luồng Yêu Cầu Báo Giá (RFQ)

1.  **Tạo RFQ:**
    *   Khách hàng (hoặc Sales tạo hộ) điền thông tin và sản phẩm cần báo giá.
    *   Có thể tùy chọn điền mã nhân viên Sales. Nếu không, Giám đốc sẽ chỉ định Sales sau.

2.  **Phân công & Xác nhận:**
    *   Giám đốc nhận RFQ, chỉ định nhân viên Sales (nếu cần) và bộ phận Kế hoạch chịu trách nhiệm.
    *   Sales nhận được RFQ, gọi điện xác nhận lại với khách hàng.
        *   Khách hàng có thể yêu cầu chỉnh sửa RFQ ở bước này.
        *   Sau khi Sales bấm "Xác nhận", RFQ sẽ không thể chỉnh sửa được nữa.

3.  **Kiểm Tra Năng Lực Sản Xuất:**
    *   Bộ phận Kế hoạch nhận RFQ đã được xác nhận.
    *   Kế hoạch kiểm tra năng lực sản xuất (máy móc, nguyên vật liệu) để đáp ứng ngày giao hàng mong muốn.
    *   **Nếu không đủ năng lực:**
        *   Hệ thống mở form để Kế hoạch điền lý do.
        *   Thông tin được gửi cho Sales.
        *   Sales thương lượng lại ngày giao hàng với khách hàng.
        *   Nếu khách hàng đồng ý ngày mới -> Cập nhật lại RFQ và tiếp tục quy trình.
        *   Nếu khách hàng không đồng ý -> Sales đóng RFQ.
    *   **Nếu đủ năng lực:** Kế hoạch tiến hành tạo báo giá.

## III. Luồng Báo Giá và Phê Duyệt

1.  **Tạo và Gửi Báo Giá:**
    *   Bộ phận Kế hoạch tạo báo giá và gửi đi.
    *   Hệ thống gửi thông báo/link báo giá đến cho Khách hàng và Sales.

2.  **Khách hàng Phê duyệt:**
    *   Khách hàng xem chi tiết báo giá.
    *   **Nếu từ chối:** Luồng kết thúc.
    *   **Nếu chấp nhận (phê duyệt):**
        *   Hệ thống chuyển khách hàng đến trang điền các thông tin còn thiếu để làm hợp đồng (Tên doanh nghiệp, người đại diện, mã số thuế, STK ngân hàng...).

## IV. Luồng Hợp Đồng và Đơn Hàng

1.  **Tạo Đơn Hàng & Hợp Đồng:**
    *   Sau khi khách hàng điền đủ thông tin, hệ thống tự động tạo một **Đơn hàng (Order)** với trạng thái "Pending".
    *   Sales tải bản hợp đồng và báo giá nguyên mẫu, điền thông tin, sau đó ký kết và đóng dấu với khách hàng ở ngoài.
    *   Sales upload file **PDF hợp đồng đã ký** lên hệ thống.

2.  **Giám đốc Phê duyệt Hợp đồng:**
    *   Giám đốc nhận thông báo và vào phê duyệt hợp đồng đã được upload.
    *   **Nếu từ chối:** Gửi lại cho Sales để upload lại file khác.
    *   **Nếu phê duyệt:** Gửi thông báo đến bộ phận Kế hoạch.

## V. Luồng Kế Hoạch Sản Xuất

1.  **Gộp Đơn Hàng:**
    *   Sau khi hợp đồng được phê duyệt, hệ thống sẽ tự động quét và gộp các đơn hàng có cùng tiêu chí (cùng tên sản phẩm, ngày giao/ký kết xấp xỉ) lại thành một **Lô sản xuất**.

2.  **Lập Kế Hoạch Sản Xuất:**
    *   Bộ phận Kế hoạch nhận các lô đã gộp và tiến hành lập **Kế hoạch sản xuất** chi tiết.
    *   Kế hoạch sản xuất được gửi cho Giám đốc phê duyệt.

3.  **Giám đốc Phê duyệt Kế hoạch sản xuất:**
    *   **Nếu từ chối:** Gửi lại cho Kế hoạch để sửa đổi.
    *   **Nếu phê duyệt:**
        *   Đơn hàng chuyển trạng thái sang "Approve".
        *   Hệ thống tự động tạo **Lệnh sản xuất (Production Order)** và gửi thông báo cho Quản lý sản xuất.

*Ghi chú: Các bước sau đó thuộc về **Luồng Sản Xuất**.*
