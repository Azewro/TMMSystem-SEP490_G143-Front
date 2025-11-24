import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Spinner, Alert, Table, Row, Col, Form, Badge } from 'react-bootstrap';
import { rfqService } from '../../api/rfqService';
import { customerService } from '../../api/customerService';
import { productService } from '../../api/productService';
import { userService } from '../../api/userService';
import toast from 'react-hot-toast';
import { isVietnamesePhoneNumber } from '../../utils/validators';

const RFQDetailModal = ({ rfqId, show, handleClose }) => {
  const [rfq, setRfq] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [salesEmployeeCode, setSalesEmployeeCode] = useState(null); // Store sales employee code
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRfq, setEditedRfq] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false); // New state for cancel button

  const handleCancelRfq = async () => {
    if (!rfqId) return;
    const confirmMessage = rfq?.capacityStatus === 'INSUFFICIENT'
      ? 'Bạn có chắc chắn muốn hủy RFQ này vì không đủ năng lực sản xuất? Hành động này không thể hoàn tác.'
      : 'Bạn có chắc chắn muốn hủy RFQ này? Hành động này không thể hoàn tác.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setCancelLoading(true);
    try {
      await rfqService.cancelRfq(rfqId);
      toast.success('RFQ đã được hủy thành công!');
      handleClose(true); // Close modal and refresh list
    } catch (error) {
      toast.error(error.message || 'Lỗi khi hủy RFQ.');
      console.error('Failed to cancel RFQ', error);
    } finally {
      setCancelLoading(false);
    }
  };

  const fetchRfqDetails = useCallback(async () => {
    if (!rfqId || !show) return;
    setLoading(true);
    setError('');
    setSalesEmployeeCode(null); // Reset sales employee code
    try {
      const rfqData = await rfqService.getRfqById(rfqId);
      let customerData = null;
      if (rfqData.customerId) {
        customerData = await customerService.getCustomerById(rfqData.customerId);
        setCustomer(customerData);
      }

      // Fetch sales user info to get employeeCode
      if (rfqData.assignedSalesId) {
        try {
          const salesUser = await userService.getUserById(rfqData.assignedSalesId);
          setSalesEmployeeCode(salesUser.employeeCode || null);
        } catch (userError) {
          console.error('Failed to fetch sales user:', userError);
          // Continue without employeeCode if fetch fails
        }
      }

      const initialFormState = {
        ...rfqData,
        contactPerson: rfqData.contactPerson || customerData?.contactPerson || '',
        contactEmail: rfqData.contactEmail || customerData?.email || '',
        contactPhone: rfqData.contactPhone || customerData?.phoneNumber || '',
        contactAddress: rfqData.contactAddress || customerData?.address || '',
        // Ensure expectedDeliveryDate is preserved in correct format
        expectedDeliveryDate: rfqData.expectedDeliveryDate || null,
      };

      const details = rfqData.details || [];
      let enrichedDetails = [];
      if (details.length > 0) {
        const productPromises = details.map(item => productService.getProductById(item.productId));
        const products = await Promise.all(productPromises);
        enrichedDetails = details.map((item, index) => ({
          ...item,
          productName: products[index].name,
          productCode: products[index].code,
          standardDimensions: products[index].standardDimensions,
        }));
      }

      const finalState = { ...initialFormState, rfqDetails: enrichedDetails };
      setRfq(finalState);
      setEditedRfq(finalState);

    } catch (err) {
      setError('Lỗi khi tải chi tiết RFQ.');
      toast.error('Lỗi khi tải chi tiết RFQ.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [rfqId, show]);

  useEffect(() => {
    fetchRfqDetails();
  }, [fetchRfqDetails]);

  const handleSend = async () => {
    setSendLoading(true);
    try {
      await rfqService.sendRfq(rfqId);
      toast.success('Yêu cầu đã được gửi thành công!');
      fetchRfqDetails(); // Refresh data to get new status
    } catch (error) {
      toast.error(error.message || 'Lỗi khi gửi yêu cầu.');
      console.error('Failed to send RFQ', error);
    } finally {
      setSendLoading(false);
    }
  };

  const handleEditToggle = async (edit) => {
    setIsEditMode(edit);
    if (edit && allProducts.length === 0) {
      setEditLoading(true);
      try {
        const products = await productService.getAllProducts();
        setAllProducts(products);
      } catch (error) {
        toast.error("Failed to load products for editing.");
      } finally {
        setEditLoading(false);
      }
    }
    if (!edit) {
      setEditedRfq(rfq); // Reset changes on cancel
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // For date inputs, ensure we store the value correctly
    if (name === 'expectedDeliveryDate') {
      // Date input returns YYYY-MM-DD format string or empty string
      // Store it as-is (string format) for date input compatibility
      const dateValue = value || null; // Convert empty string to null
      console.log('Date input changed:', { name, value, dateValue });
      setEditedRfq(prev => ({ ...prev, [name]: dateValue }));
    } else {
      setEditedRfq(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...editedRfq.rfqDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setEditedRfq(prev => ({ ...prev, rfqDetails: updatedDetails }));
  };

  const handleDeleteDetail = (index) => {
    const updatedDetails = editedRfq.rfqDetails.filter((_, i) => i !== index);
    setEditedRfq(prev => ({ ...prev, rfqDetails: updatedDetails }));
  };

  const handleAddDetail = () => {
    if (!newProductId) {
      toast.error("Please select a product to add.");
      return;
    }
    const productToAdd = allProducts.find(p => p.id === parseInt(newProductId));
    if (editedRfq.rfqDetails.some(d => d.productId === productToAdd.id)) {
      toast.error("Product already in the list.");
      return;
    }
    const newDetail = {
      productId: productToAdd.id,
      productName: productToAdd.name,
      productCode: productToAdd.code,
      standardDimensions: productToAdd.standardDimensions, // Add standardDimensions for new product
      quantity: 100, // Default quantity - minimum is 100
      unit: productToAdd.unit,
    };
    setEditedRfq(prev => ({ ...prev, rfqDetails: [...prev.rfqDetails, newDetail] }));
    setNewProductId('');
  };

  const handleSave = async () => {
    setEditLoading(true);
    try {
      // Format expectedDeliveryDate properly
      // Date input returns YYYY-MM-DD format string, but we need to ensure it's valid
      console.log('Raw expectedDeliveryDate from editedRfq:', editedRfq.expectedDeliveryDate);
      let formattedDate = editedRfq.expectedDeliveryDate;

      if (formattedDate) {
        // Handle different date formats
        if (typeof formattedDate === 'string') {
          // Trim whitespace
          formattedDate = formattedDate.trim();

          // If it's already in YYYY-MM-DD format, use it directly
          if (/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
            // Already correct format, keep it
            console.log('Date is already in YYYY-MM-DD format:', formattedDate);
          } else if (formattedDate.includes('T')) {
            // ISO format with time, extract date part
            formattedDate = new Date(formattedDate).toISOString().split('T')[0];
            console.log('Converted ISO date to YYYY-MM-DD:', formattedDate);
          } else if (formattedDate === '') {
            // Empty string, set to null
            formattedDate = null;
            console.log('Date is empty string, setting to null');
          } else {
            // Try to parse other formats
            try {
              const parsed = new Date(formattedDate);
              if (!isNaN(parsed.getTime())) {
                formattedDate = parsed.toISOString().split('T')[0];
                console.log('Parsed date to YYYY-MM-DD:', formattedDate);
              } else {
                formattedDate = null; // Invalid date
                console.log('Invalid date format, setting to null');
              }
            } catch (e) {
              formattedDate = null;
              console.log('Error parsing date, setting to null:', e);
            }
          }
        } else if (formattedDate instanceof Date) {
          // Date object, convert to YYYY-MM-DD
          formattedDate = formattedDate.toISOString().split('T')[0];
          console.log('Converted Date object to YYYY-MM-DD:', formattedDate);
        } else {
          formattedDate = null;
          console.log('Date is not string or Date object, setting to null');
        }

        // Final validation - ensure it's a valid date string
        if (formattedDate && !/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
          console.log('Date failed final validation, setting to null');
          formattedDate = null;
        }
      } else {
        formattedDate = null;
        console.log('expectedDeliveryDate is falsy, setting to null');
      }

      console.log('Final formattedDate:', formattedDate);

      // Prepare details array - ensure proper types
      // Backend uses BigDecimal for quantity and recreates all details (doesn't need id)
      const details = editedRfq.rfqDetails.map(({ id, productId, quantity, unit, noteColor, notes }) => {
        // Validate required fields
        if (!productId) {
          throw new Error('Tất cả sản phẩm phải có productId hợp lệ.');
        }

        const parsedProductId = parseInt(productId, 10);
        if (isNaN(parsedProductId) || parsedProductId <= 0) {
          throw new Error(`ProductId không hợp lệ: ${productId}`);
        }

        const parsedQuantity = parseFloat(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity < 100) {
          throw new Error(`Số lượng phải từ 100 trở lên. Giá trị hiện tại: ${quantity}`);
        }

        const detail = {
          productId: parsedProductId, // Required - backend checks if null
          quantity: parsedQuantity, // Required - backend uses BigDecimal, send as number (not string)
          unit: unit && unit.trim() !== '' ? unit.trim() : 'cái' // Required - ensure not null/empty
        };

        // Backend code: if (d.getProductId() != null) { ... }
        // So productId can be null in DTO, but we always provide it
        // Backend calls: nd.setQuantity(d.getQuantity()) - quantity should not be null
        // Backend calls: nd.setUnit(d.getUnit()) - unit should not be null

        // Backend deletes all existing details and recreates, so id is not needed
        // Don't include id field - backend ignores it anyway

        // Include optional fields only if they have values
        if (noteColor && (typeof noteColor === 'string' ? noteColor.trim() !== '' : noteColor)) {
          detail.noteColor = noteColor;
        }
        if (notes && (typeof notes === 'string' ? notes.trim() !== '' : notes)) {
          detail.notes = notes;
        }

        return detail;
      });

      // Validate email format if provided (backend has @Email validation)
      // Backend validation: @Email annotation
      if (editedRfq.contactEmail && editedRfq.contactEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editedRfq.contactEmail)) {
          throw new Error('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
        }
      }

      // Validate phone format if provided
      if (editedRfq.contactPhone && editedRfq.contactPhone.trim() !== '') {
        if (!isVietnamesePhoneNumber(editedRfq.contactPhone)) {
          throw new Error('Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.');
        }
      }

      // Backend only updates fields that are not null
      // So we only include fields that have actual values
      const payload = {};

      if (editedRfq.contactPerson && editedRfq.contactPerson.trim() !== '') {
        payload.contactPerson = editedRfq.contactPerson.trim();
      }

      if (editedRfq.contactEmail && editedRfq.contactEmail.trim() !== '') {
        payload.contactEmail = editedRfq.contactEmail.trim();
      }

      if (editedRfq.contactPhone && editedRfq.contactPhone.trim() !== '') {
        payload.contactPhone = editedRfq.contactPhone.trim();
      }

      if (editedRfq.contactAddress && editedRfq.contactAddress.trim() !== '') {
        payload.contactAddress = editedRfq.contactAddress.trim();
      }

      if (editedRfq.notes && editedRfq.notes.trim() !== '') {
        payload.notes = editedRfq.notes.trim();
      }

      // Validate and add expectedDeliveryDate - backend requires it to be at least 30 days from today
      // Always include expectedDeliveryDate if it exists (even if unchanged)
      // Date input type="date" returns YYYY-MM-DD string format
      if (formattedDate) {
        // Ensure it's a string and not empty
        const dateStr = typeof formattedDate === 'string' ? formattedDate.trim() : String(formattedDate).trim();

        if (dateStr && dateStr !== '') {
          // Validate date format (YYYY-MM-DD)
        } else {
          console.log('expectedDeliveryDate is empty string, not including in payload');
        }
      } else {
        console.log('expectedDeliveryDate is null/undefined, not including in payload');
      }

      // Details is optional - backend only replaces if provided
      // But if we're editing, we should always include details
      if (details && details.length > 0) {
        payload.details = details;
      } else {
        // If no details, don't send details field - backend will keep existing ones
        // But typically we want to update details, so throw error
        throw new Error('RFQ phải có ít nhất một sản phẩm.');
      }

      console.log('Sending payload to sales-edit:', JSON.stringify(payload, null, 2));

      // Final validation before sending
      if (payload.details) {
        payload.details.forEach((detail, index) => {
          if (!detail.productId || detail.productId <= 0) {
            throw new Error(`Sản phẩm thứ ${index + 1}: ProductId không hợp lệ`);
          }
          if (!detail.quantity || detail.quantity < 100) {
            throw new Error(`Sản phẩm thứ ${index + 1}: Số lượng phải từ 100 trở lên`);
          }
          if (!detail.unit || detail.unit.trim() === '') {
            throw new Error(`Sản phẩm thứ ${index + 1}: Đơn vị không được để trống`);
          }
        });
      }

      await rfqService.salesEditRfq(rfqId, payload);
      toast.success("RFQ updated successfully!");
      setIsEditMode(false);
      fetchRfqDetails(); // Refresh data
    } catch (error) {
      console.error('Error saving RFQ:', error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update RFQ.";
      toast.error(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      // Step 1: Preliminary check
      await rfqService.confirmRfq(rfqId, 'Yêu cầu đã được sale xác nhận.');

      // Step 2: Forward to planning
      await rfqService.forwardRfqToPlanning(rfqId);

      toast.success('Yêu cầu đã được xác nhận và chuyển cho bộ phận Kế hoạch!');
      handleClose(true); // Close modal and refresh list
    } catch (error) {
      toast.error(error.message || 'Lỗi khi xử lý yêu cầu.');
      console.error('Failed to confirm and forward RFQ', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const renderCustomerInfo = () => {
    if (!editedRfq) return null;
    const data = isEditMode ? editedRfq : rfq;

    return (
      <div className="mb-4">
        <h5>Thông tin khách hàng</h5>
        <Row>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Họ tên</Form.Label>
              <Form.Control type="text" name="contactPerson" value={data.contactPerson || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control type="text" name="contactPhone" value={data.contactPhone || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
          <Col md={6} className="mt-2">
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="contactEmail" value={data.contactEmail || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
          <Col md={6} className="mt-2">
            <Form.Group>
              <Form.Label>Địa chỉ nhận hàng</Form.Label>
              <Form.Control type="text" name="contactAddress" value={data.contactAddress || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
          <Col md={6} className="mt-2">
            <Form.Group>
              <Form.Label>Ngày tạo</Form.Label>
              <Form.Control type="text" value={data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'} readOnly />
            </Form.Group>
          </Col>
          <Col md={6} className="mt-2">
            <Form.Group>
              <Form.Label>Mã nhân viên Sale</Form.Label>
              <Form.Control type="text" value={salesEmployeeCode || data.employeeCode || 'N/A'} readOnly />
            </Form.Group>
          </Col>
          <Col md={12} className="mt-2">
            <Form.Group>
              <Form.Label>Ghi chú</Form.Label>
              <Form.Control as="textarea" name="notes" value={data.notes || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
        </Row>
      </div>
    );
  };

  const renderProductInfo = () => {
    if (!editedRfq || !editedRfq.rfqDetails) return null;

    return (
      <div className="mb-4">
        <h5>Sản phẩm yêu cầu</h5>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Tên sản phẩm</th>
              <th>Mã sản phẩm</th>
              <th>Kích thước</th>
              <th>Số lượng</th>
              {isEditMode ? <th>Hành động</th> : null}
            </tr>
          </thead>
          <tbody>
            {editedRfq.rfqDetails.map((item, index) => (
              <tr key={item.id || `new-${index}`}>
                <td>{item.productName}</td>
                <td>{item.productCode || 'N/A'}</td>
                <td>{item.standardDimensions || 'N/A'}</td> {/* Display standardDimensions */}
                <td>
                  <Form.Control
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleDetailChange(index, 'quantity', parseInt(e.target.value))}
                    readOnly={!isEditMode}
                    min="100"
                  />
                </td>
                {isEditMode ? (
                  <td>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteDetail(index)}>Xóa</Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </Table>
        {isEditMode && (
          <Row className="mt-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label>Thêm sản phẩm</Form.Label>
                <Form.Select value={newProductId} onChange={(e) => setNewProductId(e.target.value)}>
                  <option value="">Chọn sản phẩm...</option>
                  {allProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button onClick={handleAddDetail} disabled={editLoading}>Thêm</Button>
            </Col>
          </Row>
        )}
      </div>
    );
  };

  const renderDeliveryInfo = () => {
    if (!editedRfq) return null;
    const data = isEditMode ? editedRfq : rfq;
    // Helper to format date as YYYY-MM-DD using local time
    const formatDateForInput = (dateInput) => {
      if (!dateInput) return '';
      // If it's already a YYYY-MM-DD string, return it
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return '';

      // Use local time components to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Format date for input type="date" which requires YYYY-MM-DD
    const dateValue = formatDateForInput(data.expectedDeliveryDate);
    const proposedDateValue = formatDateForInput(data.proposedNewDeliveryDate);
    const isInsufficient = data.capacityStatus === 'INSUFFICIENT';

    return (
      <div className="mb-4">
        <h5>Thông tin giao hàng</h5>
        <Row>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Thời gian giao mong muốn</Form.Label>
              <Form.Control
                type="date"
                name="expectedDeliveryDate"
                value={dateValue}
                onChange={handleInputChange}
                readOnly={!isEditMode}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Hiển thị thông tin năng lực nếu có */}
        {data.capacityStatus && (
          <Row className="mt-3">
            <Col md={12}>
              <div className={`p-3 rounded ${isInsufficient ? 'bg-warning bg-opacity-10 border border-warning' : 'bg-success bg-opacity-10 border border-success'}`}>
                <h6 className={`mb-2 ${isInsufficient ? 'text-warning' : 'text-success'}`}>
                  <strong>Trạng thái năng lực sản xuất:</strong> {' '}
                  <Badge bg={isInsufficient ? 'warning' : 'success'}>
                    {isInsufficient ? 'Không đủ năng lực' : 'Đủ năng lực'}
                  </Badge>
                </h6>
                {isInsufficient && (
                  <>
                    {data.capacityReason && (
                      <p className="mb-2">
                        <strong>Lý do:</strong> {data.capacityReason}
                      </p>
                    )}
                    {proposedDateValue && (
                      <p className="mb-2">
                        <strong>Ngày giao hàng đề xuất:</strong> {new Date(data.proposedNewDeliveryDate).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                    {dateValue !== proposedDateValue && proposedDateValue && (
                      <Alert variant="warning" className="mb-0 mt-2">
                        <small>
                          <strong>Lưu ý:</strong> Planning đã đề xuất ngày giao hàng mới ({new Date(data.proposedNewDeliveryDate).toLocaleDateString('vi-VN')}).
                          {data.status === 'SENT' ? (
                            <span className="d-block mt-1">
                              Vui lòng liên hệ với khách hàng để xác nhận ngày giao hàng mới. Nếu khách đồng ý, bạn có thể chỉnh sửa RFQ để cập nhật ngày giao hàng. Nếu khách không đồng ý, bạn có thể hủy RFQ này.
                            </span>
                          ) : (
                            <span className="d-block mt-1">
                              Vui lòng liên hệ với planning để cập nhật ngày giao hàng.
                            </span>
                          )}
                        </small>
                      </Alert>
                    )}
                    {data.status === 'SENT' && isInsufficient && (
                      <Alert variant="info" className="mb-0 mt-2">
                        <small>
                          <strong>Hướng dẫn:</strong> RFQ này đã được trả về từ Planning do không đủ năng lực sản xuất.
                          Bạn có thể chỉnh sửa ngày giao hàng nếu khách hàng đồng ý với ngày đề xuất mới, hoặc hủy RFQ nếu khách hàng không đồng ý.
                        </small>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            </Col>
          </Row >
        )}
      </div >
    );
  };

  return (
    <Modal show={show} onHide={() => handleClose(false)} size="lg" backdrop="static">
      <Modal.Header closeButton={!isEditMode}>
        <Modal.Title>
          Chi tiết Yêu cầu báo giá {rfq?.rfqNumber || rfqId}
          {rfq?.status && (
            <Badge bg={rfq.status === 'DRAFT' ? 'secondary' : rfq.status === 'SENT' ? 'info' : rfq.status === 'FORWARDED_TO_PLANNING' ? 'warning' : rfq.status === 'PRELIMINARY_CHECKED' ? 'primary' : rfq.status === 'QUOTED' ? 'success' : rfq.status === 'REJECTED' ? 'danger' : 'secondary'} className="ms-3">
              {rfq.status === 'DRAFT' ? 'Bản nháp' : rfq.status === 'SENT' ? 'Chờ xác nhận' : rfq.status === 'FORWARDED_TO_PLANNING' ? 'Đã chuyển Planning' : rfq.status === 'PRELIMINARY_CHECKED' ? 'Đã kiểm tra sơ bộ' : rfq.status === 'QUOTED' ? 'Đã báo giá' : rfq.status === 'REJECTED' ? 'Đã từ chối' : rfq.status}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {(loading || editLoading) && <div className="text-center"><Spinner animation="border" /></div>}
        {!loading && error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && rfq && (
          <>
            {renderCustomerInfo()}
            {renderProductInfo()}
            {renderDeliveryInfo()}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {isEditMode ? (
          <>
            <Button variant="secondary" onClick={() => handleEditToggle(false)} disabled={editLoading}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={editLoading}>
              {editLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Lưu thay đổi'}
            </Button>
          </>
        ) : (
          <>
            {/* Sales can edit RFQ before preliminary check (status DRAFT or SENT) */}
            {/* Cho phép chỉnh sửa khi status là DRAFT hoặc SENT (bao gồm cả khi được trả về từ Planning) */}
            {(rfq?.status === 'DRAFT' || rfq?.status === 'SENT') && (
              <Button variant="outline-primary" onClick={() => handleEditToggle(true)}>
                Sửa RFQ
              </Button>
            )}
            {/* Cho phép hủy khi status là DRAFT hoặc SENT (KHÔNG hiển thị khi QUOTED) */}
            {rfq?.status !== 'QUOTED' && (
              <Button
                variant="danger"
                onClick={handleCancelRfq}
                disabled={cancelLoading || (rfq?.status !== 'DRAFT' && rfq?.status !== 'SENT')}
              >
                {cancelLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Hủy RFQ'}
              </Button>
            )}
            <div className="flex-grow-1"></div>
            <Button variant="secondary" onClick={() => handleClose(false)}>
              Đóng
            </Button>

            {rfq?.status === 'DRAFT' && (
              <Button variant="success" onClick={handleSend} disabled={sendLoading}>
                {sendLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Gửi Yêu Cầu'}
              </Button>
            )}

            {/* Sales can confirm RFQ when status is SENT (before preliminary check) */}
            {rfq?.status === 'SENT' && (
              <Button variant="primary" onClick={handleConfirm} disabled={loading || confirmLoading}>
                {confirmLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Xác nhận và Gửi đi'}
              </Button>
            )}
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default RFQDetailModal;
