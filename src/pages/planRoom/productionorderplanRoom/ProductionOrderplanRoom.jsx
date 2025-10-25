import React, { useEffect, useState } from 'react';
import './ProductionOrderplanRoom.css';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";

const ProductionOrderplanRoom = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('https://tmmsystem-sep490g143-production.up.railway.app/v1/production/orders');
        if (!response.ok) {
          throw new Error('Lỗi khi tải dữ liệu');
        }
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Lỗi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Hàm định dạng ngày giờ
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="quote-page-container">
      <aside className="sidebar2">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <ul className="menu2">
          <a href='/quoterequestplan' style={{ textDecoration: 'none' }}><li>Yêu cầu báo giá</li></a>
          <a href='/orderlistplanRoom' style={{ textDecoration: 'none' }}><li>Đơn hàng</li></a>
          <a><li className="active">Lệnh sản xuất</li></a>
          <a><li>Giải pháp rủi ro</li></a>
          <li>Ảnh hưởng giao hàng</li>
        </ul>
      </aside>

      <main className="main-content2">
        <section className="product-section" style={{ marginBottom: '50px' }}>
          <h2>Danh sách lệnh sản xuất</h2>

          <table className="quote-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã lệnh sản xuất</th>
                <th>Mã đơn hàng</th>
                <th>Ngày tạo đơn</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Đang tải dữ liệu...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td>{order.poNumber}</td>
                    <td>{order.contractId}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      {order.status === 'APPROVED' ? '✅ Đã duyệt' :
                        order.status === 'PENDING_APPROVAL' ? '⏳ Chờ duyệt' :
                        order.status === 'REJECTED' ? '❌ Từ chối' :
                        order.status}
                    </td>
                    <td>
                      <a href={`/productionorderdetailplan/${order.id}`}>
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

export default ProductionOrderplanRoom;
