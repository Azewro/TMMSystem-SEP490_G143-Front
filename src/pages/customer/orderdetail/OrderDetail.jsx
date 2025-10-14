import React from 'react';
import './OrderDetail.css';
const OrderDetail = () => {
    return (
        <div className="order-detail-page">
      <div className="order-header">
        <div className="order-info">
          <h2>Đơn hàng <span className="order-id">#ORD-001</span></h2>
          <p><strong>📅 Ngày tạo:</strong> 26/04/2025</p>
          <p><strong>📦 Trạng thái:</strong> <span className="status-badge pending">Chờ sản xuất</span></p>
          <p><strong>🚚 Ngày giao:</strong> 29/05/2025</p>
        </div>
        <div className="order-actions">
          <button className="btn-contract">Hợp đồng</button>
          <a href='/order'><button className="btn-back">↩ Quay lại</button></a>
        </div>
      </div>

      <div className="order-body">
        <h3 className="section-title">Chi tiết đơn hàng</h3>
        <div className="order-summary">
          <p><strong>Tổng cộng:</strong> <span className="total-amount">2.600.000 VND</span></p>
        </div>

        <table className="order-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Kích thước</th>
              <th>Số lượng</th>
              <th>Đơn giá (VND)</th>
              <th>Thành tiền (VND)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Chỉ tơ vắt sổ</td>
              <td>150D - 5000m</td>
              <td>200</td>
              <td>13,000</td>
              <td>2,600,000</td>
            </tr>
          </tbody>
        </table>

        <div className="process-section">
          <div className="process-item">
            <div className="process-icon success">✔</div>
            <h4>Cuộn mác</h4>
            <span className="status-step">Chưa bắt đầu</span>
          </div>

          <div className="process-item">
            <div className="process-icon success">✔</div>
            <h4>Dệt</h4>
            <span className="status-step">Chưa bắt đầu</span>
          </div>

          <div className="process-item">
            <div className="process-icon success">✔</div>
            <h4>Cắt</h4>
            <span className="status-step">Chưa bắt đầu</span>
          </div>

          <div className="process-item">
            <div className="process-icon success">✔</div>
            <h4>May</h4>
            <span className="status-step">Chưa bắt đầu</span>
          </div>

          <div className="process-item">
            <div className="process-icon success">✔</div>
            <h4>Đóng gói</h4>
            <span className="status-step">Chưa bắt đầu</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OrderDetail;