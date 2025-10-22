import React, { useState, useEffect } from "react";
import "./QuoteRequestDetailSale.css";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { getRFQDetails } from "../../../services/rfqApi";

const BASE_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1";

const QuoteRequestDetailSale = () => {
  const { id } = useParams();
  const [rfqDetails, setRfqDetails] = useState([]);
  const [rfqInfo, setRfqInfo] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [message, setMessage] = useState("");

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        
        const details = await getRFQDetails(id);
        setRfqDetails(details);

       
        const res = await axios.get(`${BASE_URL}/rfqs/${id}`);
        setRfqInfo(res.data);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết RFQ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  
  const handleSendRFQ = async () => {
    try {
      await axios.post(`${BASE_URL}/rfqs/${id}/send`);
      setRfqInfo((prev) => ({ ...prev, status: "Sent" }));
      setMessage("✅ Gửi RFQ thành công!");
    } catch (error) {
      console.error("Lỗi khi gửi RFQ:", error);
      setMessage("❌ Gửi RFQ thất bại!");
    } finally {
      setShowPopup(false);
    }
  };

  
  const handlePreliminaryCheck = async () => {
    try {
      await axios.post(`${BASE_URL}/rfqs/${id}/preliminary-check`);
      setRfqInfo((prev) => ({ ...prev, status: "Preliminary Checked" }));
      setMessage("✅ Kiểm tra sơ bộ thành công!");
    } catch (error) {
      console.error("Lỗi khi kiểm tra sơ bộ:", error);
      setMessage("❌ Kiểm tra sơ bộ thất bại!");
    } finally {
      setShowPopup(false);
    }
  };
const handleForwardToPlanning = async () => {
  try {
    await axios.post(`${BASE_URL}/rfqs/${id}/forward-to-planning`);
    setRfqInfo((prev) => ({ ...prev, status: "FORWARDED_TO_PLANNING" }));
    setMessage("✅ Đã chuyển sang phòng kế hoạch thành công!");
  } catch (error) {
    console.error("Lỗi khi chuyển sang phòng kế hoạch:", error);
    setMessage("❌ Chuyển sang phòng kế hoạch thất bại!");
  } finally {
    setShowPopup(false);
  }
};

 const handleConfirm = () => {
  if (popupType === "send") handleSendRFQ();
  if (popupType === "check") handlePreliminaryCheck();
  if (popupType === "forward") handleForwardToPlanning();
};

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (!rfqInfo) return <div>Không tìm thấy thông tin RFQ</div>;

  return (
    <div className="quote-detail-container">
      <h2 className="page-title">Chi tiết Yêu cầu Báo giá</h2>

      
      <div className="info-section2">
         
        <div className="info-card2"> 
            <h3 className="info-title2">Thông tin khách hàng</h3> 
            <p><b>Tên khách hàng:</b> Nguyễn Văn A</p> 
            <p><b>Công ty:</b> Công ty TNHH ABC</p> 
            <p><b>Email:</b> nguyenvana@abc.com</p> 
            <p><b>Điện thoại:</b> 0901234567</p> 
            <p><b>Mã số thuế:</b> 0123456789</p> 
        </div>
        
        <div className="info-card2">
          <h3 className="info-title2">Thông tin RFQ</h3>
          <p><b>Mã RFQ:</b> {rfqInfo.rfqNumber}</p>
          <p><b>Trạng thái:</b> {rfqInfo.status}</p>
          <p><b>Ngày giao dự kiến:</b> {rfqInfo.expectedDeliveryDate}</p>
          <p><b>Ghi chú:</b> {rfqInfo.notes || "-"}</p>
          <p><b>Số lượng sản phẩm:</b> {rfqDetails.length}</p>
        </div>
      </div>

      
      <div className="product-list2">
        <h3 className="product-title2">Danh sách sản phẩm</h3>
        <table className="product-table2">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã sản phẩm</th>
              <th>Số lượng</th>
              <th>Kích thước</th>
              <th>Sản Phẩm</th>
              
            </tr>
          </thead>
          <tbody>
            {rfqDetails.length > 0 ? (
              rfqDetails.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td>{item.productId}</td>
                  <td>{item.quantity}</td>
                  <td>{item.standardDimensions}</td>
                  <td>{item.name}</td>
                  
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  Không có sản phẩm nào trong yêu cầu báo giá.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      
      <div className="action-buttons">
        <Link to="/quoterequestsale">
          <button className="back-btn">← Quay lại danh sách</button>
        </Link>

        {rfqInfo.status === "DRAFT" && (
          <button
            className="send-btn"
            onClick={() => {
              setPopupType("send");
              setShowPopup(true);
            }}
          >
            Gửi RFQ
          </button>
        )}

        {rfqInfo.status === "Sent" && (
          <button
            className="check-btn"
            onClick={() => {
              setPopupType("check");
              setShowPopup(true);
            }}
          >
            Kiểm tra sơ bộ
          </button>
        )}
        {rfqInfo.status === "Preliminary Checked" && (
    <button
      className="forward-btn"
      onClick={() => {
        setPopupType("forward");
        setShowPopup(true);
      }}
    >
      Chuyển sang phòng kế hoạch
    </button>
  )}
      </div>

      
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
            <h3 className="popup-title">
  {popupType === "send"
    ? "Xác nhận gửi RFQ"
    : popupType === "check"
    ? "Xác nhận kiểm tra sơ bộ"
    : "Xác nhận chuyển sang phòng kế hoạch"}
</h3>
            <p className="popup-text">
  {popupType === "send"
    ? "Bạn có chắc chắn muốn gửi RFQ này không?"
    : popupType === "check"
    ? "Bạn có chắc chắn muốn kiểm tra sơ bộ RFQ này không?"
    : "Bạn có chắc chắn muốn chuyển RFQ này sang phòng kế hoạch không?"}
</p>
            <div className="popup-actions">
              <button className="popup-cancel" onClick={() => setShowPopup(false)}>Hủy</button>
              <button className="popup-confirm" onClick={handleConfirm}>
  {popupType === "send"
    ? "Gửi"
    : popupType === "check"
    ? "Kiểm tra"
    : "Chuyển"}
</button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="message-box">{message}</div>}
    </div>
  );
};

export default QuoteRequestDetailSale;
