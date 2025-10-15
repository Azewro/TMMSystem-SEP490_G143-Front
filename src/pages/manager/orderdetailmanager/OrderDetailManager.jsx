import React, { useState } from 'react';
import './OrderDetailManager.css';
const OrderDetailManager = () => {
    const [showContractPopup, setShowContractPopup] = useState(false);
    return (
        <div className="order-detail-container">
      <div className="breadcrumb">
        <span>Đơn đặt hàng / </span>
        <span className="current">Chi tiết</span>
      </div>

      <h2 className="page-title">Chi tiết đơn đặt hàng</h2>

      <div className="top-section">
        <div className="info-card">
          <div className="card-header blue-header">Thông tin khách hàng</div>
          <div className="card-body">
            <p><b>Tên khách hàng:</b> Nguyễn Văn Hùng</p>
            <p><b>SDT:</b> 0969792483</p>
            <p><b>Công ty:</b> Công ty Dệt Mỹ Đức</p>
            <p><b>Mã thuế:</b> 02435520488</p>
            <p><b>Địa chỉ:</b> Lô N10 – 2 Cụm Sản Xuất Làng Nghề Tập Trung, Xã Tân Triều, Thanh Trì, Hà Nội</p>
          </div>
          <button className="btn-primary" onClick={() => setShowContractPopup(true)}>📄 Xem hợp đồng</button>
        </div>

        <div className="info-card">
          <div className="card-header blue-header">Trạng thái đơn hàng</div>
          <div className="card-body">
            <p>
              <b>Trạng thái:</b>{" "}
              <span className="status-badge yellow">Đang chờ phê duyệt</span>
            </p>
            <p><b>Ngày giao mong muốn:</b> 02/05/2025</p>
            <p><b>Ngày giao hàng dự kiến:</b> 30/05/2025</p>
          </div>
        </div>
      </div>

      <div className="info-card full-width">
        <div className="card-header blue-header">Chi tiết đơn hàng</div>
        <div className="card-body">
          <table className="order-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Kích thước</th>
                <th>Số lượng</th>
                <th>Giá (VND)</th>
                <th>Thành tiền (VND)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Khăn mặt Bamboo</td>
                <td>35x50cm</td>
                <td>160</td>
                <td>13,000</td>
                <td>2,080,000</td>
              </tr>
              <tr>
                <td>Khăn tắm Cotton cao cấp</td>
                <td>70x140cm</td>
                <td>120</td>
                <td>25,000</td>
                <td>3,000,000</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="4"><b>Tổng cộng:</b></td>
                <td><b>5,080,000 VND</b></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="button-group">
        <a href="/ordermanager">
          <button className="btn-secondary">↩️ Quay lại</button>
        </a>
      </div>
      {showContractPopup && (
        <div className="popup-overlay4">
          <div className="popup-box4" style={{ width: '500px' }}>
            <h3 className="popup-title4">Xem Hợp Đồng</h3>
            <button className="popup-close4" onClick={() => setShowContractPopup(false)}>×</button>
            
            <div className="popup-content4">
              <div className="input-row4">
                <label>Mã hợp đồng:</label>
                <input type="text" value="HD-2025-001" readOnly />
              </div>

              <div className="input-row4">
                <label>Ảnh hợp đồng:</label>
                <div className="image-upload-box">
                  <span role="img" aria-label="upload">🖼️</span>
                </div>
              </div>

              <div className="popup-actions4" style={{ justifyContent: 'center' }}>
                <button className="confirm-btn4">Phê duyệt</button>
                <button className="reject-btn4">Từ chối</button>
                <button className="cancel-btn4" onClick={() => setShowContractPopup(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default OrderDetailManager;