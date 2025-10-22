import React, { useState, useEffect } from 'react';
import './OrderDetailplanRoom.css';

const OrderDetailplanRoom = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showContractPopup, setShowContractPopup] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contractId, setContractId] = useState(2); // 👈 ID hợp đồng cần xem
  const [orderItems, setOrderItems] = useState([]);

  // 🟩 trạng thái hiển thị sau khi tạo lệnh
  const [orderStatus, setOrderStatus] = useState('Đang chờ phê duyệt');
  const [creating, setCreating] = useState(false);
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // 🟦 Hàm gọi API lấy chi tiết đơn hàng theo ID hợp đồng
  const fetchOrderDetail = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts/${id}/order-details`
      );
      if (!res.ok) throw new Error('Không thể tải dữ liệu đơn hàng!');
      const data = await res.json();
      setOrderDetail(data);

      // Nếu API trả danh sách sản phẩm, gán vào state
      if (Array.isArray(data?.orderDetails)) {
        setOrderItems(data.orderDetails);
      } else if (Array.isArray(data)) {
        setOrderItems(data);
      } else {
        setOrderItems([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 🟨 Gọi API khi mở trang
  useEffect(() => {
    fetchOrderDetail(contractId);
  }, [contractId]);

  const handleViewContract = () => {
    setShowContractPopup(true);
  };

  // 🧾 Hàm gọi API tạo lệnh sản xuất từ hợp đồng
  const handleCreateProductionOrder = async () => {
    if (!plannedStartDate || !plannedEndDate) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc!');
      return;
    }

    try {
      setCreating(true);
      const planningUserId = 4;

      const url = `https://tmmsystem-sep490g143-production.up.railway.app/v1/production/orders/create-from-contract?contractId=${contractId}&planningUserId=${planningUserId}&plannedStartDate=${plannedStartDate}&plannedEndDate=${plannedEndDate}&notes=${encodeURIComponent(notes)}`;

      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Tạo lệnh sản xuất thất bại!');

      const data = await res.json();
      console.log('✅ Lệnh sản xuất đã tạo:', data);

      // cập nhật trạng thái hiển thị
      setOrderStatus('PENDING_APPROVAL');
      setShowPopup(false);
      alert('🎉 Tạo lệnh sản xuất thành công! Trạng thái: PENDING_APPROVAL');
    } catch (error) {
      console.error('❌ Lỗi khi tạo lệnh sản xuất:', error);
      alert('Tạo lệnh thất bại, vui lòng thử lại!');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="order-detail-container">
      <div className="breadcrumb">
        <span>Đơn đặt hàng /</span> <span className="current">Chi tiết</span>
      </div>

      <h2 className="page-title">Chi tiết đơn đặt hàng</h2>

      {/* --- Phần thông tin --- */}
      <div className="info-section">
        <div className="info-card">
          <div className="card-header">Thông tin khách hàng</div>
          <div className="card-body">
            <p><b>Tên khách hàng:</b> {orderDetail?.customerName || 'Nguyễn Văn Hùng'}</p>
            <p><b>SDT:</b> {orderDetail?.customerPhone || '0969792483'}</p>
            <p><b>Công ty:</b> {orderDetail?.companyName || 'Công ty Dệt Mỹ Đức'}</p>
            <p><b>Mã thuế:</b> {orderDetail?.taxCode || '02435520488'}</p>
            <p><b>Địa chỉ:</b> {orderDetail?.address || 'Lô N10 – 2 Cụm Sản Xuất Làng Nghề Tập Trung, Xã Tân Triều, Thanh Trì, Hà Nội'}</p>
            <button style={{ background: 'blue', color: '#fff', borderRadius: '10px' }} onClick={handleViewContract}>
              Xem hợp đồng
            </button>
          </div>
        </div>

        <div className="info-card">
          <div className="card-header">Trạng thái đơn hàng</div>
          <div className="card-body">
            <p>
              <b>Trạng thái:</b>{" "}
              <span className="status-badge yellow">
                {orderStatus}
              </span>
            </p>
            <p><b>Ngày giao mong muốn:</b> {orderDetail?.desiredDeliveryDate || '02/05/2025'}</p>
            <p><b>Ngày giao hàng dự kiến:</b> {orderDetail?.expectedDeliveryDate || '30/05/2025'}</p>
          </div>
        </div>
      </div>

      {/* --- Chi tiết đơn hàng (lấy từ API) --- */}
      <div className="order-detail-section">
        <div className="card-header">Chi tiết đơn hàng</div>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : orderItems.length > 0 ? (
          <table className="order-table2">
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Kích thước</th>
                <th>Số lượng</th>
                <th>Giá (VNĐ)</th>
                <th>Thành tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.productName}</td>
                  <td>{item.productSize}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unitPrice}</td>
                  <td>{item.totalPrice }</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#888', marginTop: '10px' }}>Không có chi tiết đơn hàng</p>
        )}
      </div>

      {/* --- Nút thao tác --- */}
      <div className="action-section">
        <a href="/orderlistplanRoom"><button className="back-btn">← Quay lại</button></a>
        <button className="create-btn" onClick={() => setShowPopup(true)}>🧾 Tạo lệnh sản xuất</button>
      </div>

      {/* --- Popup tạo lệnh sản xuất --- */}
      {showPopup && (
        <div className="popup-overlay4">
          <div className="popup-box4">
            <h3 className="popup-title4">Tạo Lệnh Sản Xuất</h3>
            <button className="popup-close4" onClick={() => setShowPopup(false)}>×</button>

            <div className="popup-content4">
              <p><b>Mã hợp đồng:</b> HD-2025-00{contractId}</p>
              <p><b>Tên sản phẩm:</b> {orderItems[0]?.productName || 'Khăn mặt Bamboo'}</p>
              <p><b>Số lượng:</b> {orderItems[0]?.quantity || 160}</p>

              <div className="popup-inputs4">
                <div className="input-row4">
                  <label>Ngày bắt đầu:</label>
                  <input
                    type="date"
                    value={plannedStartDate}
                    onChange={(e) => setPlannedStartDate(e.target.value)}
                  />
                </div>
                <div className="input-row4">
                  <label>Ngày kết thúc:</label>
                  <input
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                  />
                </div>
                <div className="input-row4">
                  <label>Ghi chú:</label>
                  <input
                    type="text"
                    placeholder="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="popup-actions4">
                <button className="cancel-btn4" onClick={() => setShowPopup(false)}>Hủy</button>
                <button
                  className="confirm-btn4"
                  onClick={handleCreateProductionOrder}
                  disabled={creating}
                >
                  {creating ? 'Đang tạo...' : 'Tạo lệnh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Popup xem hợp đồng (chỉ xem, không phê duyệt) --- */}
      {showContractPopup && (
        <div className="popup-overlay4">
          <div className="popup-box4" style={{ width: "500px" }}>
            <h3 className="popup-title4">Xem Hợp Đồng</h3>
            <button className="popup-close4" onClick={() => setShowContractPopup(false)}>×</button>

            <div className="popup-content4">
              {loading ? (
                <p>Đang tải dữ liệu...</p>
              ) : (
                <>
                  <div className="input-row4">
                    <label>Mã hợp đồng:</label>
                    <input type="text" value={orderDetail?.contractNumber || "HD-2025-001"} readOnly />
                  </div>

                  <div className="input-row4">
                    <label>Ảnh hợp đồng:</label>
                    {orderDetail?.filePath ? (
                      <img
                        src={`https://tmmsystem-sep490g143-production.up.railway.app/files/${orderDetail.filePath}`}
                        alt="Contract"
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          marginTop: "10px",
                        }}
                      />
                    ) : (
                      <p style={{ textAlign: "center", color: "#888" }}>Không có ảnh hợp đồng</p>
                    )}
                  </div>

                  <div className="popup-actions4" style={{ justifyContent: "center" }}>
                    <button className="cancel-btn4" onClick={() => setShowContractPopup(false)}>
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

export default OrderDetailplanRoom;
