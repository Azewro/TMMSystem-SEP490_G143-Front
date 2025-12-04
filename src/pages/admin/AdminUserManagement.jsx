import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Form, InputGroup, Alert, Pagination } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { userService } from '../../api/userService';
import { roleService } from '../../api/roleService';
import CreateUserModal from '../../components/modals/CreateUserModal';
import toast from 'react-hot-toast';

const AdminUserManagement = () => {
  const { user: currentUser } = useAuth();

  // Map role from backend to sidebar role format
  const getSidebarRole = () => {
    if (!currentUser?.role) return 'admin';
    const role = currentUser.role.toUpperCase();
    if (role === 'ADMIN') return 'admin';
    return 'admin'; // Default to admin for admin pages
  };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [allRoles, setAllRoles] = useState([]);
  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    // Load all roles for filter dropdown
    const loadRoles = async () => {
      try {
        const roles = await roleService.getAllRoles();
        setAllRoles(Array.isArray(roles) ? roles : []);
      } catch (err) {
        console.error('Failed to load roles:', err);
      }
    };
    loadRoles();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const response = await userService.getAllUsers(page, itemsPerPage, searchQuery || undefined, roleFilter || undefined, statusFilter !== '' ? statusFilter === 'true' : undefined);

      // Handle PageResponse
      let usersData = [];
      if (response && response.content) {
        usersData = response.content;
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        usersData = response;
        setTotalPages(1);
        setTotalElements(response.length);
      }

      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  // Note: Search and filter are now server-side, no client-side filtering needed

  const handleCreate = () => {
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowCreateModal(true);
  };

  const handleSave = async (userData) => {
    try {
      if (selectedUser) {
        await userService.updateUser(selectedUser.id, userData);
        toast.success('Cập nhật tài khoản thành công');
      } else {
        await userService.createUser(userData);
        toast.success('Tạo tài khoản thành công');
      }
      await loadUsers();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
      throw err;
    }
  };

  // Check if user is admin
  const isAdmin = (user) => {
    const roleName = (user.roleName || '').toUpperCase();
    return roleName === 'ADMIN' || roleName.includes('ADMIN');
  };

  // Check if user can toggle status
  const canToggleStatus = (user) => {
    // Cannot toggle status for admin users
    if (isAdmin(user)) {
      return false;
    }
    // Cannot toggle status for own account
    if (user.id === currentUser?.id) {
      return false;
    }
    return true;
  };

  const handleToggleStatus = async (user) => {
    // Double check before toggling
    if (!canToggleStatus(user)) {
      toast.error('Không thể thay đổi trạng thái tài khoản này');
      return;
    }

    try {
      await userService.setUserActive(user.id, !user.isActive);
      toast.success(`Đã ${user.isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản`);
      await loadUsers();
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
              <h4 className="mb-0">Danh sách tài khoản</h4>
              <Button variant="primary" onClick={handleCreate}>
                <FaPlus className="me-2" />
                Tạo tài khoản
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
                        placeholder="Tìm kiếm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </InputGroup>
                  </div>
                  <div className="col-md-4">
                    <Form.Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="">Tất cả vai trò</option>
                      {allRoles.map(role => (
                        <option key={role.id} value={role.name}>{role.name}</option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="col-md-4">
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
                      <th>Họ và tên</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                      <th>Vai trò</th>
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
                    {!loading && users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          {totalElements === 0 ? 'Chưa có tài khoản nào' : 'Không tìm thấy tài khoản phù hợp với bộ lọc'}
                        </td>
                      </tr>
                    )}
                    {!loading && users.map((user, idx) => (
                      <tr key={user.id}>
                        <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaUserCircle className="me-2" size={20} />
                            {user.name || '—'}
                          </div>
                        </td>
                        <td>{user.email || '—'}</td>
                        <td>{user.phoneNumber || '—'}</td>
                        <td>{user.roleName || '—'}</td>
                        <td>
                          <Badge bg={user.isActive ? 'success' : 'danger'} className="px-2 py-1">
                            {user.isActive ? 'Hoạt động' : 'Bị Vô Hiệu Hóa'}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              size="sm"
                              variant={user.isActive ? "danger" : "success"}
                              onClick={() => handleToggleStatus(user)}
                              disabled={!canToggleStatus(user)}
                              title={
                                !canToggleStatus(user)
                                  ? isAdmin(user)
                                    ? 'Không thể thay đổi trạng thái tài khoản Admin'
                                    : 'Không thể thay đổi trạng thái tài khoản của chính bạn'
                                  : user.isActive
                                    ? 'Vô hiệu hóa tài khoản'
                                    : 'Kích hoạt tài khoản'
                              }
                            >
                              {user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleEdit(user)}
                            >
                              <FaEdit />
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
      <CreateUserModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSave={handleSave}
        user={selectedUser}
        roles={allRoles}
      />
    </div>
  );
};

export default AdminUserManagement;
