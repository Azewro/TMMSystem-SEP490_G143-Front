import React, { useState, useEffect } from "react";
import "./QuoteRequest.css";
import { getAllRFQs, addRFQDetail } from "../../../services/rfqApi";
import { getAllProducts } from "../../../services/productApi";
import axios from "axios";

const BASE_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1";

const QuoteRequest = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    unit: "",
    noteColor: "",
    notes: "",
  });

 
  const [showQuotePopup, setShowQuotePopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(""); 
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [quotationData, setQuotationData] = useState([]); 

  const customerId = 2; 


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


  const openAddProductPopup = async (rfqId) => {
    try {
      const productList = await getAllProducts();
      setProducts(productList);
      setSelectedRFQ(rfqId);
      setShowPopup(true);
    } catch (error) {
      console.error("Không thể tải sản phẩm:", error);
    }
  };

 
  const openQuotePopup = async (rfqId) => {
    try {
      setShowQuotePopup(true);
      const res = await axios.get(`${BASE_URL}/quotations/customer/${customerId}`);
      const quotes = res.data || [];
      const foundQuote = quotes.find((q) => q.rfqId === rfqId);

      if (!foundQuote) {
        alert("Không tìm thấy báo giá cho RFQ này!");
        setShowQuotePopup(false);
        return;
      }

      setSelectedQuotationId(foundQuote.id);
      setQuotationData(foundQuote);
    } catch (error) {
      console.error("Lỗi tải báo giá:", error);
      alert("❌ Không thể tải báo giá!");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleAddProduct = async () => {
    if (!formData.productId || !formData.quantity) {
      alert("Vui lòng chọn sản phẩm và nhập số lượng");
      return;
    }

    try {
      await addRFQDetail(selectedRFQ, {
        id: 0,
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        unit: formData.unit || "cái",
        noteColor: formData.noteColor || "",
        notes: formData.notes || "",
      });

      alert("Thêm sản phẩm thành công!");
      setShowPopup(false);
      setFormData({ productId: "", quantity: "", unit: "", noteColor: "", notes: "" });

      const updated = await getAllRFQs();
      setRfqs(updated);
    } catch (error) {
      alert("Thêm sản phẩm thất bại!");
      console.error(error);
    }
  };

 
  const handleConfirmQuote = async () => {
    if (!selectedQuotationId) return;

    try {
      const endpoint =
        showConfirmPopup === "approve"
          ? `${BASE_URL}/quotations/${selectedQuotationId}/approve`
          : `${BASE_URL}/quotations/${selectedQuotationId}/reject`;

      await axios.post(endpoint);
      alert(
        showConfirmPopup === "approve"
          ? "✅ Duyệt báo giá thành công!"
          : "❌ Báo giá đã bị từ chối!"
      );

      setShowConfirmPopup("");
      setShowQuotePopup(false);
    } catch (error) {
      console.error("Lỗi xác nhận báo giá:", error);
      alert("❌ Xác nhận thất bại!");
    }
  };

  if (loading) return <p>Đang tải...</p>;

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
      </ul>
    </aside>

    <div className="main-content2">
      <div className="page-header">
        <h2>Danh sách yêu cầu báo giá</h2>
      </div>

      <div className="quote-list">
        {rfqs.length === 0 ? (
          <p style={{ textAlign: "center" }}>Không có yêu cầu báo giá nào.</p>
        ) : (
          rfqs.map((rfq, index) => (
            <div className="quote-card" key={rfq.id}>
              <div className="quote-info">
                <span><strong>{index + 1}</strong></span>
                <span><strong>Mã RFQ:</strong> {rfq.rfqNumber}</span>
                <span><strong>Khách hàng ID:</strong> {rfq.customerId}</span>
                <span><strong>Ngày tạo:</strong> {new Date(rfq.createdAt).toLocaleDateString("vi-VN")}</span>
                <span><strong>Trạng thái:</strong> {rfq.status || "Pending"}</span>
              </div>

              {/* ✅ Thêm lại phần hiển thị danh sách sản phẩm của RFQ */}
              {rfq.details && rfq.details.length > 0 ? (
                <div className="rfq-detail-section">
                  <table className="rfq-detail-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Số lượng</th>
                        
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.details.map((item, i) => (
                        <tr key={i}>
                          <td>{item.productName || `SP-${item.productId}`}</td>
                          <td>{item.quantity}</td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-products">Chưa có sản phẩm nào trong yêu cầu này.</p>
              )}

              <div className="quote-footer">
                <button className="add-product" onClick={() => openAddProductPopup(rfq.id)}>
                  + Thêm sản phẩm
                </button>
                <button className="view-quote" onClick={() => openQuotePopup(rfq.id)}>
                  📄 Xem báo giá
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

   
      {showQuotePopup && quotationData && (
        <div className="popup-overlay2">
          <div className="quote-popup">
            <h2 className="popup-title">Báo Giá #{quotationData.id}</h2>
            <hr className="popup-divider" />
            <div className="popup-section">
              <p><strong>Trạng thái:</strong> <span>{quotationData.status}</span></p>
              <p><strong>Ngày tạo:</strong> {new Date(quotationData.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>

            {quotationData.details && quotationData.details.length > 0 ? (
              <table className="popup-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationData.details.map((d, i) => (
                    <tr key={i}>
                      <td>{d.productName || `SP-${d.productId}`}</td>
                      <td>{d.quantity}</td>
                      <td>{d.unitPrice?.toLocaleString("vi-VN")} ₫</td>
                      <td>{d.totalPrice?.toLocaleString("vi-VN")} ₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Không có chi tiết báo giá.</p>
            )}

            <div className="popup-buttons2">
              <button className="agree-btn" onClick={() => setShowConfirmPopup("approve")}>
                Đồng ý
              </button>
              <button className="disagree-btn" onClick={() => setShowConfirmPopup("reject")}>
                Không đồng ý
              </button>
              <button className="back-btn" onClick={() => setShowQuotePopup(false)}>
                ↩ Quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
  <div className="popup-overlay2">
    <div className="quote-popup">
      <h2 className="popup-title">Thêm sản phẩm vào RFQ</h2>
      <hr className="popup-divider" />

      <div className="popup-section">
        <label>Sản phẩm:</label>
        <select
          name="productId"
          value={formData.productId}
          onChange={handleChange}
        >
          <option value="">-- Chọn sản phẩm --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label>Số lượng:</label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
        />
        <div className="popup-buttons2">
          <button className="agree-btn" onClick={handleAddProduct}>
            💾 Lưu sản phẩm
          </button>
          <button
            className="back-btn"
            onClick={() => setShowPopup(false)}
          >
            ↩ Quay lại
          </button>
        </div>
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
            <h3>{showConfirmPopup === "approve" ? "Xác nhận duyệt báo giá" : "Xác nhận hủy báo giá"}</h3>
            <p>Hành động này không thể hoàn tác!</p>
            <div className="confirm-buttons">
              <button className="confirm-yes" onClick={handleConfirmQuote}>Đồng ý</button>
              <button className="confirm-cancel" onClick={() => setShowConfirmPopup("")}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteRequest;
