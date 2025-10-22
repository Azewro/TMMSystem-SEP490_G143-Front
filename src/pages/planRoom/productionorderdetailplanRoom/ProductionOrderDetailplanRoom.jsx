
import "./ProductionOrderDetailplanRoom.css";
import React, { useState } from "react";
const ProductionOrderDetailplanRoom = () => {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h3>Chi tiết Lệnh sản xuất PO-001</h3>
        </div>

        {/* Thông tin đơn hàng */}
        <div className="modal-body">
          <div className="order-info">
            <div className="form-group">
              <label>Mã đơn hàng</label>
              <input type="text" value="ORD-001" readOnly />
            </div>
            <div className="form-group">
              <label>Ngày bắt đầu</label>
              <input type="text" value="15/05/2025" readOnly />
            </div>
            <div className="form-group">
              <label>Ngày kết thúc</label>
              <input type="text" value="25/05/2025" readOnly />
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <h4>Danh sách sản phẩm khăn bông</h4>
          <table className="product-table">
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Số lượng</th>
                <th>Kích thước</th>
                <th>Khối lượng sợi</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Khăn mặt Bamboo cao cấp</td>
                <td>1000</td>
                <td>35x50 cm</td>
                <td>600 kg</td>
                <td>
                  <button className="create-btn"onClick={() => setShowPopup(true)}>📄 Sửa lệnh sản xuất</button>
                </td>
              </tr>
              <tr>
                <td>Khăn tắm Cotton trắng</td>
                <td>800</td>
                <td>70x140 cm</td>
                <td>1200 kg</td>
                <td>
                  <button className="create-btn">📄 Sửa lệnh sản xuất</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="close-btn">Đóng</button>
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
                <div> <label>Tên sản phẩm</label>
                  <input type="text" defaultValue="Khăn Cotton cao cấp" /> </div>
                <div> <label>Kích thước</label> <input type="text" defaultValue="70x140cm" /> </div> </div>
              <div className="form-row5">
                <div> <label>Ngày bắt đầu</label> <input type="date" defaultValue="2025-05-12" /> </div>
                <div> <label>Ngày kết thúc</label> <input type="date" defaultValue="2025-05-20" /> </div> </div>
              <div className="form-row5">
                <div> <label>Số lượng</label>
                  <input type="number" defaultValue="120" /> </div> <div> <label>Định mức (kg/khăn)</label> <input type="number" step="0.1" defaultValue="0.3" /> </div> </div> <div className="form-row5"> <div style={{ width: "100%" }}> <label>Nguyên liệu sợi</label> <input type="text" defaultValue="Cotton 100%" /> </div> </div> </div> <div className="popup-footer5"> <button className="cancel-btn5" onClick={() => setShowPopup(false)}>Hủy</button> <button className="save-btn5">💾 Lưu thay đổi</button> </div> </div> </div>)}
    </div>
  );
};

export default ProductionOrderDetailplanRoom;
