import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { productService } from '../../api/productService';
import ProductCard from '../../components/ProductCard';
import Pagination from '../../components/Pagination';
import '../../styles/CustomerHomePage.css';

function CustomerDashboard() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const productsPerPage = 9;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // Only fetch products for now - categories endpoint has issues
                const productData = await productService.getAllProducts();

                console.log('Products loaded:', productData?.length || 0);
                console.log('First product structure:', productData?.[0]);
                console.log('All fields in first product:', Object.keys(productData?.[0] || {}));
                setProducts(productData || []);
                setCategories([]); // Empty categories for now
            } catch (err) {
                setError(err.message || 'Lỗi khi tải dữ liệu.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);



    const filteredProducts =
        selectedCategory === 'all'
            ? products
            : products.filter((p) => p.categoryId?.toString() === selectedCategory);

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            window.scrollTo(0, 0);
        }
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="customer-layout">
            {/* Header */}
            <Header />

            {/* Main Content Area */}
            <div className="d-flex">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
                    <Container fluid className="p-4">
                        <div className="customer-home-page">
                            <h1 className="page-title">Danh sách sản phẩm</h1>
                            <p className="page-subtitle">Chọn sản phẩm và yêu cầu báo giá để được giá tốt nhất</p>

                            <div className="filter-container">
                                {/* Temporarily hide category filter until backend is ready */}
                                <div className="text-muted">
                                    <small>Hiển thị tất cả sản phẩm ({products.length} sản phẩm)</small>
                                </div>
                            </div>

                            {loading && <div className="loading-message">Đang tải sản phẩm...</div>}
                            {error && <div className="error-message">{error}</div>}

                            {!loading && !error && (
                                <>
                                    {currentProducts.length > 0 ? (
                                        <div className="product-grid">
                                            {currentProducts.map((product) => (
                                                <ProductCard key={product.id} product={product} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-products-message">Không tìm thấy sản phẩm nào.</div>
                                    )}

                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                                </>
                            )}
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    );
}

export default CustomerDashboard;
