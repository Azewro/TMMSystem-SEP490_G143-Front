import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./OrderDetailSale.css";

const BASE_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1";

const OrderDetailSale = () => {
  const { id } = useParams(); // ID hợp đồng
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("Hợp đồng đã ký");

  // ✅ Lấy thông tin người dùng (để lấy saleUserId)
  const user = JSON.parse(localStorage.getItem("user"));
  const saleUserId = user?.userId || 1;

  // ✅ Gọi API lấy chi tiết đơn hàng theo id hợp đồng
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/contracts/${id}`);
        setOrderDetail(res.data);
      } catch (error) {
        console.error("❌ Lỗi khi tải chi tiết đơn hàng:", error);
        alert("Không thể tải chi tiết hợp đồng!");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  // ✅ Chọn file upload
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // ✅ Hàm upload hợp đồng đã ký
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn file hợp đồng trước khi tải lên!");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn tải lên hợp đồng đã ký?")) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/contracts/${id}/upload-signed?notes=${notes}&saleUserId=${saleUserId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            // Nếu có JWT token thì thêm dòng dưới:
            // Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("✅ Tải lên hợp đồng thành công!");
      setShowModal(false);

      // Sau khi upload thành công → cập nhật trạng thái hợp đồng
      setOrderDetail((prev) => ({
        ...prev,
        status: "PENDING_APPROVAL",
        filePath: res.data?.filePath || prev.filePath,
      }));
    } catch (error) {
      console.error("❌ Lỗi upload hợp đồng:", error);
      alert("Tải lên hợp đồng thất bại!");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center" }}>Đang tải dữ liệu...</p>;
  }

  if (!orderDetail) {
    return <p style={{ textAlign: "center", color: "red" }}>Không tìm thấy dữ liệu đơn hàng!</p>;
  }

  const customer = orderDetail.customerInfo || {};
  const items = orderDetail.orderItems || [];

  return (
    <div className="order-detail-container">
      <div className="breadcrumb">
        <span>Đơn đặt hàng / </span>
        <span className="current">Chi tiết</span>
      </div>

      <h2 className="page-title">Chi tiết đơn đặt hàng</h2>

      <div className="top-section">
        <div className="info-card">
          <div className="card-header blue-header">Thông tin khách hàng</div>
          <div className="card-body">
            <p><b>Tên khách hàng:</b> {customer.customerName || "Chưa có"}</p>
            <p><b>SDT:</b> {customer.phoneNumber || "Chưa có"}</p>
            <p><b>Công ty:</b> {customer.companyName || "Chưa có"}</p>
            <p><b>Mã thuế:</b> {customer.taxCode || "Chưa có"}</p>
            <p><b>Địa chỉ:</b> {customer.address || "Chưa có"}</p>
          </div>
        </div>

        <div className="info-card">
          <div className="card-header blue-header">Trạng thái đơn hàng</div>
          <div className="card-body">
            <p>
              <b>Trạng thái:</b>{" "}
              <span className={`status-badge ${orderDetail.status?.toLowerCase()}`}>
                {orderDetail.status || "Không xác định"}
              </span>
            </p>
            <p><b>Ngày giao mong muốn:</b> {orderDetail.deliveryDate || "Chưa có"}</p>
            <p><b>Ngày thực giao:</b> {orderDetail.contractDate || "Chưa có"}</p>
          </div>
        </div>
      </div>

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
            <tbody >
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.standardDimensions || "-"}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unitPrice.toLocaleString("vi-VN")}</td>
                  <td>{item.totalPrice.toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
            
          </table>
          <tfoot>
              <tr className="total-row">
                <td colSpan="4">Tổng cộng:</td>
                <td>
                  <b>{orderDetail.totalAmount?.toLocaleString("vi-VN")} VND</b>
                </td>
              </tr>
            </tfoot>
        </div>
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          📄 Hợp đồng
        </button>
        <a href="/orderlistsale">
          <button className="btn-secondary">↩️ Quay lại</button>
        </a>
      </div>

      {/* ✅ Modal upload hợp đồng */}
      {showModal && (
        <div className="modal-overlay6">
          <div className="modal6">
            <div className="modal-header6">
              <h3>📎 Thêm Hợp Đồng</h3>
              <button className="close-btn6" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body6">
              <div className="form-group6">
                <label>Mã hợp đồng</label>
                <input type="text" value={orderDetail.contractNumber} readOnly />
              </div>

              

              <div className="form-group6">
                <label>File hợp đồng</label>
                <input type="file" onChange={handleFileChange} />
                {selectedFile ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Hợp đồng xem trước"
                    className="preview-img" style={{ maxWidth: "200px", marginTop: "10px" }}
                  />
                ) : (
                  <div className="no-image6">Chưa có ảnh được chọn</div>
                )}
              </div>

              <p className="note6">
                🔴 Lưu ý: Hợp đồng sau khi được duyệt sẽ không thể chỉnh sửa.
              </p>
            </div>

            <div className="modal-footer6">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Đóng
              </button>
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Đang tải lên..." : "📤 Tải lên"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailSale;
