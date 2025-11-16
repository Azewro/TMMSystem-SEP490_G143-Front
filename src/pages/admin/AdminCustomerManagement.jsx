import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Form, InputGroup, Alert, Pagination } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEye, FaBuilding } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { customerService } from '../../api/customerService';
import CreateCustomerModal from '../../components/modals/CreateCustomerModal';
import toast from 'react-hot-toast';

const AdminCustomerManagement = () => {
  const { user: currentUser } = useAuth();
  
  // Map role from backend to sidebar role format
  const getSidebarRole = () => {
    if (!currentUser?.role) return 'admin';
    const role = currentUser.role.toUpperCase();
    if (role === 'ADMIN') return 'admin';
    return 'admin'; // Default to admin for admin pages
  };
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadCustomers();
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const response = await customerService.getAllCustomers(page, itemsPerPage, searchQuery || undefined, statusFilter !== '' ? statusFilter === 'true' : undefined);
      
      // Handle PageResponse
      let customersData = [];
      if (response && response.content) {
        customersData = response.content;
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        customersData = response;
        setTotalPages(1);
        setTotalElements(response.length);
      }
      
      setCustomers(customersData);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  // Note: Search and filter are now server-side, no client-side filtering needed

  const handleCreate = () => {
    setSelectedCustomer(null);
    setShowCreateModal(true);
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleSave = async (customerData) => {
    try {
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, customerData);
        toast.success('Cập nhật khách hàng thành công');
        // Reload customer data to get updated info
        const updatedCustomer = await customerService.getCustomerById(selectedCustomer.id);
        setSelectedCustomer(updatedCustomer);
      } else {
        await customerService.createCustomer(customerData);
        toast.success('Tạo khách hàng thành công');
        setShowCreateModal(false);
      }
      await loadCustomers();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
      throw err;
    }
  };


  const handleToggleStatus = async (customer) => {
    try {
      await customerService.setCustomerActive(customer.id, !customer.isActive);
      toast.success(`Đã ${customer.isActive ? 'vô hiệu hóa' : 'kích hoạt'} khách hàng`);
      await loadCustomers();
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái');
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
              <h4 className="mb-0">Danh sách khách hàng</h4>
              <Button variant="primary" onClick={handleCreate}>
                <FaPlus className="me-2" />
                Tạo khách hàng
              </Button>
            </div>

            {/* Search and Filters */}
            <Card className="mb-3 shadow-sm">
              <Card.Body>
                <div className="row g-3">
                  <div className="col-md-6">
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Tìm kiếm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </InputGroup>
                  </div>
                  <div className="col-md-6">
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="true">Active</option>
                      <option value="false">De-active</option>
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
                      <th>Tên công ty</th>
                      <th>Người liên hệ</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 140 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Đang tải...
                        </td>
                      </tr>
                    )}
                    {!loading && customers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          {totalElements === 0 ? 'Chưa có khách hàng nào' : 'Không tìm thấy khách hàng phù hợp với bộ lọc'}
                        </td>
                      </tr>
                    )}
                    {!loading && customers.map((customer, idx) => (
                      <tr key={customer.id}>
                        <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaBuilding className="me-2" size={20} />
                            {customer.companyName || '—'}
                          </div>
                        </td>
                        <td>{customer.contactPerson || '—'}</td>
                        <td>{customer.email || '—'}</td>
                        <td>{customer.phoneNumber || '—'}</td>
                        <td>
                          <Badge bg={customer.isActive ? 'success' : 'danger'} className="px-2 py-1">
                            {customer.isActive ? 'Active' : 'De-active'}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              size="sm"
                              variant={customer.isActive ? "danger" : "success"}
                              onClick={() => handleToggleStatus(customer)}
                              title={
                                customer.isActive
                                  ? 'Vô hiệu hóa khách hàng'
                                  : 'Kích hoạt khách hàng'
                              }
                            >
                              {customer.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            </Button>
                            <Button
                              size="sm"
                              variant="info"
                              onClick={() => handleView(customer)}
                              title="Xem chi tiết"
                            >
                              <FaEye />
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

      {/* Create Modal */}
      <CreateCustomerModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSave={handleSave}
        customer={null}
        mode="create"
      />

      {/* View Only Modal */}
      <CreateCustomerModal
        show={showViewModal}
        onHide={() => {
          setShowViewModal(false);
          setSelectedCustomer(null);
        }}
        onSave={handleSave}
        customer={selectedCustomer}
        mode="view"
        readOnly={true}
      />
    </div>
  );
};

export default AdminCustomerManagement;
