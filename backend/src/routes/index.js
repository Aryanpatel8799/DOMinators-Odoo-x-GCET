const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const contactRoutes = require('./contactRoutes');
const productRoutes = require('./productRoutes');
const productCategoryRoutes = require('./productCategoryRoutes');
const analyticalAccountRoutes = require('./analyticalAccountRoutes');
const autoAnalyticalModelRoutes = require('./autoAnalyticalModelRoutes');
const budgetRoutes = require('./budgetRoutes');
const purchaseOrderRoutes = require('./purchaseOrderRoutes');
const vendorBillRoutes = require('./vendorBillRoutes');
const salesOrderRoutes = require('./salesOrderRoutes');
const customerInvoiceRoutes = require('./customerInvoiceRoutes');
const customerRoutes = require('./customerRoutes');
const vendorRoutes = require('./vendorRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/products', productRoutes);
router.use('/product-categories', productCategoryRoutes);
router.use('/analytical-accounts', analyticalAccountRoutes);
router.use('/auto-analytical-models', autoAnalyticalModelRoutes);
router.use('/budgets', budgetRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/vendor-bills', vendorBillRoutes);
router.use('/sales-orders', salesOrderRoutes);
router.use('/customer-invoices', customerInvoiceRoutes);
router.use('/customer', customerRoutes);
router.use('/vendor', vendorRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Shiv Furniture API is running',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
