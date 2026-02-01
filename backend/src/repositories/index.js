module.exports = {
    contactRepository: require('./contactRepository'),
    ...require('./productRepository'),
    analyticalAccountRepository: require('./analyticalAccountRepository'),
    autoAnalyticalModelRepository: require('./autoAnalyticalModelRepository'),
    budgetRepository: require('./budgetRepository'),
    purchaseOrderRepository: require('./purchaseOrderRepository'),
    vendorBillRepository: require('./vendorBillRepository'),
    salesOrderRepository: require('./salesOrderRepository'),
    customerInvoiceRepository: require('./customerInvoiceRepository'),
    paymentRepository: require('./paymentRepository'),
};
