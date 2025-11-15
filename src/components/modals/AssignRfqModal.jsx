import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Row, Col, Table } from 'react-bootstrap';
import { userService } from '../../api/userService';
import { rfqService } from '../../api/rfqService';
import { productService } from '../../api/productService';
import { customerService } from '../../api/customerService'; // Import customerService
import toast from 'react-hot-toast';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const AssignRfqModal = ({ show, onHide, rfqId, onAssignmentSuccess }) => {
  const [salesUsers, setSalesUsers] = useState([]);
  const [planningUsers, setPlanningUsers] = useState([]);
  const [rfqDetails, setRfqDetails] = useState(null);
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [selectedPlanningId, setSelectedPlanningId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && rfqId) {
      const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
          // Fetch users and base RFQ data
          const [allUsers, rfqData] = await Promise.all([
            userService.getAllUsers(),
            rfqService.getRfqById(rfqId)
          ]);

          // Process users
          const sales = allUsers.filter(user => user.roleName?.toUpperCase() === 'SALE STAFF');
          const planning = allUsers.filter(user => user.roleName?.toUpperCase().includes('PLANNING'));
          setSalesUsers(sales || []);
          setPlanningUsers(planning || []);

          let finalRfqData = { ...rfqData };

          // If RFQ is linked to a customer, fetch customer data for fallback
          if (rfqData.customerId) {
            try {
              const customer = await customerService.getCustomerById(rfqData.customerId);
              finalRfqData.contactPerson = rfqData.contactPerson || customer.contactPerson || 'N/A';
              finalRfqData.contactPhone = rfqData.contactPhone || customer.phoneNumber || 'N/A';
              finalRfqData.contactEmail = rfqData.contactEmail || customer.email || 'N/A';
              finalRfqData.contactAddress = rfqData.contactAddress || customer.address || 'N/A';
            } catch (customerError) {
              console.error("Could not fetch customer details:", customerError);
              // Keep going with what we have
            }
          }

          // Enrich product details
          if (finalRfqData.details && finalRfqData.details.length > 0) {
            const enrichedDetails = await Promise.all(
              finalRfqData.details.map(async (detail) => {
                try {
                  const product = await productService.getProductById(detail.productId);
                  return { ...detail, productName: product.name, standardDimensions: product.standardDimensions };
                } catch {
                  return { ...detail, productName: 'Sản phẩm không xác định', standardDimensions: 'N/A' };
                }
              })
            );
            finalRfqData.details = enrichedDetails;
          }
          
          setRfqDetails(finalRfqData);
          // Set selected IDs if they exist (for view mode)
          setSelectedSalesId(rfqData.assignedSalesId || '');
          setSelectedPlanningId(rfqData.assignedPlanningId || '');

        } catch (err) {
          setError('Lỗi khi tải dữ liệu chi tiết.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [show, rfqId]);

  const handleAssign = async () => {
    if (!selectedSalesId || !selectedPlanningId) {
      setError('Vui lòng chọn cả nhân viên Sales và Kế hoạch.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      // Assign sales and planning
      await rfqService.assignRfq(rfqId, selectedSalesId, selectedPlanningId);
      
      // Also change the status to SENT as requested
      await rfqService.sendRfq(rfqId);

      toast.success('Đã phân công và gửi RFQ thành công!');
      onAssignmentSuccess();
    } catch (err) {
      setError(err.message || 'Phân công thất bại.');
      toast.error('Phân công RFQ thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedSalesId('');
    setSelectedPlanningId('');
    setError('');
    setRfqDetails(null);
    onHide();
  };

  const isViewMode = rfqDetails?.status !== 'DRAFT';

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isViewMode ? 'Chi tiết RFQ' : 'Phân công cho RFQ'} #{rfqId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <>
            {rfqDetails && (
              <div className="mb-4">
                <h5>Thông tin chung</h5>
                <Row className="mb-3">
                  <Col md={6}><strong>Khách hàng:</strong> {rfqDetails.contactPerson || 'N/A'}</Col>
                  <Col md={6}><strong>Số điện thoại:</strong> {rfqDetails.contactPhone || 'N/A'}</Col>
                  <Col md={6}><strong>Email:</strong> {rfqDetails.contactEmail || 'N/A'}</Col>
                  <Col md={6}><strong>Địa chỉ nhận hàng:</strong> {rfqDetails.contactAddress || 'N/A'}</Col>
                  <Col md={6}><strong>Phương thức liên hệ:</strong> {rfqDetails.contactMethod === 'PHONE' ? 'Điện thoại' : rfqDetails.contactMethod === 'EMAIL' ? 'Email' : rfqDetails.contactMethod || 'N/A'}</Col>
                </Row>
                <h6>Chi tiết sản phẩm</h6>
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sản phẩm</th>
                      <th>Kích thước</th>
                      <th>Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqDetails.details?.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>
                        <td>{item.productName}</td>
                        <td>{item.standardDimensions}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="mt-3">
                  <p><strong>Ngày giao hàng mong muốn:</strong> {formatDate(rfqDetails.expectedDeliveryDate)}</p>
                  <p><strong>Ghi chú chung:</strong> {rfqDetails.notes || 'Không có'}</p>
                </div>
              </div>
            )}

            <hr className="my-4" />

            <h5>{isViewMode ? 'Nhân viên được phân công' : 'Phân công nhân viên'}</h5>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nhân viên Sales</Form.Label>
                <Form.Select 
                  value={selectedSalesId} 
                  onChange={(e) => setSelectedSalesId(e.target.value)}
                  required
                  disabled={isViewMode}
                >
                  <option value="">-- Chọn Sales --</option>
                  {salesUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Nhân viên Kế hoạch</Form.Label>
                <Form.Select 
                  value={selectedPlanningId} 
                  onChange={(e) => setSelectedPlanningId(e.target.value)}
                  required
                  disabled={isViewMode}
                >
                  <option value="">-- Chọn Kế hoạch --</option>
                  {planningUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {isViewMode ? (
          <Button variant="secondary" onClick={handleClose}>
            Đóng
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleAssign} disabled={loading || submitting}>
              {submitting ? <><Spinner size="sm" /> Đang phân công...</> : 'Xác nhận'}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default AssignRfqModal;
