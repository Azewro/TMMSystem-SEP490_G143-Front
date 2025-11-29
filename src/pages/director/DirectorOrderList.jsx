import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { contractService } from '../../api/contractService';
import { customerService } from '../../api/customerService';
import Pagination from '../../components/Pagination';
import '../../styles/QuoteRequests.css';

import { getDirectorContractStatus } from '../../utils/statusMapper';

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

const DirectorOrderList = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state for view details
    const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
    const [viewDetailsContract, setViewDetailsContract] = useState(null);
    const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
    const [viewDetailsData, setViewDetailsData] = useState(null);

    // Search and Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deliveryDateFilter, setDeliveryDateFilter] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const ITEMS_PER_PAGE = 10;

    const loadContracts = async () => {
        setLoading(true);
        setError('');

        try {
            // Convert 1-based page to 0-based for backend
            const page = currentPage - 1;
            const response = await contractService.getAllContracts(
                page,
                ITEMS_PER_PAGE,
                searchTerm || undefined,
                statusFilter || undefined,
                deliveryDateFilter || undefined
            );

            let contractsArray = [];
            if (response && response.content) {
                contractsArray = response.content;
                setTotalPages(response.totalPages || 1);
                setTotalElements(response.totalElements || 0);
            } else if (Array.isArray(response)) {
                contractsArray = response;
                setTotalPages(1);
                setTotalElements(response.length);
            }

            // Enrich contracts with customer info if needed
            // Note: getAllContracts might already return customer info or we might need to fetch it.
            // Based on ContractUpload, it seems we might need to fetch customers or the contract object has customerId.
            // Let's assume we need to fetch customer details if not present.

            const enrichedContracts = await Promise.all(contractsArray.map(async (contract) => {
                if (contract.customer) return contract; // Already has customer info
                if (contract.customerId) {
                    try {
                        const customer = await customerService.getCustomerById(contract.customerId);
                        return { ...contract, customer };
                    } catch (e) {
                        console.warn('Failed to fetch customer', e);
                        return contract;
                    }
                }
                return contract;
            }));

            setContracts(enrichedContracts);
        } catch (err) {
            console.error('Failed to load contracts', err);
            setError(err.message || 'Không thể tải danh sách đơn hàng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContracts();
    }, [currentPage, searchTerm, statusFilter, deliveryDateFilter]);

    const openViewDetailsModal = async (contract) => {
        setViewDetailsContract(contract);
        setViewDetailsModalOpen(true);
        setViewDetailsLoading(true);
        setViewDetailsData(null);

        try {
            const details = await contractService.getOrderDetails(contract.id);
            setViewDetailsData(details);
        } catch (err) {
            console.error('Unable to load contract details', err);
            setError(err.message || 'Không thể tải chi tiết đơn hàng.');
        } finally {
            setViewDetailsLoading(false);
        }
    };

    const closeViewDetailsModal = () => {
        setViewDetailsModalOpen(false);
        setViewDetailsContract(null);
        setViewDetailsData(null);
    };

    return (
        <div className="customer-layout">
            <Header />
            <div className="d-flex">
                <InternalSidebar userRole="director" />
                <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
                    <Container fluid className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h1 className="mb-0">Quản lý đơn hàng</h1>
                        </div>

                        {error && (
                            <Alert variant="danger" onClose={() => setError('')} dismissible>
                                {error}
                            </Alert>
                        )}

                        <Card className="shadow-sm">
                            <Card.Body>
                                {/* Search and Filter Section */}
                                <Row className="mb-3">
                                    <Col md={4}>
                                        <InputGroup>
                                            <InputGroup.Text><FaSearch /></InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Tìm kiếm theo mã đơn hàng..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select
                                            value={statusFilter}
                                            onChange={(e) => {
                                                setStatusFilter(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <option value="">Tất cả trạng thái</option>
                                            <option value="PENDING_APPROVAL">Chờ duyệt</option>
                                            <option value="APPROVED">Đã duyệt</option>
                                            <option value="REJECTED">Đã từ chối</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="mb-1">Lọc theo ngày giao hàng</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={deliveryDateFilter}
                                                onChange={(e) => {
                                                    setDeliveryDateFilter(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: 60 }}>#</th>
                                            <th style={{ width: 180 }}>Mã đơn hàng</th>
                                            <th style={{ width: 160 }}>Tên khách hàng</th>
                                            <th style={{ width: 140 }}>Số điện thoại</th>
                                            <th style={{ width: 160 }}>Ngày giao hàng</th>
                                            <th style={{ width: 160 }}>Trạng thái</th>
                                            <th style={{ width: 160 }}>Tổng giá trị</th>
                                            <th style={{ width: 160 }} className="text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4">
                                                    <Spinner animation="border" size="sm" className="me-2" /> Đang tải đơn hàng...
                                                </td>
                                            </tr>
                                        ) : contracts.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4 text-muted">
                                                    {totalElements === 0
                                                        ? 'Không có đơn hàng nào.'
                                                        : 'Không tìm thấy đơn hàng phù hợp với bộ lọc.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            contracts.map((contract, index) => {
                                                const statusObj = getDirectorContractStatus(contract.status);
                                                return (
                                                    <tr key={contract.id}>
                                                        <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                                        <td className="fw-semibold text-primary">{contract.contractNumber}</td>
                                                        <td>{contract.customer?.contactPerson || contract.customer?.companyName || 'N/A'}</td>
                                                        <td>{contract.customer?.phoneNumber || 'N/A'}</td>
                                                        <td>{formatDate(contract.deliveryDate)}</td>
                                                        <td>
                                                            <Badge bg={statusObj.variant}>{statusObj.label}</Badge>
                                                        </td>
                                                        <td className="text-success fw-semibold">{formatCurrency(contract.totalAmount)}</td>
                                                        <td className="text-center">
                                                            <Button variant="primary" size="sm" onClick={() => openViewDetailsModal(contract)}>
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
                            {totalPages > 1 && (
                                <Card.Footer>
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </Card.Footer>
                            )}
                        </Card>
                    </Container>
                </div>
            </div>

            {/* View Details Modal */}
            <Modal
                show={viewDetailsModalOpen}
                onHide={closeViewDetailsModal}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {viewDetailsLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" size="sm" className="me-2" /> Đang tải chi tiết đơn hàng...
                        </div>
                    ) : viewDetailsData && viewDetailsContract ? (
                        <div>
                            {/* Customer Information */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <strong>Thông tin khách hàng</strong>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-2"><strong>Tên khách hàng:</strong> {viewDetailsContract.customer?.contactPerson || viewDetailsContract.customer?.companyName || viewDetailsData.customerInfo?.customerName || 'N/A'}</p>
                                            <p className="mb-2"><strong>Công ty:</strong> {viewDetailsContract.customer?.companyName || viewDetailsData.customerInfo?.companyName || 'N/A'}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-2"><strong>Số điện thoại:</strong> {viewDetailsContract.customer?.phoneNumber || viewDetailsData.customerInfo?.phoneNumber || 'N/A'}</p>
                                            <p className="mb-2"><strong>Email:</strong> {viewDetailsContract.customer?.email || viewDetailsData.customerInfo?.email || 'N/A'}</p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Order Information */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <strong>Thông tin đơn hàng</strong>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-2"><strong>Mã đơn hàng:</strong> {viewDetailsContract.contractNumber || viewDetailsData.contractNumber}</p>
                                            <p className="mb-2"><strong>Ngày giao hàng:</strong> {formatDate(viewDetailsContract.deliveryDate || viewDetailsData.deliveryDate)}</p>
                                            <p className="mb-2"><strong>Tổng giá trị:</strong> <span className="text-success fw-semibold">{formatCurrency(viewDetailsContract.totalAmount || viewDetailsData.totalAmount)}</span></p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-2"><strong>Trạng thái:</strong>
                                                {(() => {
                                                    const statusObj = getDirectorContractStatus(viewDetailsContract.status);
                                                    return <Badge bg={statusObj.variant} className="ms-2">{statusObj.label}</Badge>;
                                                })()}
                                            </p>
                                        </Col>
                                    </Row>

                                    {/* Order Items Table */}
                                    {viewDetailsData.orderItems && viewDetailsData.orderItems.length > 0 && (
                                        <div className="mt-3">
                                            <h6 className="mb-2">Danh sách sản phẩm:</h6>
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
                                                    {viewDetailsData.orderItems.map((item, index) => (
                                                        <tr key={item.productId || index}>
                                                            <td>{item.productName}</td>
                                                            <td>{item.quantity?.toLocaleString('vi-VN')}</td>
                                                            <td>{formatCurrency(item.unitPrice)}</td>
                                                            <td>{formatCurrency(item.totalPrice)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Notes */}
                            {(viewDetailsContract.directorApprovalNotes || viewDetailsData.notes) && (
                                <Card>
                                    <Card.Header>
                                        <strong>Ghi chú</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-0">{viewDetailsContract.directorApprovalNotes || viewDetailsData.notes}</p>
                                    </Card.Body>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <Alert variant="warning">Không tìm thấy chi tiết đơn hàng.</Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeViewDetailsModal}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default DirectorOrderList;
