import React, { useEffect, useState } from 'react';
import './OrderListplanRoom.css';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";

const OrderListplanRoom = () => {
  const [contracts, setContracts] = useState([]);

  // Lấy dữ liệu từ API
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch("https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts");
        const data = await response.json();
        setContracts(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    };
    fetchContracts();
  }, []);

  return (
    <div className="quote-page-container">
      <aside className="sidebar2">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <ul className="menu2">
          <a href='/quoterequestplan' style={{ textDecoration: 'none' }}><li>Yêu cầu báo giá</li></a>
          <li className="active">Đơn hàng</li>
          <a href='/productionorderplan' style={{ textDecoration: 'none' }}><li>Lệnh sản xuất</li></a>
          <a><li>Giải pháp rủi ro</li></a>
          <li>Ảnh hưởng giao hàng</li>
        </ul>
      </aside>

      <main className="main-content2">
        <section className="product-section" style={{ marginBottom: '50px' }}>
          <h2>Danh sách đơn hàng</h2>

          <table className="quote-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã đơn hàng</th>
                <th>Ngày tạo đơn</th>
                <th>Tổng tiền (VND)</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract, index) => (
                <tr key={contract.id}>
                  <td>{index + 1}</td>
                  <td>{contract.contractNumber}</td>
                  <td>{new Date(contract.contractDate).toLocaleDateString('vi-VN')}</td>
                  <td>{contract.totalAmount.toLocaleString('vi-VN')}</td>
                  <td>{contract.status}</td>
                  <td>
                    <a href={`/orderdetailplan/${contract.id}`}>
                      <button><span>👁️</span>Xem</button>
                    </a>
                  </td>
                </tr>
              ))}
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

export default OrderListplanRoom;
