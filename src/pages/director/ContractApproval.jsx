import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar'; // Import sidebar
import { contractService } from '../../api/contractService';
import { quotationService } from '../../api/quotationService'; // Import quotationService
import { productionPlanService } from '../../api/productionPlanService'; // Import productionPlanService
import '../../styles/QuoteRequests.css';

const STATUS_LABELS = {
  PENDING_APPROVAL: { text: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { text: 'Đã duyệt', variant: 'success' },
  REJECTED: { text: 'Đã từ chối', variant: 'danger' }
};

const formatCurrency = (value) => {
  if (!value) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    console.warn('Cannot parse date', value, error);
    return value;
  }
};

const DirectorContractApproval = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [quoteFileUrl, setQuoteFileUrl] = useState(''); // State for quote file URL
  const [decision, setDecision] = useState({ type: null, note: '' });
  const [processing, setProcessing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadContracts = async () => {
    setLoading(true);
    setError('');

    try {
      const pending = await contractService.getDirectorPendingContracts();
      const sortedContracts = Array.isArray(pending) ? pending.sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate)) : [];
      setContracts(sortedContracts);
    } catch (err) {
      console.error('Failed to fetch contracts', err);
      setError(err.message || 'Không thể tải danh sách hợp đồng chờ duyệt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const openContract = async (contract) => {
    setSelectedContract(contract);
    setDecision({ type: null, note: '' });
    setOrderDetails(null);
    setFileUrl('');
    setQuoteFileUrl('');
    setDetailsLoading(true);

    try {
      // Fetch essential details first
      const [details, contractUrl] = await Promise.all([
        contractService.getOrderDetails(contract.id),
        contractService.getContractFileUrl(contract.id),
      ]);

      setOrderDetails(details);
      if (contractUrl) {
        setFileUrl(contractUrl.startsWith('http') ? contractUrl : 'https://' + contractUrl);
      }

      // Fetch optional quote file URL separately and handle failure gracefully
      if (contract.quotationId) {
        try {
          const quoteUrl = await quotationService.getQuoteFileUrl(contract.quotationId);
          if (quoteUrl) {
            setQuoteFileUrl(quoteUrl.startsWith('http') ? quoteUrl : 'https://' + quoteUrl);
          }
        } catch (quoteUrlError) {
          console.error('Could not fetch quote file URL:', quoteUrlError);
          // Do not set a blocking error, just let the UI show that the file is missing.
        }
      }
    } catch (err) {
      console.error('Failed to load contract detail', err);
      setError(err.message || 'Không thể tải chi tiết hợp đồng.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedContract(null);
    setOrderDetails(null);
    setFileUrl('');
    setQuoteFileUrl('');
    setDecision({ type: null, note: '' });
  };

  const handleApprove = async () => {
    if (!selectedContract) return;
    const directorId = localStorage.getItem('userId');
    if (!directorId) {
      setError('Không tìm thấy thông tin giám đốc. Vui lòng đăng nhập lại.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Approve the contract
      await contractService.approveContract(selectedContract.id, directorId, decision.note.trim() || undefined);
      
      // Step 2: Automatically create a production plan
      try {
        await productionPlanService.createPlanFromContract(selectedContract.id);
        setSuccess('Đã phê duyệt hợp đồng. Kế hoạch sản xuất đã được tự động tạo và chuyển cho bộ phận Kế hoạch.');
      } catch (planError) {
        console.error('Failed to auto-create production plan', planError);
        // Show a non-blocking error, the main action (approval) was successful
        setSuccess(`Đã phê duyệt hợp đồng. Tuy nhiên, có lỗi xảy ra khi tự động tạo kế hoạch sản xuất: ${planError.message}`);
      }

      closeModal();
      loadContracts();
    } catch (err) {
      console.error('Approve contract failed', err);
      setError(err.message || 'Không thể phê duyệt hợp đồng.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedContract) return;
    if (!decision.note.trim()) {
      setError('Vui lòng nhập lý do từ chối hợp đồng.');
      return;
    }

    const directorId = localStorage.getItem('userId');
    if (!directorId) {
      setError('Không tìm thấy thông tin giám đốc. Vui lòng đăng nhập lại.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await contractService.rejectContract(selectedContract.id, directorId, decision.note.trim());
      setSuccess('Đã trả lại hợp đồng cho nhân viên kinh doanh.');
      closeModal();
      loadContracts();
    } catch (err) {
      console.error('Reject contract failed', err);
      setError(err.message || 'Không thể từ chối hợp đồng.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="director" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Phê duyệt hợp đồng</h2>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                {success}
              </Alert>
            )}

            <Card>
              <Card.Header>
                Danh sách hợp đồng đã được nhân viên kinh doanh upload
              </Card.Header>
              <Card.Body>
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th style={{ width: 180 }}>Tên hợp đồng</th>
                      <th style={{ width: 160 }}>Ngày ký</th>
                      <th style={{ width: 160 }}>Ngày giao</th>
                      <th style={{ width: 160 }}>Trạng thái</th>
                      <th style={{ width: 160 }}>Giá trị</th>
                      <th style={{ width: 180 }}>Ghi chú</th>
                      <th style={{ width: 140 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" /> Đang tải hợp đồng...
                        </td>
                      </tr>
                    ) : contracts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          Không có hợp đồng nào cần phê duyệt.
                        </td>
                      </tr>
                    ) : (
                      contracts.map((contract, index) => {
                        const statusConfig = STATUS_LABELS[contract.status] || STATUS_LABELS.PENDING_APPROVAL;
                        return (
                          <tr key={contract.id}>
                            <td>{index + 1}</td>
                            <td className="fw-semibold text-primary">{contract.contractNumber}</td>
                            <td>{formatDate(contract.contractDate)}</td>
                            <td>{formatDate(contract.deliveryDate)}</td>
                            <td>
                              <Badge bg={statusConfig.variant}>{statusConfig.text}</Badge>
                            </td>
                            <td className="text-success fw-semibold">{formatCurrency(contract.totalAmount)}</td>
                            <td>{contract.directorApprovalNotes || '—'}</td>
                            <td className="text-center">
                              <Button variant="primary" size="sm" onClick={() => openContract(contract)}>
                                Xem chi tiết
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      <Modal show={!!selectedContract} onHide={closeModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết hợp đồng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" /> Đang tải chi tiết...
            </div>
          ) : orderDetails ? (
            <>
              <div className="mb-3">
                <strong>Khách hàng:</strong> {orderDetails.customerInfo?.customerName}
              </div>
              <div className="mb-3">
                <strong>Số điện thoại:</strong> {orderDetails.customerInfo?.phoneNumber || '—'}
              </div>
              <Table size="sm" bordered>
                <thead className="table-light">
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.orderItems?.map((item, index) => (
                    <tr key={item.productId || index}>
                      <td>{item.productName}</td>
                      <td>{item.quantity?.toLocaleString('vi-VN')}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="mt-3 d-flex gap-2">
                {fileUrl ? (
                  <Button
                    variant="outline-secondary"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Xem file hợp đồng
                  </Button>
                ) : (
                  <Alert variant="warning" className="py-2 px-3 mb-0">
                    Chưa có file hợp đồng.
                  </Alert>
                )}
                {quoteFileUrl ? (
                  <Button
                    variant="outline-info"
                    href={quoteFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Xem file báo giá
                  </Button>
                ) : (
                  <Alert variant="warning" className="py-2 px-3 mb-0">
                    Chưa có file báo giá.
                  </Alert>
                )}
              </div>
            </>
          ) : (
            <Alert variant="warning">Không thể tải chi tiết hợp đồng.</Alert>
          )}

          <Form.Group className="mt-4">
            <Form.Label>Ghi chú phê duyệt / Lý do từ chối</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={decision.note}
              onChange={(event) => setDecision((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Nhập ghi chú cho nhân viên kinh doanh"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal} disabled={processing}>
            Đóng
          </Button>
          <Button variant="danger" onClick={handleReject} disabled={processing}>
            {processing && decision.note.trim() ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
          <Button variant="success" onClick={handleApprove} disabled={processing}>
            {processing && !decision.note.trim() ? 'Đang xử lý...' : 'Phê duyệt'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DirectorContractApproval;