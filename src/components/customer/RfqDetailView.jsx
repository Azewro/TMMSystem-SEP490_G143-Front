import React from 'react';
import { Table, Button, Form, Col, Row, Alert } from 'react-bootstrap';
import { FaTrash, FaPlus } from 'react-icons/fa';

const RfqDetailView = ({
  rfqData,
  isEditable,
  error,
  onDetailChange,
  onDateChange,
  onAddProductClick,
  onSave,
  onDeleteDetail
}) => {

  if (!rfqData) {
    return null; // Prevent rendering if data is not available yet
  }

  const handleQuantityChange = (detailId, newQuantity) => {
    const quantity = Math.max(1, parseInt(newQuantity, 10) || 1);
    onDetailChange(detailId, { quantity });
  };

  return (
    <div className="p-3 bg-light border-top">
      <h6 className="mb-3">Chi tiết Yêu cầu Báo giá</h6>
      {error && <Alert variant="danger" className="py-2">{error}</Alert>}
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>Kích thước</th>
            <th>Số lượng</th>
            {isEditable && <th className="text-center">Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {rfqData.details.map((item, index) => (
            <tr key={item.id || index}>
              <td>{index + 1}</td>
              <td>{item.productName || 'Sản phẩm không xác định'}</td>
              <td>{item.notes || 'Tiêu chuẩn'}</td>
              <td>
                {isEditable ? (
                  <Form.Control 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)} 
                    style={{ width: '80px' }}
                  />
                ) : item.quantity}
              </td>
              {isEditable && (
                <td className="text-center">
                  <Button variant="outline-danger" size="sm" onClick={() => onDeleteDetail(item.id)}>
                    <FaTrash />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>

      {isEditable && (
        <div className="mt-2">
            <Button variant="primary" size="sm" onClick={onAddProductClick}>
                <FaPlus className="me-1" /> Thêm sản phẩm
            </Button>
        </div>
      )}

      <Row className="mt-4">
        <Col md={6}>
          <h6>Ngày giao hàng mong muốn</h6>
          {isEditable ? (
            <>
                <Form.Control 
                    type="date"
                    value={rfqData.expectedDeliveryDate}
                    onChange={(e) => onDateChange({ expectedDeliveryDate: e.target.value, isEditingDate: true })}
                />
                {rfqData.isEditingDate && (
                    <Form.Control 
                        as="textarea"
                        rows={2}
                        placeholder="Lý do thay đổi... (bắt buộc nếu sửa ngày)"
                        className="mt-2"
                        value={rfqData.editReason}
                        onChange={(e) => onDateChange({ editReason: e.target.value })}
                    />
                )}
            </>
          ) : (
            <p>{new Date(rfqData.expectedDeliveryDate).toLocaleDateString('vi-VN')}</p>
          )}
        </Col>
      </Row>

      {isEditable && (
        <div className="text-end mt-3">
          <Button variant="success" onClick={onSave}>Lưu thay đổi</Button>
        </div>
      )}
    </div>
  );
};

export default RfqDetailView;
