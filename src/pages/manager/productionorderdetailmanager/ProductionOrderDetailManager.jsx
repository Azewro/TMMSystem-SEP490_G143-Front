import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductionOrderDetailManager.css';

const BASE_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1";
const DIRECTOR_ID = 3;

const ProductionOrderDetailManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(""); // "approve" hoặc "reject"
  const [rejectionNotes, setRejectionNotes] = useState("");

  // 🟦 Gọi API lấy thông tin lệnh sản xuất
  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/production/orders/${id}`);
      if (!res.ok) throw new Error('Không thể tải thông tin lệnh sản xuất');
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi tải dữ liệu lệnh sản xuất");
    } finally {
      setLoading(false);
    }
  };

  // 🟨 Gọi API lấy chi tiết sản phẩm
  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${BASE_URL}/production/orders/${id}/details`);
      if (!res.ok) throw new Error('Không thể tải chi tiết lệnh sản xuất');
      const data = await res.json();
      setDetails(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchOrderDetails();
    }
  }, [id]);

  // 🟩 Hàm xử lý phê duyệt hoặc từ chối
  const handleConfirmAction = async () => {
    try {
      let url = "";
      if (confirmAction === "approve") {
        url = `${BASE_URL}/production/orders/${id}/approve?directorId=${DIRECTOR_ID}`;
      } else {
        const note = encodeURIComponent(rejectionNotes || "Không có lý do");
        url = `${BASE_URL}/production/orders/${id}/reject?directorId=${DIRECTOR_ID}&rejectionNotes=${note}`;
      }

      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Thao tác thất bại");

      alert(
        confirmAction === "approve"
          ? "✅ Đã phê duyệt lệnh sản xuất!"
          : "❌ Đã từ chối lệnh sản xuất!"
      );
      setConfirmAction("");
      setRejectionNotes("");
      fetchOrder(); // Cập nhật lại trạng thái mới
    } catch (err) {
      console.error(err);
      alert("❌ Có lỗi khi gửi yêu cầu!");
    }
  };

  return (
    <div className="production-page7">
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <>
          <h2 className="page-title7">
            Chi tiết Lệnh sản xuất {order?.poNumber || `PO-${id}`}
          </h2>

          <div className="order-info7">
            <div><strong>Mã hợp đồng:</strong> {order?.contractId || '---'}</div>
            <div>
              <strong>Ngày tạo lệnh:</strong>{' '}
              {order?.createdAt
                ? new Date(order.createdAt).toLocaleDateString('vi-VN')
                : '---'}
            </div>
            <div>
              <strong>Trạng thái:</strong>{' '}
              <span
                style={{
                  backgroundColor:
                    order?.status === 'PENDING_APPROVAL'
                      ? '#ffcc00'
                      : order?.status === 'APPROVED'
                      ? '#4caf50'
                      : '#f44336',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 'bold',
                }}
              >
                {order?.status || '---'}
              </span>
            </div>
          </div>

          {/* Bảng chi tiết */}
          <div className="production-section7">
            <div className="section-header7">Thông tin Lệnh sản xuất</div>

            {details.length > 0 ? (
              <table className="production-table7">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID Sản phẩm</th>
                    <th>Định mức BOM</th>
                    <th>Phiên bản BOM</th>
                    <th>Số lượng</th>
                    <th>Đơn vị</th>
                    <th>Ghi chú màu</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.productId}</td>
                      <td>{item.bomId}</td>
                      <td>{item.bomVersion}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td>{item.noteColor || '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#888', marginTop: '10px' }}>
                Không có chi tiết sản phẩm trong lệnh sản xuất.
              </p>
            )}
          </div>

          {/* Nút thao tác */}
          <div className="action-buttons7">
            <button
              className="approve-btn7"
              onClick={() => setConfirmAction("approve")}
              disabled={order?.status !== 'PENDING_APPROVAL'}
            >
              ✅ Phê duyệt
            </button>

            <button
              className="reject-btn7"
              onClick={() => setConfirmAction("reject")}
              disabled={order?.status !== 'PENDING_APPROVAL'}
            >
              ❌ Từ chối
            </button>

            <button
              className="cancel-btn7"
              onClick={() => navigate('/productionordermanager')}
            >
              ↩ Quay lại
            </button>
          </div>

          {/* Popup xác nhận */}
          {confirmAction && (
            <div className="popup-overlay7">
              <div className="confirm-popup7">
                <h3>
                  {confirmAction === "approve"
                    ? "Xác nhận phê duyệt lệnh sản xuất?"
                    : "Xác nhận từ chối lệnh sản xuất?"}
                </h3>

                {confirmAction === "reject" && (
                  <textarea
                    placeholder="Nhập lý do từ chối..."
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    className="reject-note7"
                  />
                )}

                <div className="popup-actions7">
                  <button onClick={handleConfirmAction} className="confirm-yes7">
                    Xác nhận
                  </button>
                  <button
                    onClick={() => {
                      setConfirmAction("");
                      setRejectionNotes("");
                    }}
                    className="confirm-cancel7"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductionOrderDetailManager;
