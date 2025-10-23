import React, { useEffect, useState } from 'react';
import './OrderManager.css';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import axios from "axios"; // 🟢 ADDED

const BASE_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1"; // 🟢 ADDED

const OrderManager = () => {
  // 🟢 ADDED: State quản lý danh sách đơn hàng và loading
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 ADDED: Gọi API lấy danh sách đơn hàng
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/contracts`);
        setOrders(response.data);
      } catch (error) {
        console.error("❌ Lỗi khi tải danh sách đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="quote-page-container">
      <aside className="sidebar2">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <ul className="menu2">
          <li className="active">Đơn hàng</li>
          <a href='/productionordermanager' style={{ textDecoration: 'none' }} >
            <li>Lệnh sản xuất</li>
          </a>
          <a><li>Giải pháp rủi ro</li></a>
          <li>Ảnh hưởng giao hàng</li>
        </ul>
      </aside>

      <main className="main-content2">
        <section className="product-section" style={{ marginBottom: '50px' }}>
          <h2>Danh sách đơn hàng</h2>

          {/* 🟢 ADDED: Loading / error / empty */}
          {loading ? (
            <p style={{ textAlign: 'center' }}>Đang tải dữ liệu...</p>
          ) : orders.length === 0 ? (
            <p style={{ textAlign: 'center' }}>Không có đơn hàng nào.</p>
          ) : (
            <table className="quote-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mã đơn hàng</th>
                  <th>Khách hàng</th>
                  <th>Ngày tạo đơn</th>
                  <th>Tổng tiền (VND)</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {/* 🟢 ADDED: Hiển thị danh sách đơn hàng */}
                {orders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td>{order.contractNumber}</td>
                    <td>{order.customerId}</td>
                    <td>{new Date(order.contractDate).toLocaleDateString("vi-VN")}</td>
                    <td>{order.totalAmount.toLocaleString("vi-VN")}</td>
                    <td>{order.status}</td>
                    <td>
                      <a href={`/orderdetailmanager/${order.id}`}>    
                        <button>
                          <span>👁️</span>Xem
                        </button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="pagination">
            <button>&lt;</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>&gt;</button>
          </div>
        </section>

        <footer className="footer">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              alignItems: 'center',
              marginLeft: '400px'
            }}
          >
            <FiPhone /> Hotline: 0913 522 663
            <FiMail /> Email: contact@mvductowel.com
          </div>
        </footer>
      </main>
    </div>
  );
};

export default OrderManager;
