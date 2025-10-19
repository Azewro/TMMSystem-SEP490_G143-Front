import React, { useState, useEffect } from "react";
import "./QuoteRequestDetailplanRoom.css";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { getRFQDetails } from "../../../services/rfqApi";

const BASE_URL = "https://tmmsystem-sep490g143-production.up.railway.app/v1";

const QuoteRequestDetailplanRoom = () => {
  const { id } = useParams();
  const [rfqDetails, setRfqDetails] = useState([]);
  const [rfqInfo, setRfqInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
const [profitMargin, setProfitMargin] = useState("");
const [capacityNotes, setCapacityNotes] = useState("");
  
  const [showPopup, setShowPopup] = useState(false);
  const [showWarehousePopup, setShowWarehousePopup] = useState(false);
  const [showMachinePopup, setShowMachinePopup] = useState(false);

  
  const [warehouseCapacity, setWarehouseCapacity] = useState(null);
  const [machineCapacity, setMachineCapacity] = useState(null);

  const [showQuotePopup, setShowQuotePopup] = useState(false);

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
const handleCreateQuotation = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user")); 
    const planningUserId = user?.userId;

    if (!planningUserId) {
      alert("Không tìm thấy thông tin người dùng kế hoạch trong localStorage!");
      return;
    }

    const body = {
      rfqId: parseInt(id),
      planningUserId,
      profitMargin: parseFloat(profitMargin),
      capacityCheckNotes: capacityNotes,
    };
    console.log("Dữ liệu gửi lên để tạo báo giá:", body);

    const res = await axios.post(`${BASE_URL}/quotations/create-from-rfq`, body);
    alert("✅ Tạo báo giá thành công!");
    console.log("Kết quả tạo báo giá:", res.data);
    setShowQuotePopup(false);
  } catch (error) {
    console.error("❌ Lỗi khi tạo báo giá:", error);
    alert("❌ Lỗi khi tạo báo giá, vui lòng thử lại!");
  }
};
  
  const handleReceiveRFQ = async () => {
    try {
      await axios.post(`${BASE_URL}/rfqs/${id}/receive-by-planning`);
      setRfqInfo((prev) => ({ ...prev, status: "RECEIVED_BY_PLANNING" }));
      setMessage("✅ Đã nhận yêu cầu báo giá thành công!");
    } catch (error) {
      console.error("Lỗi khi nhận yêu cầu:", error);
      setMessage("❌ Nhận yêu cầu thất bại!");
    } finally {
      setShowPopup(false);
    }
  };

 
  const handleCheckWarehouse = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/rfqs/${id}/check-warehouse-capacity`);
      setWarehouseCapacity(res.data.warehouseCapacity);
      setShowWarehousePopup(true);
    } catch (error) {
      console.error("Lỗi khi kiểm tra kho:", error);
      alert("❌ Lỗi khi kiểm tra năng lực kho!");
    }
  };

 
  const handleCheckMachine = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/rfqs/${id}/check-machine-capacity`);
      setMachineCapacity(res.data.machineCapacity);
      setShowMachinePopup(true);
    } catch (error) {
      console.error("Lỗi khi kiểm tra máy móc:", error);
      alert("❌ Lỗi khi kiểm tra năng lực máy móc!");
    }
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (!rfqInfo) return <div>Không tìm thấy thông tin RFQ</div>;

  return (
    <div className="quote-detail-container">
      <h2 className="page-title">Chi tiết Yêu cầu Báo giá (Phòng Kế hoạch)</h2>

     
      <div className="info-section2">
        <div className="info-card2">
          <h3 className="info-title2">Thông tin RFQ</h3>
          <p><b>Mã RFQ:</b> {rfqInfo.rfqNumber}</p>
          <p><b>Trạng thái:</b> {rfqInfo.status}</p>
          <p><b>Ngày tạo:</b> {new Date(rfqInfo.createdAt).toLocaleDateString("vi-VN")}</p>
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
              <th>Đơn vị</th>
              <th>Màu sắc</th>
              <th>Ghi chú</th>
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
                  <td>{item.noteColor || "-"}</td>
                  <td>{item.notes || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  Không có sản phẩm nào trong RFQ này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      
      <div className="action-buttons">
        <Link to="/quoterequestplan">
          <button className="back-btn">← Quay lại danh sách</button>
        </Link>

        <button className="send-btn" onClick={handleCheckWarehouse}>
          🏭 Kiểm tra kho
        </button>

        <button className="send-btn" onClick={handleCheckMachine}>
          🧵 Kiểm tra máy móc
        </button>

        <button className="send-btn" onClick={() => setShowQuotePopup(true)}>
          Lập báo giá
        </button>

        {rfqInfo.status === "FORWARDED_TO_PLANNING" && (
          <button className="send-btn" onClick={() => setShowPopup(true)}>
            Nhận yêu cầu
          </button>
        )}
      </div>

      
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
            <h3 className="popup-title">Xác nhận nhận yêu cầu</h3>
            <p>Bạn có chắc chắn muốn nhận yêu cầu báo giá này không?</p>
            <div className="popup-actions">
              <button className="popup-cancel" onClick={() => setShowPopup(false)}>Hủy</button>
              <button className="popup-confirm" onClick={handleReceiveRFQ}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

    
      {showWarehousePopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="popup-close" onClick={() => setShowWarehousePopup(false)}>×</button>
            <h3 className="popup-title">Kết quả kiểm tra kho</h3>
            {warehouseCapacity ? (
              <p>
                <b>Đủ năng lực:</b> {warehouseCapacity.sufficient ? "✅ Có" : "❌ Không"} <br />
                <b>Ghi chú:</b> {warehouseCapacity.message}
              </p>
            ) : (
              <p>Không có dữ liệu kiểm tra kho</p>
            )}
          </div>
        </div>
      )}

      
      {showMachinePopup && (
        <div className="popup-overlay">
          <div className="popup-box large">
            <button className="popup-close" onClick={() => setShowMachinePopup(false)}>×</button>
            <h3 className="popup-title">Kết quả kiểm tra năng lực máy móc</h3>
            {machineCapacity ? (
              <>
                <p><b>Đủ năng lực:</b> {machineCapacity.sufficient ? "✅ Có" : "❌ Không"}</p>
                <p><b>Bottleneck:</b> {machineCapacity.bottleneck || "-"}</p>
                <p><b>Ngày bắt đầu:</b> {machineCapacity.productionStartDate}</p>
                <p><b>Ngày kết thúc:</b> {machineCapacity.productionEndDate}</p>
                <p><b>Tổng thời gian chờ:</b> {machineCapacity.totalWaitTime} ngày</p>

                <h4>🧵 Các giai đoạn sản xuất:</h4>
                {["warpingStage", "weavingStage", "dyeingStage", "cuttingStage", "sewingStage"].map((stageKey) => {
                  const stage = machineCapacity[stageKey];
                  if (!stage) return null;
                  return (
                    <div key={stageKey} className="stage-card">
                      <h4>{stage.stageName}</h4>
                      <p>Mô tả: {stage.description}</p>
                      <p>Loại: {stage.stageType}</p>
                      <p>Thời gian xử lý: {stage.processingDays} ngày</p>
                      <p>Thời gian chờ: {stage.waitTime} ngày</p>
                      <p>Thời gian: {stage.startDate} → {stage.endDate}</p>
                      <p><b>Công suất:</b> {stage.capacity}</p>
                    </div>
                  );
                })}
              </>
            ) : (
              <p>Không có dữ liệu năng lực máy móc</p>
            )}
          </div>
        </div>
      )}

    
      {showQuotePopup && (
  <div className="popup-overlay">
    <div className="popup-box">
      <button className="popup-close" onClick={() => setShowQuotePopup(false)}>×</button>
      <h3 className="popup-title">Lập báo giá</h3>

      
      <div className="form-group">
        <label>Lợi nhuận mong muốn (%)</label>
        <input
          type="number"
          min="0"
          placeholder="Nhập tỷ lệ lợi nhuận..."
          value={profitMargin}
          onChange={(e) => setProfitMargin(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Ghi chú năng lực</label>
        <textarea
          placeholder="Nhập ghi chú về năng lực..."
          value={capacityNotes}
          onChange={(e) => setCapacityNotes(e.target.value)}
        ></textarea>
      </div>

      <div className="popup-actions">
        <button className="popup-cancel" onClick={() => setShowQuotePopup(false)}>Hủy</button>
        <button className="popup-confirm" onClick={handleCreateQuotation}>Tạo báo giá</button>
      </div>
    </div>
  </div>
)}
      {message && <div className="message-box">{message}</div>}
    </div>
  );
};

export default QuoteRequestDetailplanRoom;
