import React, { useEffect, useState } from "react";
import "./QuoteRequestplanRoom.css";
import { FiPhone, FiMail } from "react-icons/fi";
import { getAllRFQs } from "../../../services/rfqApi"; // <-- import hàm gọi API
import { Link } from "react-router-dom";

const QuoteRequestplanRoom = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const data = await getAllRFQs();

        
        const filtered = data.filter(
          (rfq) => rfq.status === "FORWARDED_TO_PLANNING"|| rfq.status === "RECEIVED_BY_PLANNING"
        );

        setRfqs(filtered);
      } catch (error) {
        console.error("Lỗi khi tải danh sách RFQ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRFQs();
  }, []);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div className="quote-page-container">
     
      <aside className="sidebar2">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <ul className="menu2">
          <li className="active">Yêu cầu báo giá</li>
          <a href="/orderlistplanRoom" style={{ textDecoration: "none" }}>
            <li>Đơn hàng</li>
          </a>
          <a href="/productionorderplan" style={{ textDecoration: "none" }}>
            <li>Lệnh sản xuất</li>
          </a>
          <li>Giải pháp rủi ro</li>
          <li>Ảnh hưởng giao hàng</li>
        </ul>
      </aside>

      
      <main className="main-content2">
        <section className="product-section" style={{ marginBottom: "50px" }}>
          <h2>Danh sách yêu cầu báo giá (Phòng kế hoạch)</h2>

          
          <div className="filter" style={{ marginBottom: "30px" }}>
            <select>
              <option>Tất cả trạng thái</option>
              <option>FORWARDED_TO_PLANNING</option>
            </select>
          </div>

          
          <table className="quote-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã RFQ</th>
                <th>Ngày tạo</th>
                <th>Ngày giao dự kiến</th>
                <th>Số lượng sản phẩm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.length > 0 ? (
                rfqs.map((rfq, index) => (
                  <tr key={rfq.id}>
                    <td>{index + 1}</td>
                    <td>{rfq.rfqNumber}</td>
                    <td>{new Date(rfq.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      {rfq.expectedDeliveryDate
                        ? new Date(rfq.expectedDeliveryDate).toLocaleDateString("vi-VN")
                        : "-"}
                    </td>
                    <td>{rfq.details?.length || 0}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          rfq.status === "FORWARDED_TO_PLANNING"
                            ? "status-forwarded"
                            : ""
                        }`}
                      >
                        {rfq.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/quoterequestdetailplan/${rfq.id}`}>
                        <button>
                          <span role="img" aria-label="eye">
                            👁️
                          </span>{" "}
                          Xem
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Không có yêu cầu báo giá nào được chuyển sang phòng kế hoạch.
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

export default QuoteRequestplanRoom;
