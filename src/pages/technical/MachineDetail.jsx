import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Card,
    Row,
    Col,
    Badge,
    Button,
    Table,
    Spinner,
    Alert,
    Pagination
} from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { format } from 'date-fns';
import { machineService } from '../../api/machineService';

const MachineDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [machine, setMachine] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch machine details
                const machineData = await machineService.getMachine(id);
                setMachine(machineData);

                // Fetch assignments with pagination
                const assignmentsData = await machineService.getAssignments(id, currentPage - 1, itemsPerPage);

                if (assignmentsData.content) {
                    setAssignments(assignmentsData.content);
                    setTotalPages(assignmentsData.totalPages);
                } else if (Array.isArray(assignmentsData)) {
                    setAssignments(assignmentsData);
                    setTotalPages(1);
                }

            } catch (err) {
                console.error("Failed to fetch machine details:", err);
                setError("Không thể tải thông tin máy.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, currentPage]);

    if (loading && !machine) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="p-4">
                <Alert variant="danger">{error}</Alert>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    <FaArrowLeft className="me-2" /> Quay lại
                </Button>
            </Container>
        );
    }

    if (!machine) return null;

    const getStatusBadge = (status) => {
        const statusMap = {
            'AVAILABLE': { bg: 'success', text: 'Sẵn sàng' },
            'MAINTENANCE': { bg: 'warning', text: 'Bảo trì' },
            'BROKEN': { bg: 'danger', text: 'Hỏng' },
            'IN_USE': { bg: 'info', text: 'Đang sử dụng' }
        };
        const statusInfo = statusMap[status] || { bg: 'secondary', text: status };
        return <Badge bg={statusInfo.bg}>{statusInfo.text}</Badge>;
    };

    return (
        <Container fluid className="p-4">
            <Button variant="outline-secondary" onClick={() => navigate('/technical/machines')} className="mb-3">
                <FaArrowLeft className="me-2" /> Quay lại danh sách
            </Button>

            <h4 className="mb-3">
                Chi tiết máy: {machine.name} ({machine.code})
            </h4>

            <Row>
                <Col md={4} className="mb-3">
                    <Card className="h-100 shadow-sm">
                        <Card.Header as="h6">Thông tin chung</Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <small className="text-muted d-block">Trạng thái</small>
                                {getStatusBadge(machine.status)}
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">Loại máy</small>
                                <strong>{machine.type}</strong>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">Vị trí</small>
                                <strong>{machine.location}</strong>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">Thông số kỹ thuật</small>
                                {(() => {
                                    try {
                                        const specs = machine.specifications ? JSON.parse(machine.specifications) : {};
                                        const labelMap = {
                                            brand: "Thương hiệu",
                                            power: "Công suất",
                                            modelYear: "Năm sản xuất",
                                            capacityUnit: "Đơn vị năng suất",
                                            capacityPerDay: "Năng suất/ngày",
                                            capacityPerHour: "Năng suất/giờ",
                                            bathTowels: "Khăn tắm",
                                            faceTowels: "Khăn mặt",
                                            sportsTowels: "Khăn thể thao"
                                        };

                                        if (Object.keys(specs).length === 0) return <span>Chưa cập nhật</span>;

                                        return (
                                            <Row className="mt-2">
                                                {Object.entries(specs).map(([key, value]) => (
                                                    <Col xs={6} key={key} className="mb-2">
                                                        <small className="text-muted d-block" style={{ fontSize: '0.8em' }}>
                                                            {labelMap[key] || key}
                                                        </small>
                                                        <strong>
                                                            {typeof value === 'object' && value !== null ? (
                                                                <ul className="list-unstyled mb-0" style={{ fontSize: '0.9em' }}>
                                                                    {Object.entries(value).map(([subKey, subValue]) => (
                                                                        <li key={subKey}>
                                                                            - {labelMap[subKey] || subKey}: {subValue}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                value
                                                            )}
                                                        </strong>
                                                    </Col>
                                                ))}
                                            </Row>
                                        );
                                    } catch (e) {
                                        return (
                                            <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit' }}>
                                                {machine.specifications || 'Chưa cập nhật'}
                                            </pre>
                                        );
                                    }
                                })()}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={8}>
                    <Card className="h-100 shadow-sm">
                        <Card.Header as="h6">Lịch sử hoạt động</Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Thời gian bắt đầu</th>
                                        <th>Thời gian kết thúc</th>
                                        <th>Loại tác vụ</th>
                                        <th>Trạng thái</th>
                                        <th>Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.length > 0 ? (
                                        assignments.map((assignment) => (
                                            <tr key={assignment.id}>
                                                <td>
                                                    {assignment.assignedAt ? format(new Date(assignment.assignedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                                </td>
                                                <td>
                                                    {assignment.releasedAt ? format(new Date(assignment.releasedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                                </td>
                                                <td>
                                                    <Badge bg="secondary" text="light">{assignment.reservationType}</Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={assignment.reservationStatus === 'ACTIVE' ? 'primary' : 'secondary'}>
                                                        {assignment.reservationStatus}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {assignment.productionStageId ? `Công đoạn ID: ${assignment.productionStageId}` : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-3">Chưa có lịch sử hoạt động</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                        {totalPages > 1 && (
                            <Card.Footer>
                                <div className="d-flex justify-content-center">
                                    <Pagination>
                                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                                        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
                                        {[...Array(totalPages)].map((_, idx) => {
                                            const page = idx + 1;
                                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                return (
                                                    <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                                                        {page}
                                                    </Pagination.Item>
                                                );
                                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                return <Pagination.Ellipsis key={page} />;
                                            }
                                            return null;
                                        })}
                                        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} />
                                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                                    </Pagination>
                                </div>
                            </Card.Footer>
                        )}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default MachineDetail;
