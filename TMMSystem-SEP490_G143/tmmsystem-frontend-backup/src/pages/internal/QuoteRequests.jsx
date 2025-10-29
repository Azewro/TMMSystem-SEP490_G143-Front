import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import '../../styles/QuoteRequests.css';
import { quoteService } from '../../api/quoteService';
import { useNavigate } from 'react-router-dom';

const QuoteRequests = () => {
  const navigate = useNavigate();
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [loading, setLoading] = useState(true);

  // Mock data matching your exact layout (fallback)
  const mockQuoteRequests = [
    {
      id: 1,
      rfqCode: 'RFQ-2025-001',
      customerName: 'Nguyễn Văn An',
      company: 'Công ty TNHH ABC',
      createdDate: '01/10/2025',
      productCount: 5,
      status: 'Chờ xử lý',
      statusColor: 'warning'
    },
    {
      id: 2,
      rfqCode: 'RFQ-2025-002',
      customerName: 'Trần Thị Bình',
      company: 'Công ty Cổ phần XYZ',
      createdDate: '03/10/2025',
      productCount: 8,
      status: 'Đã gửi',
      statusColor: 'primary'
    },
    {
      id: 3,
      rfqCode: 'RFQ-2025-003',
      customerName: 'Lê Minh Châu',
      company: 'Tập đoàn DEF',
      createdDate: '05/10/2025',
      productCount: 3,
      status: 'Đã duyệt',
      statusColor: 'success'
    },
    {
      id: 4,
      rfqCode: 'RFQ-2025-004',
      customerName: 'Phạm Văn Dũng',
      company: 'Công ty TNHH GHI',
      createdDate: '07/10/2025',
      productCount: 12,
      status: 'Từ chối',
      statusColor: 'danger'
    },
    {
      id: 5,
      rfqCode: 'RFQ-2025-005',
      customerName: 'Hoàng Thị Em',
      company: 'Công ty CP JKL',
      createdDate: '08/10/2025',
      productCount: 6,
      status: 'Chờ xử lý',
      statusColor: 'warning'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        console.log('Starting endpoint discovery...');
        const discovery = await quoteService.discoverEndpoints();

        if (discovery) {
          console.log('Found working endpoint!', discovery.endpoint);

          try {
            const realRfqs = await quoteService.getAllQuoteRequests();
            console.log('Real RFQ data:', realRfqs);

            if (realRfqs && realRfqs.length > 0) {
              try {
                // Try to fetch customer data
                console.log('Fetching customer data...');
                const customers = await quoteService.getAllCustomers();
                console.log('Customer data:', customers);
                if (customers && customers.length > 0) {
                  console.log('First customer structure:', Object.keys(customers[0]));
                  console.log('First customer data:', customers[0]);
                }
                const customerMap = {};
                if (customers && customers.length > 0) {
                  customers.forEach(customer => {
                    customerMap[customer.id] = customer;
                  });
                }

                // Transform real data with customer information
                const transformedRfqs = realRfqs.map((rfq, index) => {
                  const customer = customerMap[rfq.customerId];
                  return {
                    id: rfq.id || index + 1,
                    rfqCode: rfq.rfqNumber || `RFQ-${rfq.id}`,
                    customerName: customer?.contactPerson || `Customer ${rfq.customerId}`,
                    company: customer?.companyName || customer?.company || customer?.businessName || `Company ${rfq.customerId}`,
                    createdDate: rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                    productCount: rfq.details?.length || 0,
                    status: rfq.status === 'DRAFT' ? 'Chờ xử lý' :
                      rfq.status === 'SENT' ? 'Đã gửi' :
                        rfq.status === 'QUOTED' ? 'Đã báo giá' :
                          rfq.status === 'APPROVED' ? 'Đã duyệt' :
                            rfq.status === 'REJECTED' ? 'Từ chối' : 'Chờ xử lý',
                    statusColor: rfq.status === 'DRAFT' ? 'warning' :
                      rfq.status === 'SENT' ? 'primary' :
                        rfq.status === 'QUOTED' ? 'info' :
                          rfq.status === 'APPROVED' ? 'success' :
                            rfq.status === 'REJECTED' ? 'danger' : 'warning'
                  };
                });

                const reversedRfqs = transformedRfqs.reverse();

                console.log('Using real RFQ data with customers:', reversedRfqs.length, 'RFQs');
                setQuoteRequests(reversedRfqs);
                setFilteredRequests(reversedRfqs);

              } catch (customerError) {
                console.warn('Could not fetch customer data, using RFQ data without customer details:', customerError);

                // Transform without customer data
                const transformedRfqs = realRfqs.map((rfq, index) => ({
                  id: rfq.id || index + 1,
                  rfqCode: rfq.rfqNumber || `RFQ-${rfq.id}`,
                  customerName: `Customer ${rfq.customerId}`,
                  company: `Company ${rfq.customerId}`,
                  createdDate: rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                  productCount: rfq.details?.length || 0,
                  status: rfq.status === 'DRAFT' ? 'Chờ xử lý' :
                    rfq.status === 'SENT' ? 'Đã gửi' :
                      rfq.status === 'QUOTED' ? 'Đã báo giá' :
                        rfq.status === 'APPROVED' ? 'Đã duyệt' :
                          rfq.status === 'REJECTED' ? 'Từ chối' : 'Chờ xử lý',
                  statusColor: rfq.status === 'DRAFT' ? 'warning' :
                    rfq.status === 'SENT' ? 'primary' :
                      rfq.status === 'QUOTED' ? 'info' :
                        rfq.status === 'APPROVED' ? 'success' :
                          rfq.status === 'REJECTED' ? 'danger' : 'warning'
                }));

                setQuoteRequests(transformedRfqs);
                setFilteredRequests(transformedRfqs);
              }
            } else {
              console.log('No real RFQs found, using mock data');
              setQuoteRequests(mockQuoteRequests);
              setFilteredRequests(mockQuoteRequests);
            }
          } catch (fetchError) {
            console.error('Error fetching real RFQs:', fetchError);
            console.log('Falling back to mock data');
            setQuoteRequests(mockQuoteRequests);
            setFilteredRequests(mockQuoteRequests);
          }
        } else {
          console.log('No RFQ endpoints found, using mock data');
          setQuoteRequests(mockQuoteRequests);
          setFilteredRequests(mockQuoteRequests);
        }
      } catch (error) {
        console.error('Error in endpoint discovery:', error);
        console.log('Using mock data as fallback');
        setQuoteRequests(mockQuoteRequests);
        setFilteredRequests(mockQuoteRequests);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    if (status === 'Tất cả trạng thái') {
      setFilteredRequests(quoteRequests);
    } else {
      setFilteredRequests(quoteRequests.filter(req => req.status === status));
    }
  };

  const handleViewDetails = (request) => {
  navigate(`/internal/rfq-detail/${request.id}`);
};

  return (
    <div className="internal-layout">
      <Header />

      <div className="d-flex">
        <InternalSidebar />

        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="quote-requests-dashboard">
              <div className="dashboard-header mb-4">
                <h1 className="dashboard-title">Danh sách Yêu cầu Báo giá</h1>
              </div>

              <Row className="mb-4">
                <Col md={3}>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    className="status-filter"
                  >
                    <option>Tất cả trạng thái</option>
                    <option>Chờ xử lý</option>
                    <option>Đã gửi</option>
                    <option>Đã báo giá</option>
                    <option>Đã duyệt</option>
                    <option>Từ chối</option>
                  </Form.Select>
                </Col>
              </Row>

              <Card className="quote-table-card shadow-sm">
                <Card.Body className="p-0">
                  <Table responsive hover className="quote-requests-table mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th style={{ width: '150px' }}>Mã RFQ</th>
                        <th style={{ width: '200px' }}>Người đại diện</th>
                        <th style={{ width: '200px' }}>Công ty</th>
                        <th style={{ width: '120px' }}>Ngày tạo đơn</th>
                        <th style={{ width: '120px' }}>Số lượng sản phẩm</th>
                        <th style={{ width: '120px' }}>Trạng thái</th>
                        <th style={{ width: '100px' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            Đang kiểm tra API và tải dữ liệu...
                          </td>
                        </tr>
                      ) : filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            Không có yêu cầu báo giá nào
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((request, index) => (
                          <tr key={request.id}>
                            <td>{index + 1}</td>
                            <td>
                              <span className="rfq-code">{request.rfqCode}</span>
                            </td>
                            <td>{request.customerName}</td>
                            <td>{request.company}</td>
                            <td>{request.createdDate}</td>
                            <td className="text-center">{request.productCount}</td>
                            <td>
                              <Badge bg={request.statusColor} className="status-badge">
                                {request.status}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                                className="detail-button"
                                title="Chi tiết"
                              >
                                <FaEye />
                                <span className="ms-1">Chi tiết</span>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <div className="pagination-info mt-3">
                <small className="text-muted">
                  Hiển thị {filteredRequests.length} / {quoteRequests.length} yêu cầu báo giá
                </small>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QuoteRequests;
