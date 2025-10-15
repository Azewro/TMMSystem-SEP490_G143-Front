import React, { useState } from 'react';
import './ProductionOrderDetailplanRoom.css';
const ProductionOrderDetailplanRoom = () => {
    const [showPopup, setShowPopup] = useState(false);
    return (
        <div className="production-detail-container5">
            <div className="breadcrumb5">
                <span>Lệnh sản xuất /</span> <span className="current5">Chi tiết</span>
            </div>

            <h2 className="page-title5">
                Chi tiết <span className="highlight5">Lệnh sản xuất PO-001</span>
            </h2>

            <div className="production-card5">
                <div className="production-info5">
                    <p><b>Tên sản phẩm:</b> Khăn Cotton cao cấp</p>
                    <p><b>Kích thước:</b> 70x140cm</p>
                    <p><b>Ngày bắt đầu:</b> 2025-05-12</p>
                    <p><b>Ngày kết thúc:</b> 2025-05-20</p>
                    <p><b>Số lượng:</b> 120</p>
                    <p><b>Định mức:</b> 0.3 kg/khăn</p>
                    <p><b>Nguyên liệu sợi:</b> Cotton 100%</p>
                    <p className="total-weight5"><b>Tổng khối lượng sợi:</b> <span>36 kg</span></p>
                </div>

                <div className="action-area5">
                    <button className="edit-btn5" onClick={() => setShowPopup(true)}>✏️ Sửa lệnh sản xuất</button>
                    <a href='/productionorderplan'><button>Quay lại</button></a>
                </div>
            </div>
            {showPopup && (
        <div className="popup-overlay5">
          <div className="popup-box5">
            <div className="popup-header5">
              <span>✏️ Sửa Lệnh Sản Xuất</span>
              <button className="close-btn5" onClick={() => setShowPopup(false)}>×</button>
            </div>

            <div className="popup-body5">
              <div className="form-row5">
                <div>
                  <label>Tên sản phẩm</label>
                  <input type="text" defaultValue="Khăn Cotton cao cấp" />
                </div>
                <div>
                  <label>Kích thước</label>
                  <input type="text" defaultValue="70x140cm" />
                </div>
              </div>

              <div className="form-row5">
                <div>
                  <label>Ngày bắt đầu</label>
                  <input type="date" defaultValue="2025-05-12" />
                </div>
                <div>
                  <label>Ngày kết thúc</label>
                  <input type="date" defaultValue="2025-05-20" />
                </div>
              </div>

              <div className="form-row5">
                <div>
                  <label>Số lượng</label>
                  <input type="number" defaultValue="120" />
                </div>
                <div>
                  <label>Định mức (kg/khăn)</label>
                  <input type="number" step="0.1" defaultValue="0.3" />
                </div>
              </div>

              <div className="form-row5">
                <div style={{ width: "100%" }}>
                  <label>Nguyên liệu sợi</label>
                  <input type="text" defaultValue="Cotton 100%" />
                </div>
              </div>
            </div>

            <div className="popup-footer5">
              <button className="cancel-btn5" onClick={() => setShowPopup(false)}>Hủy</button>
              <button className="save-btn5">💾 Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
        </div>
    );
};

export default ProductionOrderDetailplanRoom;