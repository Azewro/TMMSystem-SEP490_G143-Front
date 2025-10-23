import React, { useEffect, useState } from 'react';
import './Order.css';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách đơn hàng
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts");
        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu đơn hàng");
        }
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Lỗi khi tải đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Hàm format tiền VND
  const formatCurrency = (amount) => {
    return amount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '0 ₫';
  };

  return (
    <div className="home-container2">
      <aside className="sidebar2">
        <div className="logo2">
          <img src="/images/logo.png" alt="Dệt may Mỹ Đức" />
        </div>
        <nav className="menu2">
          <ul>
            <li>Sản phẩm</li>
            <a href="/quote" style={{ textDecoration: 'none' }}>
              <li>Yêu cầu báo giá</li>
            </a>
            <li className="active">Đơn hàng</li>
            <li>Khách hàng</li>
          </ul>
        </nav>
      </aside>

      <main className="main-content2">
        <section className="product-section" style={{ marginBottom: '50px' }}>
          <h2>Danh sách đơn hàng</h2>

          <div className="filter" style={{ marginBottom: '50px' }}>
            <select>
              <option>Tất cả danh mục</option>
              <option>Khăn tắm</option>
              <option>Khăn mặt</option>
              <option>Khăn bếp</option>
            </select>
          </div>

          <table className="quote-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã đơn hàng</th>
                <th>Ngày tạo</th>
                <th>Tổng tiền (VND)</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>Đang tải...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>Không có đơn hàng nào</td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td>{order.contractNumber}</td>
                    <td>{new Date(order.contractDate).toLocaleDateString('vi-VN')}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      {order.status === "DRAFT" && "Nháp"}
                      {order.status === "APPROVED" && "Đã duyệt"}
                      {order.status === "PENDING_APPROVAL" && "Chờ duyệt"}
                    </td>
                    <td>
                      <a href={`/orderdetail?id=${order.id}`}>
                        <button><span>👁️</span> Xem</button>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination">
            <button>&lt;</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>&gt;</button>
          </div>
        </section>

        <footer className="footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginLeft: '400px' }}>
            <FiPhone /> Hotline: 0913 522 663
            <FiMail /> Email: contact@mvductowel.com
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Order;
