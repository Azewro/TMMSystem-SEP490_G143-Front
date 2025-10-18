import React, { useState } from 'react';
import './QuoteRequestDetailplanRoom.css';
const QuoteRequestDetailplanRoom = () => {
    const [quoteTestResult, setQuoteTestResult] = useState(false);
    const [quoteFormOpen, setQuoteFormOpen] = useState(false);
    return (
        <div className="quote-detail-container">
      <h2 className="page-title">Chi tiết Yêu cầu Báo giá</h2>

      <div className="info-section2">
        <div className="info-card2">
          <h3 className="info-title2">Thông tin khách hàng</h3>
          <p><b>Tên khách hàng:</b> Nguyễn Văn A</p>
          <p><b>Công ty:</b> Công ty TNHH ABC</p>
          <p><b>Email:</b> nguyenvana@abc.com</p>
          <p><b>Điện thoại:</b> 0901234567</p>
          <p><b>Mã số thuế:</b> 0123456789</p>
        </div>

        <div className="info-card2">
          <h3 className="info-title2">Thông tin RFQ</h3>
          <p><b>Mã RFQ:</b> RFQ-2025-001</p>
          <p><b>Ngày tạo:</b> 13/10/2025</p>
          <p><b>Trạng thái:</b> pending</p>
          <p><b>Ngày mong muốn nhận:</b> 20/10/2025</p>
          <p><b>Số lượng sản phẩm:</b> 3</p>
        </div>
      </div>

      <div className="product-list2">
        <h3 className="product-title2">Danh sách sản phẩm</h3>
        <table className="product-table2">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã đơn hàng</th>
              <th>Sản phẩm</th>
              <th>Kích thước</th>
              <th>Số lượng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>ORD-001</td>
              <td>Linh kiện điện tử A</td>
              <td>10x20cm</td>
              <td>100</td>
            </tr>
            <tr>
              <td>2</td>
              <td>ORD-002</td>
              <td>Linh kiện điện tử B</td>
              <td>15x25cm</td>
              <td>200</td>
            </tr>
            <tr>
              <td>3</td>
              <td>ORD-003</td>
              <td>Linh kiện điện tử C</td>
              <td>20x30cm</td>
              <td>150</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="action-buttons">
        <a href='/quoterequestsale'><button className="back-btn">← Quay lại danh sách</button></a>
        <button className="send-btn" onClick={() => setQuoteTestResult(true)}>Kiểm tra máy & kho</button>
        <button className="send-btn" onClick={() => setQuoteFormOpen(true)}>lập báo giá</button>
      </div>
      {quoteTestResult &&(
      <div className="popup-overlay3">
        <div className="popup-box3">
          <div className="popup-icon success">
            <i className="fa fa-check-circle"></i>
          </div>
          <h3 className="popup-title3">Kết quả kiểm tra</h3>
          <p><b>Máy:</b> Đủ</p>
          <p><b>Kho:</b> Đủ</p>
          <button className="popup-btn3" onClick={() => setQuoteTestResult(false)}>Đóng</button>
        </div>
      </div>
      )}
      {quoteFormOpen && (
        <div className="popup-overlay3">
          <div className="popup-box4">
            <div className="popup-header4">
              <h3>Lập Báo Giá</h3>
              <span className="close-btn" onClick={() => setQuoteFormOpen(false)}>×</span>
            </div>
            <div className="popup-body4">
              <input type="text" placeholder="Giá Nguyên vật liệu" />
              <input type="text" placeholder="chi phí công đoạn 45k/kg" />
              
              
              <input type="text" placeholder="% Lợi nhuận mong muốn" />
              <input type="text" placeholder="Tổng" />
            </div>
            <div className="popup-footer4">
              <button className="cancel-btn" onClick={() => setQuoteFormOpen(false)}>Hủy</button>
              <button className="confirm-btn">Gửi Báo Giá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteRequestDetailplanRoom;