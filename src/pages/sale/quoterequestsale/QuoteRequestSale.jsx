import React, { useState,useEffect } from 'react';
import { FiPhone, FiMail } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import './QuoteRequestSale.css';
import { getAllRFQs } from '../../../services/rfqApi';
import { Link } from "react-router-dom";
const QuoteRequestSale = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        const data = await getAllRFQs();
        setRfqs(data);
      } catch (err) {
        setError("Không thể tải danh sách yêu cầu báo giá.");
      } finally {
        setLoading(false);
      }
    };
    fetchRfqs();
  }, []);
    return (
        <div className="quote-page-container">
            <aside className="sidebar2">
                <div className="logo-container">
                    <img src="/images/logo.png" alt="Logo" />
                </div>
                <ul className="menu2">
                    <li className="active">Yêu cầu báo giá</li>
                    <a href='/quotesale' style={{ textDecoration: 'none' }}><li >Báo giá</li></a>
                    <li>Đơn hàng</li>
                    <li>Ảnh hưởng giao hàng</li>
                </ul>
            </aside>
            <main className="main-content2">
                    
                    <section className="product-section" style={{marginBottom:'50px'}}>
                      <h2>Danh sách yêu cầu báo giá</h2>           
                      <div className="filter" style={{marginBottom:'50px'}}>
                        <select>
                          <option>Tất cả trạng thái</option>
                          <option>Chờ xử lý</option>
                          <option>Đã duyệt</option>
                          <option>Đã gửi</option>
                          <option>Từ chối</option>
                        </select>
                      </div>
            {loading ? (
            <p>Đang tải danh sách yêu cầu...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <table className="quote-table">
              <thead>
                <tr>
                  <th>Mã RFQ</th>
                  <th>Người đại diện</th>
                  <th>Công ty</th>
                  
                  <th>Ngày tạo</th>
                  <th>Số lượng sản phẩm</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.length > 0 ? (
                  rfqs.map((rfq) => (
                    <tr key={rfq.id}>
                      <td>{rfq.rfqNumber}</td>
                      <td>{rfq.contactPerson}</td>
                      <td>{rfq.companyName}</td>
                      
                      <td>{new Date(rfq.createdAt).toLocaleDateString()}</td>
                      <td>{rfq.details?.length || 0}</td>
                      <td>
                        <span
                          style={{
                            color:
                              rfq.status === "Approved"
                                ? "green"
                                : rfq.status === "Rejected"
                                ? "red"
                                : "orange",
                          }}
                        >
                          {rfq.status}
                        </span>
                      </td>
                      <td>
 <Link to={`/quoterequestdetailsale/${rfq.id}`}>
  <button><span>👁️</span> Chi tiết</button>
</Link>
</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      Không có yêu cầu báo giá nào.
                    </td>
                  </tr>
                )}
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
                      <div style={{display:'flex', flexDirection:'column', gap:'10px', alignItems:'center',marginLeft:'400px'}}>
                        <FiPhone /> Hotline: 0913 522 663
                        <FiMail /> Email: contact@mvductowel.com
                      </div>         
                    </footer>
                  </main>
        </div>
    );
};

export default QuoteRequestSale;