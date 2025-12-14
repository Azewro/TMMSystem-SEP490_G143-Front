import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { Container, Card, Table, Button, Form, InputGroup, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FaSearch, FaPlus, FaEdit, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { materialStockService } from '../../api/materialStockService';
import MaterialStockModal from '../../components/modals/MaterialStockModal';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';

registerLocale('vi', vi);

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

  // Sort state
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Handle sort click
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort icon for column
  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <FaSort className="ms-1 text-muted" style={{ opacity: 0.5 }} />;
    }
    return sortDirection === 'asc'
      ? <FaSortUp className="ms-1 text-primary" />
      : <FaSortDown className="ms-1 text-primary" />;
  };

  const parseDateString = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDateForBackend = (date) => {
    if (!date) return '';
    const iso = date.toISOString();
    return iso.split('T')[0]; // yyyy-MM-dd
  };

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

  // Sort materials client-side
  const sortedMaterialStocks = useMemo(() => {
    if (!sortColumn) return materialStocks;

    return [...materialStocks].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'materialCode':
          aValue = a.materialCode || '';
          bValue = b.materialCode || '';
          break;
        case 'materialName':
          aValue = a.materialName || '';
          bValue = b.materialName || '';
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        case 'unitPrice':
          aValue = a.unitPrice || 0;
          bValue = b.unitPrice || 0;
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        case 'receivedDate':
          aValue = a.receivedDate || '';
          bValue = b.receivedDate || '';
          break;
        default:
          return 0;
      }

      const comparison = String(aValue).localeCompare(String(bValue), 'vi');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [materialStocks, sortColumn, sortDirection]);

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

  if (loading && materialStocks.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole={getSidebarRole()} />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0" style={{ fontWeight: 600 }}>Quản lý nhập kho nguyên liệu</h3>
              <Button variant="primary" onClick={handleCreate}>
                <FaPlus className="me-2" />
                Nhập thêm nguyên liệu
              </Button>
            </div>

            {/* Search and Filters - Improved Design */}
            <Card className="mb-3 shadow-sm">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Tìm kiếm</Form.Label>
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
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày nhập hàng</Form.Label>
                      <div className="custom-datepicker-wrapper">
                        <DatePicker
                          selected={parseDateString(receivedDateFilter)}
                          onChange={(date) => {
                            if (date) {
                              setReceivedDateFilter(formatDateForBackend(date));
                            } else {
                              setReceivedDateFilter('');
                            }
                          }}
                          dateFormat="dd/MM/yyyy"
                          locale="vi"
                          className="form-control"
                          placeholderText="dd/mm/yyyy"
                          isClearable
                          todayButton="Hôm nay"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Card className="shadow-sm">
              <Card.Header>
                Danh sách nhập kho nguyên liệu
              </Card.Header>
              <Card.Body>
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>STT</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('materialCode')}
                      >
                        Mã NL {getSortIcon('materialCode')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('materialName')}
                      >
                        Tên nguyên liệu {getSortIcon('materialName')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('quantity')}
                        className="text-end"
                      >
                        Số lượng {getSortIcon('quantity')}
                      </th>
                      <th>Đơn vị</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('unitPrice')}
                        className="text-end"
                      >
                        Đơn giá {getSortIcon('unitPrice')}
                      </th>
                      <th className="text-end">Thành tiền</th>
                      <th>Số lô</th>
                      <th>Vị trí kho</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('receivedDate')}
                      >
                        Ngày nhập {getSortIcon('receivedDate')}
                      </th>
                      <th style={{ width: 100 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={10} className="text-center py-4">
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Đang tải...
                        </td>
                      </tr>
                    )}
                    {!loading && sortedMaterialStocks.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-4 text-muted">
                          {totalElements === 0 ? 'Chưa có nhập kho nguyên liệu nào' : 'Không tìm thấy nhập kho phù hợp với bộ lọc'}
                        </td>
                      </tr>
                    )}
                    {!loading && sortedMaterialStocks.map((stock, idx) => {
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
                          <td className="text-center">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleEdit(stock)}
                              title="Chỉnh sửa"
                            >
                              <FaEdit />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
                {/* Display pagination info */}
                {!loading && totalElements > 0 && (
                  <div className="text-center text-muted mt-2 small">
                    Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalElements)} trong tổng số {totalElements} bản ghi
                  </div>
                )}
              </Card.Body>
            </Card>
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
