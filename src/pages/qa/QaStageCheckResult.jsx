import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { orderService } from '../../api/orderService';
import { qcService } from '../../api/qcService';
import toast from 'react-hot-toast';

const QaStageCheckResult = () => {
  const navigate = useNavigate();
  const { orderId, stageCode } = useParams(); // Route uses :stageCode, not :stageId
  const [qaResult, setQaResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStageResult = async () => {
      try {
        setLoading(true);
        
        // First, fetch order to get stages and find the stage by stageCode
        const orderData = await orderService.getOrderById(orderId);
        
        // Find stage by stageCode (stageType)
        const foundStage = orderData.stages?.find(s => 
          s.stageType === stageCode || 
          s.stageType === stageCode.toUpperCase()
        );
        
        if (!foundStage) {
          throw new Error(`Stage not found for code: ${stageCode}`);
        }
        
        // Fetch full stage details using stage ID
        const stage = await productionService.getStage(foundStage.id);

        // Fetch inspection criteria/results
        let inspections = [];
        try {
          inspections = await qcService.getStageInspections(foundStage.id);
        } catch (inspectionError) {
          console.warn('Could not load inspection criteria:', inspectionError);
        }
        const criteria = (inspections || []).map((item, index) => ({
          title: item.checkpointName || `Tiêu chí ${index + 1}`,
          result: (item.result || 'PASS').toUpperCase(),
          remark: item.notes,
          image: item.photoUrl
        }));
        
        // Map backend data to match mock structure
        const mapped = {
          lotCode: orderData.lotCode || orderData.poNumber || 'N/A',
          productName: orderData.productName || orderData.contract?.contractNumber || 'N/A',
          criteria,
          overall: stage.executionStatus === 'QC_PASSED' ? 'PASS' : 
                   (stage.executionStatus === 'QC_FAILED' ? 'FAIL' : 'PENDING'),
          summary: stage.executionStatus === 'QC_PASSED' ? 'Tất cả tiêu chí đều Đạt.' : 
                   (stage.executionStatus === 'QC_FAILED' ? 'Có tiêu chí Không đạt. Vui lòng xử lý lỗi theo quy định.' : 'Chưa có kết quả kiểm tra'),
          defectLevel: stage.defectLevel,
          defectDescription: stage.defectDescription,
          stageType: stage.stageType || stageCode
        };
        setQaResult(mapped);
      } catch (error) {
        console.error('Error fetching stage result:', error);
        toast.error('Không thể tải kết quả kiểm tra');
      } finally {
        setLoading(false);
      }
    };
    if (orderId && stageCode) fetchStageResult();
  }, [orderId, stageCode]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!qaResult) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="qa" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={() => navigate(`/qa/orders/${orderId}`)}>&larr; Quay lại</Button>
            <div className="alert alert-warning mt-3">Không tìm thấy kết quả kiểm tra</div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="qa" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate(`/qa/orders/${orderId || 'LOT-002'}`)}>
              &larr; Quay lại kế hoạch
            </Button>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h4 className="mb-1">Kết quả Kiểm Tra</h4>
                    <div className="text-muted small">
                      {qaResult.lotCode} • {qaResult.productName}
                    </div>
                    <div className="text-muted small">
                      Công đoạn: <strong>{qaResult.stageType || 'N/A'}</strong>
                    </div>
                  </div>
                  <Badge bg={qaResult.overall === 'PASS' ? 'success' : 'danger'}>
                    {qaResult.overall === 'PASS' ? 'Đạt' : 'Không đạt'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <h6 className="mb-3">Tiêu chí kiểm tra</h6>
                {qaResult.criteria.length === 0 ? (
                  <div className="text-muted small">
                    Chưa có tiêu chí kiểm tra nào được lưu cho công đoạn này.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {qaResult.criteria.map((criteria) => (
                      <div
                        key={criteria.title}
                        className="p-3 rounded"
                        style={{
                          border: `1px solid ${criteria.result === 'PASS' ? '#c3ebd3' : '#f9cfd9'}`,
                          backgroundColor: criteria.result === 'PASS' ? '#e8f7ef' : '#fdecef',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="fw-semibold">{criteria.title}</div>
                          <Badge bg={criteria.result === 'PASS' ? 'success' : 'danger'}>
                            {criteria.result === 'PASS' ? 'Đạt' : 'Không đạt'}
                          </Badge>
                        </div>
                        {criteria.image && (
                          <img
                            src={criteria.image}
                            alt={criteria.title}
                            className="rounded mb-2"
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        )}
                        {criteria.remark && <div className="text-muted small">{criteria.remark}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card
              className="shadow-sm"
              style={{
                borderColor: qaResult.overall === 'PASS' ? '#c3e6cb' : '#f5c2c7',
                backgroundColor: qaResult.overall === 'PASS' ? '#e9f7ef' : '#fdecec',
              }}
            >
              <Card.Body>
                <div className="fw-semibold mb-2">
                  Kết quả kiểm tra: <span>{qaResult.overall === 'PASS' ? 'Đạt' : 'Không đạt'}</span>
                </div>
                <div className="text-muted small mb-2">{qaResult.summary}</div>
                {qaResult.overall === 'FAIL' && (
                  <div className="d-flex flex-column gap-1">
                    <div>
                      <span className="text-muted small me-1">Mức độ lỗi:</span>
                      <strong>{qaResult.defectLevel || 'Chưa xác định'}</strong>
                    </div>
                    <div>
                      <span className="text-muted small me-1">Mô tả lỗi:</span>
                      <span>{qaResult.defectDescription || 'Chưa ghi chú'}</span>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QaStageCheckResult;

