import React, { useEffect, useState } from "react";
import "./QuoteSale.css";
import { FiPhone, FiMail } from "react-icons/fi";
import axios from "axios";
import { Link } from "react-router-dom";

const BASE_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1";

const QuoteSale = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/quotations`);
        setQuotations(res.data);
      } catch (error) {
        console.error("❌ Lỗi khi tải danh sách báo giá:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotations();
  }, []);

  if (loading) return <div>Đang tải danh sách báo giá...</div>;

  return (
    <div className="quote-page-container">
      <aside className="sidebar2">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <ul className="menu2">
          <a href="/quoterequestsale" style={{ textDecoration: "none" }}>
            <li>Yêu cầu báo giá</li>
          </a>
          <li className="active">Báo giá</li>
          <a href="/orderlist" style={{ textDecoration: "none" }}>
            <li>Đơn hàng</li>
          </a>
          <li>Ảnh hưởng giao hàng</li>
        </ul>
      </aside>

      <main className="main-content2">
        <section className="product-section" style={{ marginBottom: "50px" }}>
          <h2>Danh sách báo giá</h2>

          <table className="quote-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã báo giá</th>
                <th>Người liên hệ</th>
                
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length > 0 ? (
                quotations.map((q, index) => (
                  <tr key={q.id}>
                    <td>{index + 1}</td>
                    <td>{q.quotationNumber}</td>
                    <td>{q.contactPerson}</td>
                    
                    <td>{q.status}</td>
                    <td>{new Date(q.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <Link to={`/quotedetailsale/${q.id}`}>
                        <button>
                          <span>👁️</span> Chi tiết
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Không có báo giá nào.
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "center",
              marginLeft: "400px",
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

export default QuoteSale;
