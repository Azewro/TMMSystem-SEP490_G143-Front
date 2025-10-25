import React, { useEffect, useState } from 'react';
import './OrderDetail.css';

const OrderDetail = () => {
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contractInfo, setContractInfo] = useState(null);

  
  const queryParams = new URLSearchParams(window.location.search);
  const id = queryParams.get("id");

 
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const response = await fetch(`https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts/${id}/order-details`);
        if (!response.ok) throw new Error("Không thể tải chi tiết đơn hàng");
        const data = await response.json();
        setOrderDetail(data);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    
    const fetchContractInfo = async () => {
      try {
        const response = await fetch(`https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts/${id}`);
        if (!response.ok) throw new Error("Không thể tải thông tin hợp đồng");
        const data = await response.json();
        setContractInfo(data);
      } catch (error) {
        console.error("Lỗi khi tải thông tin hợp đồng:", error);
      }
    };

    if (id) {
      fetchOrderDetail();
      fetchContractInfo();
    }
  }, [id]);

  
  const formatCurrency = (amount) => {
    return amount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '0 ₫';
  };

  return (
    <div className="order-detail-page">
      <div className="order-header">
        <div className="order-info">
          <h2>
            Đơn hàng <span className="order-id">#{contractInfo?.contractNumber || "..."}</span>
          </h2>
          <p>
            <strong>📅 Ngày tạo:</strong>{" "}
            {contractInfo ? new Date(contractInfo.contractDate).toLocaleDateString('vi-VN') : "..."}
          </p>
          <p>
            <strong>📦 Trạng thái:</strong>{" "}
            <span className={`status-badge ${
              contractInfo?.status === "APPROVED"
                ? "approved"
                : contractInfo?.status === "DRAFT"
                ? "draft"
                : "pending"
            }`}>
              {contractInfo?.status === "APPROVED"
                ? "Đã duyệt"
                : contractInfo?.status === "DRAFT"
                ? "Nháp"
                : "Chờ duyệt"}
            </span>
          </p>
          <p>
            <strong>🚚 Ngày giao:</strong>{" "}
            {contractInfo ? new Date(contractInfo.deliveryDate).toLocaleDateString('vi-VN') : "..."}
          </p>
        </div>

        <div className="order-actions">
          <button className="btn-contract">Hợp đồng</button>
          <a href='/order'><button className="btn-back">↩ Quay lại</button></a>
        </div>
      </div>

      <div className="order-body">
        <h3 className="section-title">Chi tiết đơn hàng</h3>

        {loading ? (
          <p style={{ textAlign: "center" }}>Đang tải dữ liệu...</p>
        ) : (
          <>
            <div className="order-summary">
              <p>
                <strong>Tổng cộng:</strong>{" "}
                <span className="total-amount">
                  {formatCurrency(contractInfo?.totalAmount)}
                </span>
              </p>
            </div>

            <table className="order-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Kích thước</th>
                  <th>Số lượng</th>
                  <th>Đơn giá (VND)</th>
                  <th>Thành tiền (VND)</th>
                </tr>
              </thead>
              <tbody>
                {orderDetail && orderDetail.length > 0 ? (
                  orderDetail.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.size || "—"}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Không có sản phẩm nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="process-section">
              <div className="process-item">
                <div className="process-icon success">✔</div>
                <h4>Cuộn mác</h4>
                <span className="status-step">Chưa bắt đầu</span>
              </div>

              <div className="process-item">
                <div className="process-icon success">✔</div>
                <h4>Dệt</h4>
                <span className="status-step">Chưa bắt đầu</span>
              </div>

              <div className="process-item">
                <div className="process-icon success">✔</div>
                <h4>Cắt</h4>
                <span className="status-step">Chưa bắt đầu</span>
              </div>

              <div className="process-item">
                <div className="process-icon success">✔</div>
                <h4>May</h4>
                <span className="status-step">Chưa bắt đầu</span>
              </div>

              <div className="process-item">
                <div className="process-icon success">✔</div>
                <h4>Đóng gói</h4>
                <span className="status-step">Chưa bắt đầu</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
