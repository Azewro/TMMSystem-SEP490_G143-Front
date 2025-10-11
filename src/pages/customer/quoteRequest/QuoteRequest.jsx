import React from 'react';
import './QuoteRequest.css';
import { FaUser } from "react-icons/fa";
const QuoteRequest = () => {
    return (
        <div className="quote-page-container">
      <aside className="sidebar2">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <ul className="menu2">
          <a href='/home' style={{textDecoration:'none'}}><li>Sản phẩm</li></a>
          <li className="active">Yêu cầu báo giá</li>
          <li>Đơn hàng</li>
          <li>Khách hàng</li>
        </ul>
      </aside>
      <div className="main-content2">
        <header className="header2">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã lô, sản phẩm..."
            className="search-input"
          />
          <div className="header-right">
            <div className="notification">
              <span className="dot">2</span>
              🔔
            </div>
            <FaUser />
            <span className="user-email">abc@gmail.com</span>
          </div>
        </header>
        <div className="page-header">
          <h2>Danh sách yêu cầu báo giá</h2>
          <a href='/createquote'><button className="create-btn">+ Tạo yêu cầu báo giá mới</button></a>
        </div>
        <div className="quote-list">
          {[1, 2].map((item) => (
            <div className="quote-card" key={item}>
              <div className="quote-info">
                <span><strong>{item}</strong></span>
                <span><strong>Mã lô:</strong> {item === 1 ? "102" : "101"}</span>
                <span><strong>Số lượng trong lô:</strong> 1</span>
                <span><strong>Ngày tạo đơn:</strong> {item === 1 ? "26/11/2025" : "25/11/2025"}</span>
                <span>
                  <strong>Trạng thái đơn hàng:</strong>{" "}
                  <span className={item === 1 ? "pending" : "approved"}>
                    {item === 1 ? "Đang chờ phê duyệt" : "Đã được duyệt"}
                  </span>
                </span>
                <button className="action-btn">{item === 1 ? "Báo giá" : "Xem đơn"}</button>
              </div>

              <table className="quote-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã đơn hàng</th>
                    <th>Sản phẩm</th>
                    <th>Kích thước</th>
                    <th>Số lượng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>1</td>
                    <td>{item === 1 ? "Khăn mặt hoa cotton" : "Khăn tắm cao cấp Bamboo"}</td>
                    <td>{item === 1 ? "34x80cm" : "70x140cm"}</td>
                    <td>{item === 1 ? "50" : "100"}</td>
                    <td>
                      <span className="edit">✏️</span>
                      <span className="delete">🗑️</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="quote-footer">
                <p>
                  <strong>Ngày mong muốn nhận hàng:</strong>{" "}
                  {item === 1 ? "30/12/2025" : "28/12/2025"}
                </p>
                <button className="add-product">+ Thêm sản phẩm</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuoteRequest;