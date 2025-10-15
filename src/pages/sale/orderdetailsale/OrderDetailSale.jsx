import React, { useState } from 'react';
import './OrderDetailSale.css';
const OrderDetailSale = () => {
    const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

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
        </div>

        <div className="info-card">
          <div className="card-header blue-header">Trạng thái đơn hàng</div>
          <div className="card-body">
            <p><b>Trạng thái:</b> <span className="status-badge">Đang chờ upload hợp đồng</span></p>
            <p><b>Ngày giao mong muốn:</b> 02/05/2025</p>
            <p><b>Ngày thực giao:</b> 30/05/2025</p>
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
                <td>13.000</td>
                <td>2.080.000</td>
              </tr>
              <tr>
                <td>Khăn tắm Cotton</td>
                <td>70x140cm</td>
                <td>100</td>
                <td>45.000</td>
                <td>4.500.000</td>
              </tr>
              <tr>
                <td>Khăn lông Premium</td>
                <td>50x100cm</td>
                <td>200</td>
                <td>28.000</td>
                <td>5.600.000</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="4">Tổng cộng:</td>
                <td><b>12.180.000</b></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={() => setShowModal(true)}>📄 Hợp đồng</button>
        <a href='/orderlistsale'><button className="btn-secondary">↩️ Quay lại</button></a>
      </div>
      {showModal && (
        <div className="modal-overlay6">
          <div className="modal6">
            <div className="modal-header6">
              <h3>📎 Thêm Hợp Đồng</h3>
              <button className="close-btn6" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body6">
              <div className="form-group6">
                <label>Mã hợp đồng</label>
                <input type="text" value="HD-2025-001" readOnly />
              </div>

              <div className="form-group6">
                <label>Ảnh hợp đồng</label>
                <input type="file" onChange={handleFileChange} />
                {selectedFile ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Ảnh hợp đồng"
                    className="preview-img"
                  />
                ) : (
                  <div className="no-image6">Chưa có ảnh được chọn</div>
                )}
              </div>

              <p className="note6">
                🔴 Lưu ý: Hợp đồng sau khi được duyệt sẽ không thể chỉnh sửa.
              </p>
            </div>

            <div className="modal-footer6">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
              <button className="btn-primary">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailSale;