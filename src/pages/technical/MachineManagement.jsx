import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Form, InputGroup, Alert, Pagination } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaCog } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { machineService } from '../../api/machineService';
import CreateMachineModal from '../../components/modals/CreateMachineModal';
import toast from 'react-hot-toast';

const MachineManagement = () => {
  const { user: currentUser } = useAuth();
  
  // Map role from backend to sidebar role format
  const getSidebarRole = () => {
    if (!currentUser?.role) return 'technical';
    const role = currentUser.role.toUpperCase();
    if (role.includes('TECHNICAL')) return 'technical';
    return 'technical';
  };
  
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadMachines();
  }, [currentPage, searchQuery, typeFilter, statusFilter]);

  const loadMachines = async () => {
    setLoading(true);
    setError('');
    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const response = await machineService.getAllMachines(page, itemsPerPage, searchQuery || undefined, typeFilter || undefined, statusFilter || undefined);
      
      // Handle PageResponse
      let machinesData = [];
      if (response && response.content) {
        machinesData = response.content;
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        machinesData = response;
        setTotalPages(1);
        setTotalElements(response.length);
      }
      
      setMachines(machinesData);
    } catch (err) {
      console.error('Failed to load machines:', err);
      setError(err.message || 'Không thể tải danh sách máy');
    } finally {
      setLoading(false);
    }
  };

  // Note: Search and filter are now server-side, no client-side filtering needed

  useEffect(() => {
    // Reset to page 1 when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, typeFilter, statusFilter]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(machines.map(m => m.type).filter(Boolean))];
  }, [machines]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(machines.map(m => m.status).filter(Boolean))];
  }, [machines]);

  const handleCreate = () => {
    setSelectedMachine(null);
    setShowCreateModal(true);
  };

  const handleEdit = (machine) => {
    setSelectedMachine(machine);
    setShowCreateModal(true);
  };

  const handleSave = async (machineData) => {
    try {
      if (selectedMachine) {
        await machineService.updateMachine(selectedMachine.id, machineData);
        toast.success('Cập nhật máy thành công');
      } else {
        await machineService.createMachine(machineData);
        toast.success('Tạo máy thành công');
        setShowCreateModal(false);
      }
      await loadMachines();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
      throw err;
    }
  };

  const handleDelete = async (machine) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa máy "${machine.name}" (${machine.code})?`)) {
      try {
        await machineService.deleteMachine(machine.id);
        toast.success('Xóa máy thành công');
        await loadMachines();
      } catch (err) {
        toast.error(err.message || 'Không thể xóa máy');
      }
    }
  };

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

  const getTypeLabel = (type) => {
    const typeMap = {
      'WEAVING': 'Máy dệt',
      'WARPING': 'Máy mắc',
      'SEWING': 'Máy may',
      'CUTTING': 'Máy cắt'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole={getSidebarRole()} />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Danh sách máy</h4>
              <Button variant="primary" onClick={handleCreate}>
                <FaPlus className="me-2" />
                Tạo máy mới
              </Button>
            </div>

            {/* Search and Filters */}
            <Card className="mb-3 shadow-sm">
              <Card.Body>
                <div className="row g-3">
                  <div className="col-md-4">
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Tìm kiếm theo mã, tên, vị trí..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </InputGroup>
                  </div>
                  <div className="col-md-4">
                    <Form.Select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="">Tất cả loại máy</option>
                      {uniqueTypes.map(type => (
                        <option key={type} value={type}>{getTypeLabel(type)}</option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="col-md-4">
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Tất cả trạng thái</option>
                      {uniqueStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Mã máy</th>
                      <th>Tên máy</th>
                      <th>Loại</th>
                      <th>Vị trí</th>
                      <th>Trạng thái</th>
                      <th>Bảo trì tiếp theo</th>
                      <th style={{ width: 140 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Đang tải...
                        </td>
                      </tr>
                    )}
                    {!loading && machines.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          {totalElements === 0 ? 'Chưa có máy nào' : 'Không tìm thấy máy phù hợp với bộ lọc'}
                        </td>
                      </tr>
                    )}
                    {!loading && machines.map((machine, idx) => (
                      <tr key={machine.id}>
                        <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td>
                          <strong>{machine.code || '—'}</strong>
                        </td>
                        <td>{machine.name || '—'}</td>
                        <td>{getTypeLabel(machine.type)}</td>
                        <td>{machine.location || '—'}</td>
                        <td>{getStatusBadge(machine.status)}</td>
                        <td>{formatDate(machine.nextMaintenanceAt)}</td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleEdit(machine)}
                              title="Chỉnh sửa"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(machine)}
                              title="Xóa"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <Pagination>
                  <Pagination.First 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages)].map((_, idx) => {
                    const page = idx + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Pagination.Item>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <Pagination.Ellipsis key={page} />;
                    }
                    return null;
                  })}
                  <Pagination.Next 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last 
                    onClick={() => setCurrentPage(totalPages)} 
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </Container>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateMachineModal
        show={showCreateModal}
        onHide={() => {
          setShowCreateModal(false);
          setSelectedMachine(null);
        }}
        onSave={handleSave}
        machine={selectedMachine}
      />
    </div>
  );
};

export default MachineManagement;

