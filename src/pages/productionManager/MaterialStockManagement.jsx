import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { materialStockService } from '../../api/materialStockService';
import MaterialStockModal from '../../components/modals/MaterialStockModal';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';

const MaterialStockManagement = () => {
  const { user: currentUser } = useAuth();

  // Map role from backend to sidebar role format
  const getSidebarRole = () => {
    if (!currentUser?.role) return 'production';
    const role = currentUser.role.toUpperCase();
    if (role.includes('PRODUCTION') && role.includes('MANAGER')) return 'production';
    if (role.includes('PRODUCTION')) return 'production';
    return 'production';
  };

  const [materialStocks, setMaterialStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [receivedDateFilter, setReceivedDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchMaterialStocks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const response = await materialStockService.getAllMaterialStocks(
        page,
        ITEMS_PER_PAGE,
        searchTerm || undefined,
        receivedDateFilter || undefined
      );

      // Handle PageResponse
      let stocks = [];
      if (response && response.content) {
        stocks = response.content;
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        stocks = response;
        setTotalPages(1);
        setTotalElements(response.length);
      }

      setMaterialStocks(stocks);
    } catch (err) {
      console.error('Failed to load material stocks:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách nhập kho nguyên liệu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, receivedDateFilter]);

  useEffect(() => {
    fetchMaterialStocks();
  }, [fetchMaterialStocks]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, receivedDateFilter]);

  const handleCreate = () => {
    setSelectedStock(null);
    setShowModal(true);
  };

  const handleEdit = (stock) => {
    setSelectedStock(stock);
    setShowModal(true);
  };

  const handleSave = async (stockData) => {
    try {
      if (selectedStock) {
        await materialStockService.updateMaterialStock(selectedStock.id, stockData);
        toast.success('Cập nhật nhập kho nguyên liệu thành công');
      } else {
        await materialStockService.createMaterialStock(stockData);
        toast.success('Tạo nhập kho nguyên liệu thành công');
      }
      setShowModal(false);
      setSelectedStock(null);
      await fetchMaterialStocks();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
      throw err;
    }
  };

  const handleDelete = async (stock) => {
    const materialInfo = stock.materialName || stock.materialCode || `ID: ${stock.id}`;
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhập kho nguyên liệu "${materialInfo}"?`)) {
      try {
        await materialStockService.deleteMaterialStock(stock.id);
        toast.success('Xóa nhập kho nguyên liệu thành công');
        await fetchMaterialStocks();
      } catch (err) {
        toast.error(err.message || 'Không thể xóa nhập kho nguyên liệu');
      }
    }
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

  const formatCurrency = (amount) => {
    if (!amount) return '—';
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
      }).format(amount);
    } catch {
      return amount.toString();
    }
  };

  const formatNumber = (num) => {
    if (num == null) return '—';
    try {
      return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch {
      return num.toString();
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
              <h4 className="mb-0">Quản lý nhập kho nguyên liệu</h4>
              <Button variant="primary" onClick={handleCreate}>
                <FaPlus className="me-2" />
                Nhập thêm nguyên liệu
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
                        placeholder="Tìm kiếm theo tên nguyên liệu, mã nguyên liệu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setCurrentPage(1);
                          }
                        }}
                      />
                    </InputGroup>
                  </div>
                  <div className="col-md-6">
                    <Form.Label>Lọc theo ngày nhập hàng</Form.Label>
                    <Form.Control
                      type="date"
                      value={receivedDateFilter}
                      onChange={(e) => setReceivedDateFilter(e.target.value)}
                    />
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
                      <th style={{ width: 60 }}>STT</th>
                      <th>Mã nguyên liệu</th>
                      <th>Tên nguyên liệu</th>
                      <th>Số lượng</th>
                      <th>Đơn vị</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                      <th>Số lô</th>
                      <th>Vị trí kho</th>
                      <th>Ngày nhập</th>
                      <th>Hạn sử dụng</th>
                      <th style={{ width: 140 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={12} className="text-center py-4">
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Đang tải...
                        </td>
                      </tr>
                    )}
                    {!loading && materialStocks.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center py-4 text-muted">
                          {totalElements === 0 ? 'Chưa có nhập kho nguyên liệu nào' : 'Không tìm thấy nhập kho phù hợp với bộ lọc'}
                        </td>
                      </tr>
                    )}
                    {!loading && materialStocks.map((stock, idx) => {
                      const totalAmount = stock.quantity && stock.unitPrice
                        ? stock.quantity * stock.unitPrice
                        : null;
                      return (
                        <tr key={stock.id}>
                          <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                          <td>
                            <strong>{stock.materialCode || '—'}</strong>
                          </td>
                          <td>{stock.materialName || '—'}</td>
                          <td className="text-end">{formatNumber(stock.quantity)}</td>
                          <td>{stock.unit || '—'}</td>
                          <td className="text-end">{formatCurrency(stock.unitPrice)}</td>
                          <td className="text-end fw-bold text-primary">{formatCurrency(totalAmount)}</td>
                          <td>{stock.batchNumber || '—'}</td>
                          <td>{stock.location || '—'}</td>
                          <td>{formatDate(stock.receivedDate)}</td>
                          <td>{formatDate(stock.expiryDate)}</td>
                          <td className="text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleEdit(stock)}
                                title="Chỉnh sửa"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(stock)}
                                title="Xóa"
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {/* Display pagination info */}
            {!loading && totalElements > 0 && (
              <div className="text-center text-muted mt-2">
                Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalElements)} trong tổng số {totalElements} bản ghi
              </div>
            )}
          </Container>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <MaterialStockModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedStock(null);
        }}
        onSave={handleSave}
        materialStock={selectedStock}
      />
    </div>
  );
};

export default MaterialStockManagement;

