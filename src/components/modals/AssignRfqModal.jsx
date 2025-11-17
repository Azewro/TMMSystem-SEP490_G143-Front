import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Row, Col, Table } from 'react-bootstrap';
import { userService } from '../../api/userService';
import { rfqService } from '../../api/rfqService';
import { productService } from '../../api/productService';
import { customerService } from '../../api/customerService';
import toast from 'react-hot-toast';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const AssignRfqModal = ({ show, onHide, rfqId, onAssignmentSuccess, isViewMode = false }) => {
  const [salesUsers, setSalesUsers] = useState([]);
  const [rfqDetails, setRfqDetails] = useState(null);
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && rfqId) {
      const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
          const [allUsersResponse, rfqData] = await Promise.all([
            userService.getAllUsers(0, 1000),
            rfqService.getRfqById(rfqId)
          ]);
          
          const allUsers = (allUsersResponse && allUsersResponse.content) 
            ? allUsersResponse.content 
            : (Array.isArray(allUsersResponse) ? allUsersResponse : []);

          const sales = allUsers.filter(user => user.roleName?.toUpperCase() === 'SALE STAFF');
          setSalesUsers(sales || []);

          let finalRfqData = { ...rfqData };

          if (rfqData.customerId) {
            try {
              const customer = await customerService.getCustomerById(rfqData.customerId);
              finalRfqData.contactPerson = rfqData.contactPerson || customer.contactPerson || 'N/A';
              finalRfqData.contactPhone = rfqData.contactPhone || customer.phoneNumber || 'N/A';
              finalRfqData.contactEmail = rfqData.contactEmail || customer.email || 'N/A';
              finalRfqData.contactAddress = rfqData.contactAddress || customer.address || 'N/A';
            } catch (customerError) {
              console.error("Could not fetch customer details:", customerError);
            }
          }

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
          setSelectedSalesId(rfqData.assignedSalesId || '');

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
    if (!selectedSalesId) {
      setError('Vui lòng chọn nhân viên Sales.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await rfqService.assignRfq(rfqId, selectedSalesId);
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
    setError('');
    setRfqDetails(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isViewMode ? `Chi tiết RFQ ${rfqDetails?.rfqNumber || ''}` : `Phân công cho RFQ ${rfqDetails?.rfqNumber || ''}`}</Modal.Title>
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
                  {rfqDetails.employeeCode && <Col md={12}><strong>Mã nhân viên Sale (khách nhập):</strong> {rfqDetails.employeeCode}</Col>}
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
            </Form>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {isViewMode ? 'Đóng' : 'Hủy'}
        </Button>
        {!isViewMode && (
          <Button variant="primary" onClick={handleAssign} disabled={assigning}>
            {assigning ? <Spinner as="span" animation="border" size="sm" /> : 'Xác nhận'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default AssignRfqModal;
