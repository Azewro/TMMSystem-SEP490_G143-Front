import React, { useEffect, useState } from "react";
import "./QuoteDetailSale.css";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const BASE_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1";

const QuoteDetailSale = () => {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/quotations`);
        const found = res.data.find((q) => q.id === parseInt(id));
        setQuotation(found);
      } catch (error) {
        console.error("❌ Lỗi khi tải chi tiết báo giá:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [id]);

  const handleSendQuotation = async () => {
    try {
      await axios.post(`${BASE_URL}/quotations/${id}/send-to-customer`);
      setMessage("✅ Đã gửi báo giá cho khách hàng thành công!");
    } catch (error) {
      console.error("❌ Lỗi khi gửi báo giá:", error);
      setMessage("❌ Gửi báo giá thất bại!");
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (!quotation) return <div>Không tìm thấy báo giá.</div>;

  return (
    <div className="quote-container">
      <h2 className="quote-title">Chi tiết báo giá</h2>

      <div className="quote-status" style={{ marginLeft: '150px' }}>
        <span className="status-label">Trạng thái:</span>
        <span className="status-pill">{quotation.status}</span>
      </div>

      
      <div className="quote-date">
        <span>Ngày giao hàng dự kiến:</span> <b>{quotation.expectedDeliveryDate}</b>
      </div>
      
      

      <div className="table-wrapper">
        <table className="quote-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Sản phẩm ID</th>
              <th>Số lượng</th>
              <th>Đơn vị</th>
              <th>Đơn giá (VND)</th>
              <th>Tổng tiền (VND)</th>
              
            </tr>
          </thead>
          <tbody>
            {quotation.details?.map((d, index) => (
              <tr key={d.id}>
                <td>{index + 1}</td>
                <td>{d.productId}</td>
                <td>{d.quantity}</td>
                <td>{d.unit}</td>
                <td>{d.unitPrice.toLocaleString("vi-VN")}</td>
                <td>{d.totalPrice.toLocaleString("vi-VN")}</td>
                <td>Đồng/cái Chưa bao gồm thuế</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="quote-buttons">
        <Link to="/quotesale">
          <button className="btn btn-back">↩ Quay lại</button>
        </Link>
        <button className="btn btn-send" onClick={handleSendQuotation}>
          📤 Gửi báo giá
        </button>
      </div>

      {message && <div className="message-box">{message}</div>}
    </div>
  );
};

export default QuoteDetailSale;
