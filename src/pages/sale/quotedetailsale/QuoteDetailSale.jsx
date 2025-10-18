import React from 'react';
import './QuoteDetailSale.css';
const QuoteDetailSale = () => {
    return (
        <div className="quote-container">
      <h2 className="quote-title">Chi tiết báo giá</h2>

      <div className="quote-status">
        <span className="status-label">Trạng thái:</span>
        <span className="status-pill">Chờ duyệt</span>
      </div>

      <div className="quote-date">
        <span>Ngày giao hàng dự kiến:</span> <b>2025-10-20</b>
      </div>

      <div className="table-wrapper">
        <table className="quote-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Sản phẩm</th>
              <th>Kích thước</th>
              <th>Số lượng (cái)</th>
              <th>Đơn giá (VND)</th>
              <th>Tổng tiền</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Sản phẩm A</td>
              <td>10x20cm</td>
              <td>100</td>
              <td>50.000</td>
              <td>500</td>
              <td>chưa tính thuế</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Sản phẩm B</td>
              <td>15x25cm</td>
              <td>200</td>
              <td>75.000</td>
              <td>500</td>
              <td>chưa tính thuế</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Sản phẩm C</td>
              <td>20x30cm</td>
              <td>150</td>
              <td>100.000</td>
              <td>500</td>
              <td>chưa tính thuế</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="quote-buttons">
        <a href='/quotesale'><button className="btn btn-back">↩ Quay lại</button></a>
        
        <button className="btn btn-send">📤 Gửi</button>
      </div>
    </div>
  );
};

export default QuoteDetailSale;