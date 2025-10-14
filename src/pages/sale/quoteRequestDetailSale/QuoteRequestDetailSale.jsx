import React, { useState } from 'react';
import './QuoteRequestDetailSale.css';
const QuoteRequestDetailSale = () => {
    const [showPopup, setShowPopup] = useState(false);
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
        <button className="send-btn" onClick={() => setShowPopup(true)}>Gửi RFQ</button>
      </div>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
            <h3 className="popup-title">Xác nhận gửi RFQ</h3>
            <p className="popup-text">Bạn có chắc chắn muốn gửi RFQ này không?</p>
            <div className="popup-actions">
              <button className="popup-cancel" onClick={() => setShowPopup(false)}>Hủy</button>
              <button className="popup-confirm">Gửi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteRequestDetailSale;