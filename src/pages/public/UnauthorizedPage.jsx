import React from 'react';
import { Container, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';

const UnauthorizedPage = () => {
    const navigate = useNavigate();

    return (
        <div className="customer-layout">
            <Header />
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Card className="text-center shadow-sm p-4" style={{ maxWidth: '500px' }}>
                    <Card.Body>
                        <div className="mb-4 text-danger">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-shield-lock-fill" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm0 5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1z" />
                                <path d="M8 1c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0z" />
                            </svg>
                        </div>
                        <Card.Title as="h2" className="mb-3">Truy cập bị từ chối</Card.Title>
                        <Card.Text className="text-muted mb-4">
                            Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là một lỗi.
                        </Card.Text>
                        <div className="d-flex justify-content-center gap-3">
                            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                                Quay lại
                            </Button>
                            <Button variant="primary" onClick={() => navigate('/internal-login')}>
                                Đăng nhập lại
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default UnauthorizedPage;
