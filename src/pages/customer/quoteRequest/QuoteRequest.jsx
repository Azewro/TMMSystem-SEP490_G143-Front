import React, { useState,useEffect } from 'react';
import './QuoteRequest.css';
import { FaUser } from "react-icons/fa";
import { getAllRFQs } from '../../../services/rfqApi';

// import ProfilePopup from "../../../components/ProfilePopup/ProfilePopup";
const QuoteRequest = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [showQuotePopup, setShowQuotePopup] = useState(false);
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
      const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const data = await getAllRFQs();
        setRfqs(data);
      } catch (error) {
        console.error("Không thể tải RFQs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRFQs();
  }, []);
    return (
         <div className="quote-page-container">
      <aside className="sidebar2">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <ul className="menu2">
          <a href="/home" style={{ textDecoration: "none" }}>
            <li>Sản phẩm</li>
          </a>
          <li className="active">Yêu cầu báo giá</li>
          <a href="/order" style={{ textDecoration: "none" }}>
            <li>Đơn hàng</li>
          </a>
          <li>Khách hàng</li>
        </ul>
      </aside>

      <div className="main-content2">
        <div className="page-header">
          <h2>Danh sách yêu cầu báo giá</h2>
          <a href="/createquote">
            <button className="create-btn">+ Tạo yêu cầu báo giá mới</button>
          </a>
        </div>

        <div className="quote-list">
          {rfqs.length === 0 ? (
            <p style={{ textAlign: "center" }}>Không có yêu cầu báo giá nào.</p>
          ) : (
            rfqs.map((rfq, index) => (
              <div className="quote-card" key={rfq.id}>
                <div className="quote-info">
                  <span>
                    <strong>{index + 1}</strong>
                  </span>
                  <span>
                    <strong>Mã RFQ:</strong> {rfq.rfqNumber}
                  </span>
                  <span>
                    <strong>Khách hàng ID:</strong> {rfq.customerId}
                  </span>
                  <span>
                    <strong>Ngày tạo:</strong>{" "}
                    {new Date(rfq.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  <span>
                    <strong>Trạng thái:</strong>{" "}
                    <span
                      className={
                        rfq.status?.toLowerCase() === "approved"
                          ? "approved"
                          : "pending"
                      }
                    >
                      {rfq.status || "Đang chờ"}
                    </span>
                  </span>
                  <button
                    className="action-btn"
                    onClick={() => setShowQuotePopup(true)}
                  >
                    Xem chi tiết
                  </button>
                </div>

                {/* ✅ Nếu có chi tiết sản phẩm */}
                {rfq.details && rfq.details.length > 0 && (
                  <table className="quote-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>ID sản phẩm</th>
                        <th>Số lượng</th>
                        <th>Đơn vị</th>
                        <th>Màu sắc</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.details.map((d, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{d.productId}</td>
                          <td>{d.quantity}</td>
                          <td>{d.unit}</td>
                          <td>{d.noteColor}</td>
                          <td>{d.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="quote-footer">
                  <p>
                    <strong>Ngày giao dự kiến:</strong>{" "}
                    {new Date(
                      rfq.expectedDeliveryDate
                    ).toLocaleDateString("vi-VN")}
                  </p>
                  <button
                    className="add-product"
                    onClick={() => setShowPopup(true)}
                  >
                    + Thêm sản phẩm
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Thêm sản phẩm vào lô hàng</h3>

            <label>Sản phẩm</label>
            <select>
              <option>Chọn sản phẩm</option>
              <option>Sản phẩm A</option>
              <option>Sản phẩm B</option>
            </select>

            <label>Kích thước</label>
            <select>
              <option>Chọn kích thước</option>
              <option>10x20cm</option>
              <option>15x25cm</option>
            </select>

            <label>Số lượng</label>
            <input type="number" placeholder="Nhập số lượng" />

            <div className="popup-buttons">
              <button className="cancel-btn" onClick={() => setShowPopup(false)}>Hủy</button>
              <button className="save-btn">Lưu sản phẩm</button>
            </div>
          </div>
        </div>
      )}
      {showQuotePopup && (
        <div className="popup-overlay2">
          <div className="quote-popup">
            <h2 className="popup-title">Báo Giá Lô Hàng Mã RFQ-102</h2>
            <hr className="popup-divider" />

            <div className="popup-section">
              <p><strong>Trạng thái:</strong> <span className="status-pending">Chưa đồng ý</span></p>
              <p><strong>Ngày giao hàng dự kiến:</strong> <span>29/05/2025</span></p>
            </div>

            <table className="popup-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Kích thước</th>
                  <th>Số lượng (Cái)</th>
                  <th>Đơn giá (VND)</th>
                  <th>Tổng tiền</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Khăn mặt Bambo</td>
                  <td>Tơ 150D-5000m</td>
                  <td>200</td>
                  <td>13,000</td>
                  <td>13,000</td>
                  <td>Đồng/cái <br/> Chưa tính thuế</td>
                </tr>
              </tbody>
            </table>

            <div className="popup-buttons2">
              <button className="agree-btn" onClick={() => setShowConfirmPopup("approve")}>Đồng ý</button>
              <button className="disagree-btn" onClick={() => {
          setShowConfirmPopup("reject");
        }}>Không đồng ý</button>
              <button className="back-btn" onClick={() => setShowQuotePopup(false)}>↩ Quay lại</button>
            </div>
          </div>
        </div>
      )}
      {showConfirmPopup && (
      <div className="popup-overlay-confirm">
        <div className="confirm-popup">
          <div className={`confirm-icon ${showConfirmPopup === "approve" ? "success" : "error"}`}>
            {showConfirmPopup === "approve" ? "✔" : "✖"}
          </div>
          <h3>
            {showConfirmPopup === "approve"
              ? "Xác nhận báo giá"
              : "Xác nhận hủy đơn báo giá"}
          </h3>
          <p>Hành động này không thể hoàn tác!</p>
          <div className="confirm-buttons">
            <button className="confirm-yes">Đồng ý</button>
            <button
              className={`confirm-cancel ${showConfirmPopup === "reject" ? "blue" : ""}`}
              onClick={() => setShowConfirmPopup(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default QuoteRequest;