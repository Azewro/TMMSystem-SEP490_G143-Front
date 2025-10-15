import React from 'react';
import './ProductionOrderDetailManager.css';
const ProductionOrderDetailManager = () => {
    return (
    <div className="production-page7">
      <h2 className="page-title7">Chi tiết Lệnh sản xuất PO-001</h2>

      <div className="order-info7">
        <div><strong>Mã đơn hàng:</strong> ORD-001</div>
        <div><strong>Ngày tạo lệnh:</strong> 12/05/2025</div>
        <div><strong>Trạng thái:</strong> Chờ phê duyệt</div>
      </div>

      <div className="production-section7">
        <div className="section-header7">Thông tin Lệnh sản xuất</div>
        <table className="production-table7">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên sản phẩm</th>
              <th>Kích thước</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Số lượng</th>
              <th>Định mức (kg/khăn)</th>
              <th>Nguyên liệu vải</th>
              <th>Tổng khối lượng (kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Khăn tắm Cotton cao cấp</td>
              <td>70x140cm</td>
              <td>13/05/2025</td>
              <td>20/05/2025</td>
              <td>120</td>
              <td>0.3</td>
              <td>Cotton 100%</td>
              <td>36 kg</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="action-buttons7">
        <button className="approve-btn7">Phê duyệt</button>
        <button className="reject-btn7">Từ chối</button>
        <a href='/productionordermanager'><button className="cancel-btn7">Hủy</button></a>
      </div>
    </div>
    );  
};
export default ProductionOrderDetailManager;