import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Modal, Form, Alert, Table, Spinner } from "react-bootstrap";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
const OrderDetailPlanRoom = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false); // ✅ Modal xác nhận phê duyệt
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [alert, setAlert] = useState(null);

  const directorId = localStorage.getItem("directorId");
  const API_BASE = "https://tmmsystem-sep490g143-production.up.railway.app/v1/production/orders";

  // Fetch chi tiết đơn hàng
  const fetchOrderDetail = async () => {
    try {
      const response = await axios.get(`${API_BASE}/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  // ✅ Phê duyệt
  const handleApprove = async () => {
    if (!directorId) {
      setAlert({ type: "warning", message: "Không tìm thấy ID giám đốc. Vui lòng đăng nhập lại." });
      return;
    }
    try {
      setLoading(true);
      const url = `${API_BASE}/${orderId}/approve?directorId=${directorId}`;
      const res = await axios.post(url);
      console.log("Approve response:", res.data);
      setAlert({ type: "success", message: "✅ Đã phê duyệt lệnh sản xuất thành công!" });
      setOrder((prev) => ({ ...prev, status: "APPROVED" }));
      setShowApproveModal(false);
    } catch (error) {
      console.error("Lỗi khi phê duyệt:", error.response || error);
      setAlert({ type: "danger", message: "❌ Phê duyệt thất bại, vui lòng thử lại!" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Từ chối
  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      setAlert({ type: "warning", message: "Vui lòng nhập lý do từ chối." });
      return;
    }
    if (!directorId) {
      setAlert({ type: "warning", message: "Không tìm thấy ID giám đốc. Vui lòng đăng nhập lại." });
      return;
    }
    try {
      setLoading(true);
      const url = `${API_BASE}/${orderId}/reject?directorId=${directorId}&notes=${encodeURIComponent(
        rejectionNotes
      )}`;
      const res = await axios.post(url);
      console.log("Reject response:", res.data);
      setAlert({ type: "success", message: "🚫 Đã từ chối lệnh sản xuất!" });
      setOrder((prev) => ({ ...prev, status: "REJECTED" }));
      setShowRejectModal(false);
      setRejectionNotes("");
    } catch (error) {
      console.error("Lỗi khi từ chối:", error.response || error);
      setAlert({ type: "danger", message: "❌ Từ chối thất bại, vui lòng thử lại!" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center mt-4">Không tìm thấy thông tin đơn hàng.</p>;
  }

  return (
    <Container className="mt-4">
      <h4 className="mb-3">Chi tiết lệnh sản xuất #{order.id}</h4>

      {alert && <Alert variant={alert.type}>{alert.message}</Alert>}

      <Row>
        <Col md={6}>
          <p><strong>Tên đơn hàng:</strong> {order.name}</p>
          <p><strong>Khách hàng:</strong> {order.customerName}</p>
          <p><strong>Ngày tạo:</strong> {order.createdAt}</p>
        </Col>
        <Col md={6}>
          <p><strong>Trạng thái:</strong>{" "}
            <span
              className={`badge ${
                order.status === "APPROVED"
                  ? "bg-success"
                  : order.status === "REJECTED"
                  ? "bg-danger"
                  : "bg-warning text-dark"
              }`}
            >
              {order.status}
            </span>
          </p>
          <p><strong>Người tạo:</strong> {order.createdBy}</p>
        </Col>
      </Row>

      <h5 className="mt-4">Chi tiết đơn hàng</h5>
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Đơn vị</th>
          </tr>
        </thead>
        <tbody>
          {order.orderDetails?.map((item, index) => (
            <tr key={item.id || index}>
              <td>{index + 1}</td>
              <td>{item.productName}</td>
              <td>{item.quantity}</td>
              <td>{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* ✅ Nút hành động nếu đang chờ duyệt */}
      {order.status === "PENDING_APPROVAL" && (
        <div className="d-flex gap-2 justify-content-end mt-3">
          <Button variant="success" onClick={() => setShowApproveModal(true)} disabled={loading}>
            Phê duyệt
          </Button>
          <Button variant="danger" onClick={() => setShowRejectModal(true)} disabled={loading}>
            Từ chối
          </Button>
        </div>
      )}

      {/* ✅ Modal xác nhận phê duyệt */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận phê duyệt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn <strong className="text-success">phê duyệt</strong> lệnh sản xuất này không?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Hủy
          </Button>
          <Button variant="success" onClick={handleApprove} disabled={loading}>
            Xác nhận phê duyệt
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Modal nhập lý do từ chối */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Từ chối lệnh sản xuất</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Lý do từ chối</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Nhập lý do từ chối..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleReject} disabled={loading}>
            Xác nhận từ chối
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrderDetailPlanRoom;
