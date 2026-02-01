const db = require('../config/database');
const purchaseOrderRepository = require('../repositories/purchaseOrderRepository');
const contactRepository = require('../repositories/contactRepository');
const autoAnalyticalService = require('./autoAnalyticalService');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { documentStatus } = require('../config/constants');

class PurchaseOrderService {
    /**
     * Validate that order date falls within budget periods for all analytical accounts
     * @param {Date} orderDate - The purchase order date
     * @param {Array} lines - Order lines with analytical_account_id
     * @param {Object} client - Database client for transaction
     */
    async validateBudgetPeriods(orderDate, lines, client) {
        // Get unique analytical account IDs from lines
        const analyticalAccountIds = [...new Set(
            lines
                .filter(line => line.analytical_account_id)
                .map(line => line.analytical_account_id)
        )];
        
        if (analyticalAccountIds.length === 0) return; // No analytics to validate
        
        // Check each analytical account's budget period
        for (const accountId of analyticalAccountIds) {
            const budgetResult = await client.query(`
                SELECT b.*, aa.name as analytical_account_name
                FROM budgets b
                JOIN analytical_accounts aa ON b.analytical_account_id = aa.id
                WHERE b.analytical_account_id = $1
                ORDER BY b.period_start DESC
                LIMIT 1
            `, [accountId]);
            
            if (budgetResult.rows.length > 0) {
                const budget = budgetResult.rows[0];
                const periodStart = new Date(budget.period_start);
                const periodEnd = new Date(budget.period_end);
                const orderDateObj = new Date(orderDate);
                
                // Check if order date falls within budget period
                if (orderDateObj < periodStart || orderDateObj > periodEnd) {
                    const startStr = periodStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    const endStr = periodEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    throw new BadRequestError(
                        `Order date is outside budget period for "${budget.analytical_account_name}". ` +
                        `Budget period: ${startStr} to ${endStr}. ` +
                        `Please revise the budget period or change the order date.`
                    );
                }
            }
        }
    }

    /**
     * Create a purchase order
     */
    async createOrder(orderData, lines) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Debug: Log incoming lines
            console.log('📦 Incoming PO lines:', JSON.stringify(lines, null, 2));
            
            // Validate vendor
            const vendor = await contactRepository.findById(orderData.vendor_id);
            if (!vendor) {
                throw new NotFoundError('Vendor not found');
            }
            
            if (vendor.contact_type !== 'VENDOR') {
                throw new BadRequestError('Contact is not a vendor');
            }
            
            // Generate order number
            const order_number = await purchaseOrderRepository.generateOrderNumber(client);
            
            // Process lines with auto analytical assignment
            const processedLines = await autoAnalyticalService.processLines(
                orderData.vendor_id,
                lines
            );
            
            // Debug: Log processed lines
            console.log('📦 Processed PO lines:', JSON.stringify(processedLines, null, 2));
            
            // Validate budget periods - order date must fall within budget period
            const orderDate = orderData.order_date || new Date();
            await this.validateBudgetPeriods(orderDate, processedLines, client);
            
            // Calculate total
            const total_amount = processedLines.reduce(
                (sum, line) => sum + (line.quantity * line.unit_price),
                0
            );
            
            // Create order
            const order = await purchaseOrderRepository.create({
                ...orderData,
                order_number,
                total_amount,
            }, client);
            
            // Create order lines
            const createdLines = [];
            for (const line of processedLines) {
                const subtotal = line.quantity * line.unit_price;
                const createdLine = await purchaseOrderRepository.createLine({
                    purchase_order_id: order.id,
                    product_id: line.product_id,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    subtotal,
                    analytical_account_id: line.analytical_account_id,
                }, client);
                createdLines.push(createdLine);
            }
            
            await client.query('COMMIT');
            
            return {
                ...order,
                lines: createdLines,
                vendor_name: vendor.name,
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Update order status
     */
    async updateStatus(orderId, status) {
        const order = await purchaseOrderRepository.findById(orderId);
        
        if (!order) {
            throw new NotFoundError('Purchase order not found');
        }
        
        if (order.status === documentStatus.CANCELLED) {
            throw new BadRequestError('Cannot change status of cancelled order');
        }
        
        return purchaseOrderRepository.updateStatus(orderId, status);
    }
    
    /**
     * Update an existing purchase order
     */
    async updateOrder(orderId, orderData, lines) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Validate order exists
            const existingOrder = await purchaseOrderRepository.findById(orderId);
            if (!existingOrder) {
                throw new NotFoundError('Purchase order not found');
            }
            
            if (existingOrder.status === documentStatus.CANCELLED) {
                throw new BadRequestError('Cannot update cancelled order');
            }
            
            // Process lines with auto analytical assignment
            const processedLines = await autoAnalyticalService.processLines(
                orderData.vendor_id || existingOrder.vendor_id,
                lines
            );
            
            // Validate budget periods - order date must fall within budget period
            const orderDate = orderData.order_date || existingOrder.order_date || new Date();
            await this.validateBudgetPeriods(orderDate, processedLines, client);
            
            // Calculate total
            const total_amount = processedLines.reduce(
                (sum, line) => sum + (line.quantity * line.unit_price),
                0
            );
            
            // Update order
            const updatedOrder = await purchaseOrderRepository.update(orderId, {
                ...orderData,
                total_amount,
            }, client);
            
            // Delete existing lines and recreate
            await purchaseOrderRepository.deleteLinesForOrder(orderId, client);
            
            // Create order lines
            const createdLines = [];
            for (const line of processedLines) {
                const subtotal = line.quantity * line.unit_price;
                const createdLine = await purchaseOrderRepository.createLine({
                    purchase_order_id: orderId,
                    product_id: line.product_id,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    subtotal,
                    analytical_account_id: line.analytical_account_id,
                }, client);
                createdLines.push(createdLine);
            }
            
            await client.query('COMMIT');
            
            return {
                ...updatedOrder,
                lines: createdLines,
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Get order with lines
     */
    async getOrderWithLines(orderId) {
        const order = await purchaseOrderRepository.findById(orderId);
        
        if (!order) {
            throw new NotFoundError('Purchase order not found');
        }
        
        const lines = await purchaseOrderRepository.findLinesById(orderId);
        
        return { ...order, lines };
    }
}

module.exports = new PurchaseOrderService();
