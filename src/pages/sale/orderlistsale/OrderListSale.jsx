import React, { useEffect, useState } from 'react';
import './OrderListSale.css';
import axios from 'axios';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";

const OrderListSale = () => {
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = storedUser?.token;

        const res = await axios.get(
          "https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setContracts(res.data);
      } catch (error) {
        console.error("❌ Lỗi khi tải danh sách đơn hàng:", error);
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
          <a href='/quoterequestsale' style={{ textDecoration: 'none' }}><li>Yêu cầu báo giá</li></a>
          <a href='/quotesale' style={{ textDecoration: 'none' }}><li>Báo giá</li></a>
          <li className="active">Đơn hàng</li>
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
                <th>Người đại diện</th>
                <th>Ngày tạo đơn</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length > 0 ? (
                contracts.map((contract, index) => (
                  <tr key={contract.id}>
                    <td>{index + 1}</td>
                    <td>{contract.contractNumber}</td>
                    <td>{contract.customerId}</td>
                    <td>{new Date(contract.contractDate).toLocaleDateString('vi-VN')}</td>
                    <td>{contract.status}</td>
                    <td>
                      <a href={`/orderdetailsale/${contract.id}`}>
                        <button><span>👁️</span> Chi tiết</button>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                    Không có đơn hàng nào
                  </td>
                </tr>
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

export default OrderListSale;
