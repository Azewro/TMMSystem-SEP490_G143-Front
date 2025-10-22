import React, { useEffect, useState } from 'react';
import './ProductionOrderManager.css';
import { FiPhone, FiMail } from "react-icons/fi";

const ProductionOrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🟦 Gọi API lấy danh sách lệnh sản xuất
  const fetchProductionOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://tmmsystem-sep490g143-production.up.railway.app/v1/production/orders");
      if (!res.ok) throw new Error("Không thể tải danh sách lệnh sản xuất!");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Lỗi khi tải lệnh sản xuất:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionOrders();
  }, []);

  return (
    <div className="quote-page-container">
      {/* --- Sidebar --- */}
      <aside className="sidebar2">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <ul className="menu2">
          <a href="/ordermanager" style={{ textDecoration: 'none' }}><li>Đơn hàng</li></a>
          <a><li className="active">Lệnh sản xuất</li></a>
          <a><li>Giải pháp rủi ro</li></a>
          <li>Ảnh hưởng giao hàng</li>
        </ul>
      </aside>

      {/* --- Main content --- */}
      <main className="main-content2">
        <section className="product-section" style={{ marginBottom: '50px' }}>
          <h2>Danh sách lệnh sản xuất</h2>

          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : (
            <table className="quote-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mã lệnh sản xuất</th>
                  <th>Mã hợp đồng</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order, index) => (
                    <tr key={order.id}>
                      <td>{index + 1}</td>
                      <td>{order.poNumber}</td>
                      <td>{order.contractId}</td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <span
                          style={{
                            backgroundColor:
                              order.status === 'PENDING_APPROVAL'
                                ? '#ffcc00'
                                : order.status === 'APPROVED'
                                ? '#4caf50'
                                : '#f44336',
                            color: '#000',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <a href={`/productionorderdetailmanager/${order.id}`}>
                          <button>
                            <span role="img" aria-label="eye">👁️</span> Xem
                          </button>
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#888' }}>
                      Không có lệnh sản xuất nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* --- Phân trang (giữ nguyên UI cũ) --- */}
          <div className="pagination">
            <button>&lt;</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>&gt;</button>
          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="footer">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              alignItems: 'center',
              marginLeft: '400px',
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

export default ProductionOrderManager;
