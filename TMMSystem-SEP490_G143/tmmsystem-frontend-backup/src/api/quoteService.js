import apiClient from './apiConfig';

export const quoteService = {
    // Test RFQ endpoints
    discoverEndpoints: async () => {
        const possibleEndpoints = [
            '/v1/rfqs',
            '/v1/rfq',
            '/v1/quote-requests',
            '/v1/quotations',
            '/v1/requests'
        ];

        console.log('Testing RFQ endpoints...');

        for (const endpoint of possibleEndpoints) {
            try {
                const response = await apiClient.get(endpoint);
                console.log(`Found working endpoint: ${endpoint}`, response.data);
                console.log(`Data length:`, response.data?.length || 'Not an array');
                return { endpoint, data: response.data };
            } catch (error) {
                console.log(`${endpoint}: ${error.response?.status || 'Network Error'}`);
            }
        }

        console.log('No RFQ endpoints found');
        return null;
    },

    // Submit a new RFQ (quote request) from customer
    submitQuoteRequest: async (rfqData) => {
        try {
            console.log('=== SUBMITTING RFQ ===');
            console.log('Original rfqData:', rfqData);

            // Get current user ID for createdById
            const userId = parseInt(localStorage.getItem('userId')) || 1;

            // Generate a temporary RFQ number (backend might override this)
            const timestamp = Date.now();
            const rfqNumber = `RFQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${timestamp.toString().slice(-6)}`;

            const payload = {
                rfqNumber: rfqNumber,
                customerId: rfqData.customerId,
                expectedDeliveryDate: rfqData.expectedDeliveryDate,
                status: 'DRAFT',
                isSent: false,
                notes: 'Customer quote request',
                createdById: userId,
                details: rfqData.details.map(detail => ({
                    productId: detail.productId,
                    quantity: detail.quantity,
                    unit: 'pcs',
                    notes: detail.size || 'Standard'
                }))
            };

            console.log('API payload:', JSON.stringify(payload, null, 2));
            console.log('Making POST request to: /v1/rfqs');

            const response = await apiClient.post('/v1/rfqs', payload);
            console.log('API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== RFQ SUBMISSION ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Status Text:', error.response?.statusText);
            console.error('Error Data:', error.response?.data);
            console.error('Full Error:', error);
            throw new Error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu báo giá');
        }
    },

    // Get all RFQs (for sales staff)
    getAllQuoteRequests: async () => {
        try {
            console.log('Fetching RFQs from /v1/rfqs...');
            const response = await apiClient.get('/v1/rfqs');
            console.log('Raw RFQ response:', response.data);

            if (response.data && response.data.length > 0) {
                console.log('First RFQ structure:', Object.keys(response.data[0]));
                console.log('First RFQ data:', response.data[0]);
            }

            return response.data || [];
        } catch (error) {
            console.error('RFQ fetch error:', error);
            throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách yêu cầu báo giá');
        }
    },

    // Get RFQ details
    getRFQDetails: async (rfqId) => {
        try {
            console.log(`=== FETCHING RFQ DETAILS ===`);
            console.log(`Requesting RFQ ID: ${rfqId}`);
            console.log(`Making GET request to: /v1/rfqs/${rfqId}`);

            const response = await apiClient.get(`/v1/rfqs/${rfqId}`);

            console.log('RFQ details response status:', response.status);
            console.log('RFQ details response data:', response.data);

            if (response.data) {
                console.log('RFQ details structure:', Object.keys(response.data));
                if (response.data.details) {
                    console.log('RFQ details count:', response.data.details.length);
                    console.log('First detail item:', response.data.details[0]);
                }
            }

            return response.data;
        } catch (error) {
            console.error('=== RFQ DETAILS FETCH ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Status Text:', error.response?.statusText);
            console.error('Error Data:', error.response?.data);
            console.error('Full Error:', error);
            throw new Error(error.response?.data?.message || 'Lỗi khi tải chi tiết RFQ');
        }
    },

    // Get all customers
    getAllCustomers: async () => {
        try {
            console.log('Trying to fetch customers from /v1/customers...');
            const response = await apiClient.get('/v1/customers');
            console.log('Customers response:', response.data);
            return response.data || [];
        } catch (error) {
            console.error('Customers fetch error:', error);
            return [];
        }
    },

    // Get customer by ID
    getCustomerById: async (customerId) => {
        try {
            console.log(`Fetching customer ID: ${customerId}`);
            const response = await apiClient.get(`/v1/customers/${customerId}`);
            console.log('Customer details response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Customer details fetch error:', error);
            return null;
        }
    },

    // RFQ workflow endpoints (required for Planning quotation creation)
    sendRfq: async (rfqId) => {
        try {
            console.log(`Sending RFQ ${rfqId}...`);
            const response = await apiClient.post(`/v1/rfqs/${rfqId}/send`);
            return response.data;
        } catch (error) {
            console.error('Send RFQ error:', error);
            throw new Error(error.response?.data?.message || 'Lỗi khi gửi RFQ');
        }
    },

    preliminaryCheck: async (rfqId) => {
        try {
            console.log(`Preliminary checking RFQ ${rfqId}...`);
            const response = await apiClient.post(`/v1/rfqs/${rfqId}/preliminary-check`);
            return response.data;
        } catch (error) {
            console.error('Preliminary check error:', error);
            throw new Error(error.response?.data?.message || 'Lỗi khi kiểm tra sơ bộ RFQ');
        }
    },

    forwardToPlanning: async (rfqId) => {
        try {
            console.log(`Forwarding RFQ ${rfqId} to Planning...`);
            const response = await apiClient.post(`/v1/rfqs/${rfqId}/forward-to-planning`);
            return response.data;
        } catch (error) {
            console.error('Forward to planning error:', error);
            throw new Error(error.response?.data?.message || 'Lỗi khi chuyển RFQ đến Planning');
        }
    },

    receiveByPlanning: async (rfqId) => {
        try {
            console.log(`Planning receiving RFQ ${rfqId}...`);
            const response = await apiClient.post(`/v1/rfqs/${rfqId}/receive-by-planning`);
            return response.data;
        } catch (error) {
            console.error('Receive by planning error:', error);
            throw new Error(error.response?.data?.message || 'Lỗi khi Planning nhận RFQ');
        }
    },

    // Update RFQ status (for sales staff operations)
    updateRFQStatus: async (rfqId, status) => {
        try {
            console.log(`Updating RFQ ${rfqId} status to: ${status}`);
            const response = await apiClient.patch(`/v1/rfqs/${rfqId}`, {
                status: status,
                isSent: status === 'SENT'
            });
            console.log('RFQ status update response:', response.data);
            return response.data;
        } catch (error) {
            console.error('RFQ status update error:', error);
            throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái RFQ');
        }
    },

    // Send RFQ to Planning Department (update status to SENT)
    sendRFQToPlanningDepartment: async (rfqId) => {
        try {
            console.log(`=== SENDING RFQ TO PLANNING ===`);
            console.log(`RFQ ID: ${rfqId}`);

            // Use the correct backend endpoint
            const response = await apiClient.post(`/v1/rfqs/${rfqId}/forward-to-planning`);

            console.log('Send RFQ response status:', response.status);
            console.log('Send RFQ response data:', response.data);

            return response.data;
        } catch (error) {
            console.error('=== SEND RFQ ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Status Text:', error.response?.statusText);
            console.error('Error Data:', error.response?.data);
            console.error('Full Error:', error);
            throw new Error(error.response?.data?.message || 'Lỗi khi gửi RFQ đến Phòng Kế hoạch');
        }
    },

    // Get pricing data for quote calculation - FIXED ENDPOINT
    getQuotePricing: async (rfqId) => {
        try {
            console.log(`=== FETCHING QUOTE PRICING ===`);
            console.log(`RFQ ID: ${rfqId}`);

            const response = await apiClient.post(`/v1/quotations/calculate-price`, {
                rfqId: rfqId,
                profitMargin: 0 // Default 0% for initial pricing
            });

            console.log('Quote pricing response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== QUOTE PRICING FETCH ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi tải thông tin báo giá');
        }
    },

    // Create a new quote - FIXED ENDPOINT AND PAYLOAD
    createQuote: async (quoteData) => {
        try {
            console.log(`=== CREATING QUOTE ===`);
            console.log('Quote data:', quoteData);

            const response = await apiClient.post(`/v1/quotations/create-from-rfq`, {
                rfqId: quoteData.rfqId,
                planningUserId: parseInt(localStorage.getItem('userId')) || 1,
                profitMargin: quoteData.profitMargin || 0,
                capacityCheckNotes: quoteData.notes || 'Capacity checked by Planning Department'
            });

            console.log('Create quote response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== CREATE QUOTE ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi tạo báo giá');
        }
    },

    // Calculate quote price - FIXED ENDPOINT
    calculateQuotePrice: async (rfqId, profitMargin) => {
        try {
            console.log(`=== CALCULATING QUOTE PRICE ===`);
            console.log(`RFQ ID: ${rfqId}, Profit Margin: ${profitMargin}%`);

            const response = await apiClient.post(`/v1/quotations/recalculate-price`, {
                rfqId: rfqId,
                profitMargin: profitMargin
            });

            console.log('Price calculation response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== PRICE CALCULATION ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi tính toán giá báo giá');
        }
    },

    // Get quote details by quote ID - FIXED ENDPOINT
    getQuoteDetails: async (quoteId) => {
        try {
            console.log(`=== FETCHING QUOTE DETAILS ===`);
            console.log(`Quote ID: ${quoteId}`);

            const response = await apiClient.get(`/v1/quotations/${quoteId}`);

            console.log('Quote details response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== QUOTE DETAILS FETCH ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi tải chi tiết báo giá');
        }
    },

    // Send quote to customer - FIXED ENDPOINT
    sendQuoteToCustomer: async (quoteId) => {
        try {
            console.log(`=== SENDING QUOTE TO CUSTOMER ===`);
            console.log(`Quote ID: ${quoteId}`);

            const response = await apiClient.post(`/v1/quotations/${quoteId}/send-to-customer`);

            console.log('Send quote response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== SEND QUOTE ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi gửi báo giá đến khách hàng');
        }
    },

    // Get all quotes (for Sales Staff) - FIXED ENDPOINT
    getAllQuotes: async () => {
        try {
            console.log(`=== FETCHING ALL QUOTATIONS ===`);

            const response = await apiClient.get('/v1/quotations');

            console.log('All quotations response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== GET ALL QUOTATIONS ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách báo giá');
        }
    },

    // Update quotation status (Accept/Reject) - FIXED ENDPOINTS
    updateQuotationStatus: async (quotationId, status) => {
        try {
            console.log(`=== UPDATING QUOTATION STATUS ===`);
            console.log(`Quotation ID: ${quotationId}, New Status: ${status}`);

            if (status === 'ACCEPTED') {
                const response = await apiClient.post(`/v1/quotations/${quotationId}/approve`);
                console.log('Quotation approve response:', response.data);
                return response.data;
            } else if (status === 'REJECTED') {
                const response = await apiClient.post(`/v1/quotations/${quotationId}/reject`);
                console.log('Quotation reject response:', response.data);
                return response.data;
            } else {
                throw new Error('Invalid quotation status');
            }
        } catch (error) {
            console.error('=== QUOTATION STATUS UPDATE ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái báo giá');
        }
    },

    // Create order from accepted quotation - FIXED ENDPOINT
    createOrderFromQuotation: async (orderData) => {
        try {
            console.log(`=== CREATING ORDER FROM QUOTATION ===`);
            console.log('Order data:', orderData);

            const response = await apiClient.post(`/v1/quotations/${orderData.quotationId}/create-order`);

            console.log('Create order response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== CREATE ORDER ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi tạo đơn hàng');
        }
    },

    // Get customer quotations - FIXED ENDPOINT
    getCustomerQuotations: async (customerId) => {
        try {
            console.log(`=== FETCHING CUSTOMER QUOTATIONS ===`);
            console.log(`Customer ID: ${customerId}`);

            const response = await apiClient.get(`/v1/quotations/customer/${customerId}`);

            console.log('Customer quotations response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== CUSTOMER QUOTATIONS FETCH ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách báo giá');
        }
    },

    // Get customer orders
    getCustomerOrders: async (customerId) => {
        try {
            console.log(`=== FETCHING CUSTOMER ORDERS ===`);
            console.log(`Customer ID: ${customerId}`);

            const response = await apiClient.get(`/v1/orders/customer/${customerId}`);

            console.log('Customer orders response:', response.data);
            return response.data;
        } catch (error) {
            console.error('=== CUSTOMER ORDERS FETCH ERROR ===');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Lỗi khi tải danh sách đơn hàng');
        }
    },
};
