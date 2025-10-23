import React, { useState, useEffect } from 'react';
import './OrderDetailplanRoom.css';
import { useParams } from 'react-router-dom';

const OrderDetailplanRoom = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showContractPopup, setShowContractPopup] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [orderStatus, setOrderStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // 🟩 Lấy id từ URL
  const { id } = useParams();

  // 🟦 Gọi API lấy chi tiết đơn hàng
  const fetchOrderDetail = async () => {
    if (!id) {
      console.warn('⚠️ Không có ID hợp đồng trong URL!');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Gọi API với id =', id);

      const res = await fetch(
        `https://tmmsystem-sep490g143-production.up.railway.app/v1/contracts/${id}/order-details`
      );

      console.log('📩 Response:', res);
      if (!res.ok) throw new Error('Không thể tải dữ liệu đơn hàng!');

      const data = await res.json();
      console.log('✅ Dữ liệu đơn hàng nhận được:', data);

      setOrderDetail(data);
      setOrderItems(Array.isArray(data.orderItems) ? data.orderItems : []);
      setOrderStatus(data.status || 'Không xác định');
    } catch (err) {
      console.error('❌ Lỗi khi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🟨 Gọi API khi mở trang
  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  // 🧾 Tạo lệnh sản xuất
  const handleCreateProductionOrder = async () => {
    if (!plannedStartDate || !plannedEndDate) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc!');
      return;
    }

    try {
      setCreating(true);
      const planningUserId = 4;
      const url = `https://tmmsystem-sep490g143-production.up.railway.app/v1/production/orders/create-from-contract?contractId=${id}&planningUserId=${planningUserId}&plannedStartDate=${plannedStartDate}&plannedEndDate=${plannedEndDate}&notes=${encodeURIComponent(notes)}`;

      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Tạo lệnh sản xuất thất bại!');

      const data = await res.json();
      console.log('🎉 Lệnh sản xuất đã tạo:', data);

      setOrderStatus('PENDING_APPROVAL');
      setShowPopup(false);
      alert('✅ Tạo lệnh sản xuất thành công!');
    } catch (error) {
      console.error('❌ Lỗi khi tạo lệnh sản xuất:', error);
      alert('Tạo lệnh thất bại, vui lòng thử lại!');
    } finally {
      setCreating(false);
    }
  };

  const handleViewContract = () => setShowContractPopup(true);

  return (
    <div className="order-detail-container">
      <div className="breadcrumb">
        <span>Đơn đặt hàng /</span> <span className="current">Chi tiết</span>
      </div>

      <h2 className="page-title">Chi tiết đơn đặt hàng</h2>

      {/* --- Thông tin khách hàng --- */}
      <div className="info-section">
        <div className="info-card">
          <div className="card-header">Thông tin khách hàng</div>
          <div className="card-body">
            <p><b>Tên khách hàng:</b> {orderDetail?.customerInfo?.customerName || '—'}</p>
            <p><b>SDT:</b> {orderDetail?.customerInfo?.phoneNumber || '—'}</p>
            <p><b>Công ty:</b> {orderDetail?.customerInfo?.companyName || '—'}</p>
            <p><b>Mã thuế:</b> {orderDetail?.customerInfo?.taxCode || '—'}</p>
            <p><b>Địa chỉ:</b> {orderDetail?.customerInfo?.address || '—'}</p>

            <button
              style={{ background: 'blue', color: '#fff', borderRadius: '10px' }}
              onClick={handleViewContract}
            >
              Xem hợp đồng
            </button>
          </div>
        </div>

        {/* --- Trạng thái đơn hàng --- */}
        <div className="info-card">
          <div className="card-header">Trạng thái đơn hàng</div>
          <div className="card-body">
            <p>
              <b>Trạng thái:</b>{' '}
              <span
                className={`status-badge ${
                  orderStatus === 'APPROVED'
                    ? 'green'
                    : orderStatus === 'PENDING_APPROVAL'
                    ? 'yellow'
                    : orderStatus === 'REJECTED'
                    ? 'red'
                    : ''
                }`}
              >
                {orderStatus || '—'}
              </span>
            </p>
            <p><b>Ngày hợp đồng:</b> {orderDetail?.contractDate || '—'}</p>
            <p><b>Ngày giao hàng dự kiến:</b> {orderDetail?.deliveryDate || '—'}</p>
          </div>
        </div>
      </div>

      {/* --- Chi tiết đơn hàng --- */}
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
                  <td>{item.unitPrice.toLocaleString()}</td>
                  <td>{item.totalPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="4"><b>Tổng cộng:</b></td>
                <td><b>{orderDetail?.totalAmount?.toLocaleString() || 0} VNĐ</b></td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p style={{ color: '#888' }}>Không có chi tiết đơn hàng</p>
        )}
      </div>

      {/* --- Nút thao tác --- */}
      <div className="action-section">
        <a href="/orderlistplanRoom"><button className="back-btn">← Quay lại</button></a>
        <button className="create-btn" onClick={() => setShowPopup(true)}>
          🧾 Tạo lệnh sản xuất
        </button>
      </div>

      {/* --- Popup tạo lệnh --- */}
      {showPopup && (
        <div className="popup-overlay4">
          <div className="popup-box4">
            <h3 className="popup-title4">Tạo Lệnh Sản Xuất</h3>
            <button className="popup-close4" onClick={() => setShowPopup(false)}>×</button>

            <div className="popup-content4">
              <p><b>Mã hợp đồng:</b> {orderDetail?.contractNumber || `HD-${id}`}</p>
              <p><b>Tên sản phẩm:</b> {orderItems[0]?.productName || '—'}</p>
              <p><b>Số lượng:</b> {orderItems[0]?.quantity || 0}</p>

              <div className="popup-inputs4">
                <div className="input-row4">
                  <label>Ngày bắt đầu:</label>
                  <input type="date" value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} />
                </div>
                <div className="input-row4">
                  <label>Ngày kết thúc:</label>
                  <input type="date" value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)} />
                </div>
                <div className="input-row4">
                  <label>Ghi chú:</label>
                  <input type="text" placeholder="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              <div className="popup-actions4">
                <button className="cancel-btn4" onClick={() => setShowPopup(false)}>Hủy</button>
                <button className="confirm-btn4" onClick={handleCreateProductionOrder} disabled={creating}>
                  {creating ? 'Đang tạo...' : 'Tạo lệnh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Popup xem hợp đồng --- */}
      {showContractPopup && (
        <div className="popup-overlay4">
          <div className="popup-box4" style={{ width: '500px' }}>
            <h3 className="popup-title4">Xem Hợp Đồng</h3>
            <button className="popup-close4" onClick={() => setShowContractPopup(false)}>×</button>

            <div className="popup-content4">
              {orderDetail?.filePath ? (
                <img
                  src={`https://tmmsystem-sep490g143-production.up.railway.app/files/${orderDetail.filePath}`}
                  alt="Contract"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    marginTop: '10px',
                  }}
                />
              ) : (
                <p>Không có ảnh hợp đồng</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailplanRoom;
