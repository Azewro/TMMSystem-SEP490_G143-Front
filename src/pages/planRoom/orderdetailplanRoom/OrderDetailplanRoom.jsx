import React, { useState } from 'react';
import './OrderDetailplanRoom.css';
const OrderDetailplanRoom = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [showContractPopup, setShowContractPopup] = useState(false);
    return (
        <div className="order-detail-container">
      <div className="breadcrumb">
        <span>Đơn đặt hàng /</span> <span className="current">Chi tiết</span>
      </div>

      <h2 className="page-title">Chi tiết đơn đặt hàng</h2>

      <div className="info-section">
        <div className="info-card">
          <div className="card-header">Thông tin khách hàng</div>
          <div className="card-body">
            <p><b>Tên khách hàng:</b> Nguyễn Văn Hùng</p>
            <p><b>SDT:</b> 0969792483</p>
            <p><b>Công ty:</b> Công ty Dệt Mỹ Đức</p>
            <p><b>Mã thuế:</b> 02435520488</p>
            <p><b>Địa chỉ:</b> Lô N10 – 2 Cụm Sản Xuất Làng Nghề Tập Trung, Xã Tân Triều, Thanh Trì, Hà Nội</p>
            <button style={{background:'blue',color:'#ffff',borderRadius:'10px'}} onClick={() => setShowContractPopup(true)}>Xem hợp đồng</button>
          </div>
        </div>

        <div className="info-card">
          <div className="card-header">Trạng thái đơn hàng</div>
          <div className="card-body">
            <p>
              <b>Trạng thái:</b>{" "}
              <span className="status-badge">Đang chờ phê duyệt</span>
            </p>
            <p><b>Ngày giao mong muốn:</b> 02/05/2025</p>
            <p><b>Ngày giao hàng dự kiến:</b> 30/05/2025</p>
          </div>
        </div>
      </div>

      <div className="order-detail-section">
        <div className="card-header">Chi tiết đơn hàng</div>
        <table className="order-table2">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Kích thước</th>
              <th>Số lượng</th>
              <th>Giá (VNĐ)</th>
              <th>Thành tiền (VNĐ)</th>
              
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
          </tbody>
        </table>
      </div>

      <div className="action-section">
        <a href='/orderlistplanRoom'><button className="back-btn">← Quay lại</button></a>
        <button className="create-btn" onClick={() => setShowPopup(true)}>🧾 Tạo lệnh sản xuất</button>
      </div>
      {showPopup && (
        <div className="popup-overlay4">
          <div className="popup-box4">
            <h3 className="popup-title4">Tạo Lệnh Sản Xuất</h3>
            <button className="popup-close4" onClick={() => setShowPopup(false)}>×</button>

            <div className="popup-content4">
              <p><b>Mã lệnh sản xuất:</b> LSX-197</p>
              <p><b>Tên sản phẩm:</b> Khăn mặt Bamboo</p>
              <p><b>Kích thước:</b> 35x50cm</p>
              <p><b>Số lượng:</b> 160</p>

              <div className="popup-inputs4">
                <div className="input-row4">
                  <label>Ngày bắt đầu:</label>
                  <input type="date" />
                </div>
                <div className="input-row4">
                  <label>Ngày kết thúc:</label>
                  <input type="date" />
                </div>

                <div className="input-row4">
                  <label>Định lượng Nguyên vật liệu (kg/khăn):</label>
                  <input type="number" placeholder="2" />
                </div>
                <div className="input-row4">
                  <label>Nguyên liệu sợi:</label>
                  <input type="text" placeholder="Bamboo" />
                </div>

                <div className="input-row4">
                  <label>Tổng khối lượng sợi:</label>
                  <span className="total-weight">320.00 kg</span>
                </div>

                
              </div>

              <div className="popup-actions4">
                <button className="cancel-btn4" onClick={() => setShowPopup(false)}>Hủy</button>
                <button className="confirm-btn4">Tạo lệnh</button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                
                <button className="cancel-btn4" onClick={() => setShowContractPopup(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailplanRoom;