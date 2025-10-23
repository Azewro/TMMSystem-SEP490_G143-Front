import React, { useState, useEffect } from "react";
import "./OrderDetailManager.css";
import { useParams } from "react-router-dom";
const OrderDetailManager = () => {
  const [showContractPopup, setShowContractPopup] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [rejectionNote, setRejectionNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const { id } = useParams();

  // Hàm fetch chi tiết hợp đồng
  const fetchOrderDetail = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts/${id}/order-details`
      );
      console.log("data",response)
      if (!response.ok) throw new Error("Lỗi khi tải dữ liệu hợp đồng");
      const data = await response.json();
      setOrderDetail(data);
      console.log("data",data)
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = () => {
    fetchOrderDetail(id);
    setShowContractPopup(true);
  };

  // ✅ API phê duyệt hợp đồng
  const handleApprove = async () => {
    try {
      setProcessing(true);
      const response = await fetch(
        `https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts/${id}/approve?directorId=3`,
        { method: "POST", headers: { Accept: "*/*" } }
      );
      if (!response.ok) throw new Error("Phê duyệt thất bại!");
      alert("✅ Hợp đồng đã được phê duyệt!");
      setOrderDetail({ ...orderDetail, status: "APPROVED" });
      setShowContractPopup(false);
    } catch (err) {
      alert("❌ Lỗi khi phê duyệt: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ❌ API từ chối hợp đồng
  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      alert("Vui lòng nhập lý do từ chối!");
      return;
    }
    try {
      setProcessing(true);
      const response = await fetch(
        `https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts/${id}/reject?directorId=3&rejectionNotes=${encodeURIComponent(
          rejectionNote
        )}`,
        { method: "POST", headers: { Accept: "*/*" } }
      );
      if (!response.ok) throw new Error("Từ chối thất bại!");
      alert("❌ Hợp đồng đã bị từ chối!");
      setOrderDetail({ ...orderDetail, status: "REJECTED" });
      setShowContractPopup(false);
    } catch (err) {
      alert("Lỗi khi từ chối: " + err.message);
    } finally {
      setProcessing(false);
    }
  };
  

  return (
    <div className="order-detail-container">
      <div className="breadcrumb">
        <span>Đơn đặt hàng / </span>
        <span className="current">Chi tiết</span>
      </div>

      <h2 className="page-title">Chi tiết đơn đặt hàng</h2>

      <div className="top-section">
        {/* Thông tin khách hàng */}
        <div className="info-card">
          <div className="card-header blue-header">Thông tin khách hàng</div>
          <div className="card-body">
            <p>
              <b>Tên khách hàng:</b>{" "}
              {orderDetail?.customerInfo?.customerName || "Nguyễn Văn Hùng"}
            </p>
            <p>
              <b>SDT:</b>{" "}
              {orderDetail?.customerInfo?.phoneNumber || "0969792483"}
            </p>
            <p>
              <b>Công ty:</b>{" "}
              {orderDetail?.customerInfo?.companyName ||
                "Công ty Dệt Mỹ Đức"}
            </p>
            <p>
              <b>Mã thuế:</b>{" "}
              {orderDetail?.customerInfo?.taxCode || "02435520488"}
            </p>
            <p>
              <b>Địa chỉ:</b>{" "}
              {orderDetail?.customerInfo?.address ||
                "Lô N10 – 2 Cụm Sản Xuất Làng Nghề Tập Trung, Xã Tân Triều, Thanh Trì, Hà Nội"}
            </p>
          </div>
          <button className="btn-primary" onClick={handleViewContract}>
            📄 Xem hợp đồng
          </button>
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="info-card">
          <div className="card-header blue-header">Trạng thái đơn hàng</div>
          <div className="card-body">
            <p>
              <b>Trạng thái:</b>{" "}
              <span
                className={`status-badge ${
                  orderDetail?.status === "PENDING_APPROVAL"
                    ? "yellow"
                    : orderDetail?.status === "APPROVED"
                    ? "green"
                    : orderDetail?.status === "REJECTED"
                    ? "red"
                    : ""
                }`}
              >
                {orderDetail?.status || "Không xác định"}
              </span>
            </p>
            <p>
              <b>Ngày đơn hàng:</b> {orderDetail?.contractDate || "2025-10-19"}
            </p>
            <p>
              <b>Ngày giao hàng dự kiến:</b>{" "}
              {orderDetail?.deliveryDate || "2025-11-18"}
            </p>
          </div>
        </div>
      </div>

      {/* 🧾 Chi tiết đơn hàng */}
      <div className="info-card full-width">
        <div className="card-header blue-header">Chi tiết đơn hàng</div>
        <div className="card-body">
          <table className="order-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Kích thước</th>
                <th>Số lượng</th>
                <th>Giá (VND)</th>
                <th>Thành tiền (VND)</th>
              </tr>
            </thead>
            <tbody>
              {orderDetail?.orderItems && orderDetail.orderItems.length > 0 ? (
                orderDetail.orderItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.productName}</td>
                    <td>{item.productSize}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unitPrice.toLocaleString()}</td>
                    <td>{item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr>
                    <td>Khăn mặt Bamboo</td>
                    <td>35x50cm</td>
                    <td>160</td>
                    <td>13,000</td>
                    <td>2,080,000</td>
                  </tr>
                  <tr>
                    <td>Khăn tắm Cotton cao cấp</td>
                    <td>70x140cm</td>
                    <td>120</td>
                    <td>25,000</td>
                    <td>3,000,000</td>
                  </tr>
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="4">
                  <b>Tổng cộng:</b>
                </td>
                <td>
                  <b>
                    {orderDetail?.totalAmount?.toLocaleString() || "5,080,000"}{" "}
                    VND
                  </b>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="button-group">
        <a href="/ordermanager">
          <button className="btn-secondary">↩️ Quay lại</button>
        </a>
      </div>

      {/* Popup xem hợp đồng */}
      {showContractPopup && (
        <div className="popup-overlay4">
          <div className="popup-box4" style={{ width: "500px" }}>
            <h3 className="popup-title4">Xem Hợp Đồng</h3>
            <button
              className="popup-close4"
              onClick={() => setShowContractPopup(false)}
            >
              ×
            </button>

            <div className="popup-content4">
              {loading ? (
                <p>Đang tải dữ liệu...</p>
              ) : (
                <>
                  <div className="input-row4">
                    <label>Mã hợp đồng:</label>
                    <input
                      type="text"
                      value={orderDetail?.contractNumber || ""}
                      readOnly
                    />
                  </div>

                  <div className="input-row4">
  <label>Ảnh hợp đồng:</label>

  <button
    className="btn-primary"
    style={{
      marginTop: "10px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "8px 12px",
      cursor: "pointer",
    }}
    onClick={async () => {
      try {
        const response = await fetch(
          `https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts/${id}/download`,
          {
            method: "GET",
            headers: {
              Accept: "application/octet-stream",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Không thể tải hợp đồng");
        }

        // Chuyển response thành blob (file)
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Tạo thẻ <a> để tải file
        const link = document.createElement("a");
        link.href = url;
        link.download = `contract_${id}.png`;
        document.body.appendChild(link);
        link.click();

        // Dọn dẹp bộ nhớ
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        alert("❌ Lỗi khi tải hợp đồng: " + error.message);
      }
    }}
  >
    ⬇️ Tải hợp đồng
  </button>
</div>


                  <div className="input-row4">
                    <label>Lý do từ chối (nếu có):</label>
                    <textarea
                      placeholder="Nhập lý do nếu muốn từ chối..."
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "70px",
                        borderRadius: "8px",
                        padding: "8px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>

                  <div
                    className="popup-actions4"
                    style={{ justifyContent: "center" }}
                  >
                    <button
                      className="confirm-btn4"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      ✅ Phê duyệt
                    </button>
                    <button
                      className="reject-btn4"
                      onClick={handleReject}
                      disabled={processing}
                    >
                      ❌ Từ chối
                    </button>
                    <button
                      className="cancel-btn4"
                      onClick={() => setShowContractPopup(false)}
                    >
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailManager;
