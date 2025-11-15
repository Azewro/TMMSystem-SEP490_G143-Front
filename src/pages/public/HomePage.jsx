import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Form, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { productService } from '../../api/productService';
import ProductCard from '../../components/ProductCard';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import Pagination from '../../components/Pagination';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import '../../styles/CustomerHomePage.css';

const PartnerLogo = ({ name }) => (
    <div className="partner-logo">
        <p>{name}</p>
    </div>
);

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const productsPerPage = 8;
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const productData = await productService.getAllProducts();
                setProducts(productData || []);
            } catch (err) {
                setError(err.message || 'Lỗi khi tải dữ liệu sản phẩm.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const partners = ["Vinaphone", "California Fitness", "Foxconn", "Everon", "Hải Tiến Resort"];

    // Filter products by search term (search by key words in product name)
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return products;
        const searchLower = searchTerm.toLowerCase().trim();
        const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
        
        return products.filter(product => {
            const productNameLower = (product.name || '').toLowerCase();
            // Check if all search words are found in product name
            return searchWords.every(word => productNameLower.includes(word));
        });
    }, [products, searchTerm]);

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page when searching
    };

    return (
        <>
            <Header />
            <div className="d-flex">
                {isAuthenticated && <Sidebar />}
                <div className="flex-grow-1">
                    <div className="customer-home-page">
                        <section className="hero-banner text-white text-center">
                            <Container>
                                <h1 className="hero-title">Khăn Bông Mỹ Đức</h1>
                                <p className="hero-subtitle">Chất lượng mềm mại, trải nghiệm đẳng cấp.</p>
                                <Button variant="light" size="lg" href="#featured-products">Xem Sản Phẩm</Button>
                            </Container>
                        </section>

                        <section className="about-us-section py-5">
                            <Container>
                                <Row className="align-items-center">
                                    <Col md={6}>
                                        <img src="/banner.png" alt="Khăn Bông Mỹ Đức" className="img-fluid rounded shadow" />
                                    </Col>
                                    <Col md={6}>
                                        <h2 className="section-title">Về Chúng Tôi</h2>
                                        <p className="lead">
                                            <strong>Khăn bông Mỹ Đức</strong> là thương hiệu khăn bông được các doanh nghiệp về khách sạn và spa tại Hà Nội rất tin tưởng và yêu mến.
                                        </p>
                                        <p>
                                            Trải qua hơn 15 năm phát triển, chúng tôi tự hào đã được các khách hàng lớn tín nhiệm, khẳng định vị thế và chất lượng sản phẩm vượt trội.
                                        </p>
                                    </Col>
                                </Row>
                            </Container>
                        </section>

                        <section id="featured-products" className="featured-products-section py-5 bg-light">
                            <Container>
                                <div className="text-center mb-4">
                                    <h2 className="section-title">Danh sách sản phẩm</h2>
                                    <p className="section-subtitle">Chất lượng tạo nên thương hiệu. Chọn sản phẩm và yêu cầu báo giá để nhận được ưu đãi tốt nhất.</p>
                                </div>

                                {/* Search Bar */}
                                <div className="mb-4">
                                    <Row className="justify-content-center">
                                        <Col md={6}>
                                            <InputGroup>
                                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Tìm kiếm sản phẩm..."
                                                    value={searchTerm}
                                                    onChange={handleSearchChange}
                                                />
                                            </InputGroup>
                                        </Col>
                                    </Row>
                                </div>

                                {loading && (
                                    <div className="text-center">
                                        <Spinner animation="border" variant="primary" />
                                        <p className="mt-2">Đang tải sản phẩm...</p>
                                    </div>
                                )}

                                {error && <Alert variant="danger">{error}</Alert>}

                                {!loading && !error && (
                                    <>
                                        <Row xs={1} md={2} lg={4} xl={4} className="g-4">
                                            {currentProducts.map((product) => (
                                                <Col key={product.id}>
                                                    <ProductCard product={product} />
                                                </Col>
                                            ))}
                                        </Row>
                                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                                    </>
                                )}
                            </Container>
                        </section>

                        <section className="partners-section py-5">
                            <Container className="text-center">
                                <h2 className="section-title mb-5">Đối Tác Tin Cậy Của Chúng Tôi</h2>
                                <Row className="justify-content-center align-items-center">
                                    {partners.map(partner => (
                                        <Col key={partner} xs={6} md={4} lg={2} className="mb-4">
                                            <PartnerLogo name={partner} />
                                        </Col>
                                    ))}
                                </Row>
                            </Container>
                        </section>
                    </div>
                    <Footer />
                </div>
            </div>
        </>
    );
};

export default HomePage;
