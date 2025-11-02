import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Form, InputGroup, Alert, Spinner, Collapse } from 'react-bootstrap';
import { FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import CustomerSidebar from '../../components/common/CustomerSidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import { useAuth } from '../../context/AuthContext';
import RfqDetailView from '../../components/customer/RfqDetailView';
import AddProductToRfqModal from '../../components/modals/AddProductToRfqModal';
import '../../styles/CustomerQuoteRequests.css';

const CustomerQuoteRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customerId = user ? (user.customerId || user.id) : null;

  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [productMap, setProductMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [editingRfq, setEditingRfq] = useState(null);
  const [editingError, setEditingError] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);

    const [quotations, setQuotations] = useState([]);

  

    const fetchAllData = useCallback(async () => {

      if (!customerId) {

        setError('Không tìm thấy thông tin khách hàng.');

        setLoading(false);

        return;

      }

      setLoading(true);

      setError('');

      try {

        const [rfqsData, productsData, quotationsData] = await Promise.all([

          quoteService.getAllQuoteRequests(),

          productService.getAllProducts(),

          quoteService.getCustomerQuotations(customerId)

        ]);

  

        setQuotations(quotationsData);

      const pMap = new Map(productsData.map(p => [p.id, p.name]));
      setProducts(productsData);
      setProductMap(pMap);

      const transformed = rfqsData
        .filter(rfq => rfq.customerId === parseInt(customerId, 10))
        .map(rfq => ({
          ...rfq,
          details: rfq.details.map(d => ({...d, productName: pMap.get(d.productId) || 'N/A'})),
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(transformed);
    } catch (e) {
      setError(e.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const toggleRow = (rfqId) => {
    const newExpandedId = expandedRowId === rfqId ? null : rfqId;
    setExpandedRowId(newExpandedId);
    if (newExpandedId) {
        const rfqToEdit = requests.find(r => r.id === rfqId);
        // Format date for the input field
        const formattedDate = rfqToEdit.expectedDeliveryDate 
            ? new Date(rfqToEdit.expectedDeliveryDate).toISOString().split('T')[0]
            : '';
        setEditingRfq({...JSON.parse(JSON.stringify(rfqToEdit)), expectedDeliveryDate: formattedDate, editReason: '', isEditingDate: false});
    } else {
        setEditingRfq(null);
        setEditingError('');
    }
  };

  const handleDetailChange = (detailId, updatedValues) => {
    const newDetails = editingRfq.details.map(d => 
        d.id === detailId ? { ...d, ...updatedValues } : d
    );
    setEditingRfq({ ...editingRfq, details: newDetails });
  };

  const handleDateChange = (updatedValues) => {
    setEditingRfq({ ...editingRfq, ...updatedValues });
  };

  const handleAddProduct = (newProduct) => {
    const newDetail = {
        ...newProduct,
        id: `temp-${Date.now()}` // Temporary ID for local state
    };
    setEditingRfq({ ...editingRfq, details: [...editingRfq.details, newDetail] });
  };

  const handleDeleteDetail = (detailId) => {
    const newDetails = editingRfq.details.filter(d => d.id !== detailId);
    setEditingRfq({ ...editingRfq, details: newDetails });
  };

  const handleSave = async () => {
    if (editingRfq.isEditingDate && !editingRfq.editReason.trim()) {
        setEditingError('Vui lòng nhập lý do khi thay đổi ngày giao hàng.');
        return;
    }
    setEditingError('');
    setLoading(true);

    try {
        // This is a simplified update process.
        // A more robust solution would involve a single backend transaction.
        const originalRfq = requests.find(r => r.id === editingRfq.id);

        // 1. Update main RFQ info (date, notes)
        const rfqUpdatePayload = {
            id: editingRfq.id,
            rfqNumber: editingRfq.rfqNumber,
            customerId: editingRfq.customerId,
            expectedDeliveryDate: editingRfq.expectedDeliveryDate,
            status: editingRfq.status, // Should be 'DRAFT'
            notes: editingRfq.isEditingDate ? `Update reason: ${editingRfq.editReason}` : originalRfq.notes
        };
        await quoteService.updateRfq(editingRfq.id, rfqUpdatePayload);

        // 2. Sync details: add/update/delete
        const originalDetailIds = new Set(originalRfq.details.map(d => d.id));
        const currentDetailIds = new Set(editingRfq.details.map(d => d.id));

        // Deletions
        for (const detailId of originalDetailIds) {
            if (!currentDetailIds.has(detailId)) {
                await quoteService.deleteRfqDetail(detailId);
            }
        }

        // Additions & Updates
        for (const detail of editingRfq.details) {
            if (originalDetailIds.has(detail.id)) {
                // Update existing detail
                await quoteService.updateRfqDetail(detail.id, detail);
            } else {
                // Add new detail - construct a clean payload
                const newDetailPayload = {
                    productId: detail.productId,
                    quantity: detail.quantity,
                    unit: detail.unit,
                    notes: detail.notes
                };
                await quoteService.addRfqDetail(editingRfq.id, newDetailPayload);
            }
        }

        alert('Cập nhật thành công!');
        setExpandedRowId(null);
        setEditingRfq(null);
        await fetchAllData();

    } catch (error) {
        setEditingError(`Lỗi khi lưu: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!q) return requests;
    const keyword = q.toLowerCase();
    return requests.filter(r => r.rfqNumber.toLowerCase().includes(keyword));
  }, [q, requests]);

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <CustomerSidebar />
        <div className="flex-grow-1 layout-content">
          <Container fluid className="p-4">
            <h4 className="mb-3">Yêu cầu báo giá của tôi</h4>
            <Card className="shadow-sm">
                <Card.Body>
                    <InputGroup style={{ maxWidth: 420 }}>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control placeholder="Tìm theo mã RFQ..." value={q} onChange={(e)=>setQ(e.target.value)} />
                    </InputGroup>
                </Card.Body>
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                    <thead className="table-light">
                        <tr>
                        <th style={{ width: 60 }} className="text-center">#</th>
                        <th>Mã Yêu Cầu (RFQ)</th>
                        <th className="text-center">Số sản phẩm</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th style={{ width: 100 }} className="text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !requests.length ? (<tr><td colSpan={6} className="text-center py-4"><Spinner animation="border" size="sm" /> Đang tải...</td></tr>) : null}
                        {!loading && error && (<tr><td colSpan={6} className="text-danger text-center py-4">{error}</td></tr>)}
                        {!loading && !filteredRequests.length && (<tr><td colSpan={6} className="text-center py-4 text-muted">Không có yêu cầu nào.</td></tr>)}
                        {filteredRequests.map((req, idx) => (
                            <React.Fragment key={req.id}>
                                <tr>
                                    <td className="text-center">{idx + 1}</td>
                                    <td><div className="fw-semibold">{req.rfqNumber}</div></td>
                                    <td className="text-center">{req.details.length}</td>
                                    <td>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td><Badge bg="secondary">{req.status}</Badge></td>
                                    <td className="text-center">
                                        {req.status === 'QUOTED' ? (
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => {
                                                    let targetQuotationId = null;

                                                    if (req.quotationId) {
                                                        targetQuotationId = req.quotationId;
                                                    } else {
                                                        const foundQuotation = quotations.find(q => q.rfqId === req.id);
                                                        if (foundQuotation) {
                                                            targetQuotationId = foundQuotation.id;
                                                        }
                                                    }

                                                    if (targetQuotationId) {
                                                        navigate(`/customer/quotations/${targetQuotationId}`);
                                                    } else {
                                                        console.error(`Could not find quotation ID for RFQ ID: ${req.id}`);
                                                        // Optionally, show an error to the user
                                                    }
                                                }}
                                            >
                                                Xem báo giá
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => toggleRow(req.id)}
                                                aria-controls={`detail-${req.id}`}
                                                aria-expanded={expandedRowId === req.id}
                                            >
                                                {expandedRowId === req.id ? <FaChevronUp /> : <FaChevronDown />} Xem
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={6} className="p-0 border-0">
                                        <Collapse in={expandedRowId === req.id}>
                                            <div id={`detail-${req.id}`}>
                                                {editingRfq && expandedRowId === req.id && (
                                                    <RfqDetailView 
                                                        rfqData={editingRfq}
                                                        isEditable={editingRfq.status === 'DRAFT'} 
                                                        error={editingError}
                                                        onDetailChange={handleDetailChange}
                                                        onDateChange={handleDateChange}
                                                        onAddProductClick={() => setShowAddModal(true)}
                                                        onDeleteDetail={handleDeleteDetail}
                                                        onSave={handleSave}
                                                    />
                                                )}
                                            </div>
                                        </Collapse>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                    </Table>
                </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
      {editingRfq && (
        <AddProductToRfqModal 
            show={showAddModal}
            onHide={() => setShowAddModal(false)}
            onAddProduct={handleAddProduct}
        />
      )}
    </div>
  );
};

export default CustomerQuoteRequests;
