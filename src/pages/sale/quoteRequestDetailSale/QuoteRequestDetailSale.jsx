import React, { useState,useEffect } from 'react';
import './QuoteRequestDetailSale.css';
import { useParams, Link } from "react-router-dom";
import { getRFQDetails } from '../../../services/rfqApi';
const QuoteRequestDetailSale = () => {
     const { rfqId  } = useParams(); // ví dụ URL: /quotedetailsale/1760752582677
  const [rfqDetails, setRfqDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
   

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getRFQDetails(rfqId );
        setRfqDetails(data);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết RFQ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [rfqId ]);

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

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
          <p><b>Mã RFQ:</b> {rfqId }</p>
          <p><b>Ngày tạo:</b> 13/10/2025</p>
          <p><b>Trạng thái:</b> pending</p>
          <p><b>Ngày mong muốn nhận:</b> 20/10/2025</p>
          <p><b>Số lượng sản phẩm:</b> {rfqDetails.length}</p>
        </div>
      </div>

      <div className="product-list2">
        <h3 className="product-title2">Danh sách sản phẩm</h3>
        <table className="product-table2">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã đơn hàng</th>
              <th>Sản phẩm</th>
              <th>Kích thước</th>
              <th>Số lượng</th>
            </tr>
          </thead>
          <tbody>
{rfqDetails.length > 0 ? (
              rfqDetails.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td>{item.productId}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>{item.noteColor || '-'}</td>
                  <td>{item.notes || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">Không có sản phẩm nào trong yêu cầu báo giá.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="action-buttons">
        <a href='/quoterequestsale'><button className="back-btn">← Quay lại danh sách</button></a>
        <button className="send-btn" onClick={() => setShowPopup(true)}>Gửi RFQ</button>
      </div>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
            <h3 className="popup-title">Xác nhận gửi RFQ</h3>
            <p className="popup-text">Bạn có chắc chắn muốn gửi RFQ này không?</p>
            <div className="popup-actions">
              <button className="popup-cancel" onClick={() => setShowPopup(false)}>Hủy</button>
              <button className="popup-confirm">Gửi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteRequestDetailSale;