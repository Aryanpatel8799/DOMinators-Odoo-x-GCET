const db = require('../config/database');
const salesOrderRepository = require('../repositories/salesOrderRepository');
const contactRepository = require('../repositories/contactRepository');
const customerInvoiceRepository = require('../repositories/customerInvoiceRepository');
const authService = require('./authService');
const emailService = require('./emailService');
const autoAnalyticalService = require('./autoAnalyticalService');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { documentStatus } = require('../config/constants');

class SalesOrderService {
    /**
     * Create a sales order
     */
    async createOrder(orderData, lines) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Validate customer
            const customer = await contactRepository.findById(orderData.customer_id);
            if (!customer) {
                throw new NotFoundError('Customer not found');
            }
            
            if (customer.contact_type !== 'CUSTOMER') {
                throw new BadRequestError('Contact is not a customer');
            }
            
            // Generate order number
            const order_number = await salesOrderRepository.generateOrderNumber(client);
            
            // Process lines with auto analytical assignment
            const processedLines = await autoAnalyticalService.processLines(
                orderData.customer_id,
                lines
            );
            
            // Calculate total
            const total_amount = processedLines.reduce(
                (sum, line) => sum + (line.quantity * line.unit_price),
                0
            );
            
            // Create order
            const order = await salesOrderRepository.create({
                ...orderData,
                order_number,
                total_amount,
            }, client);
            
            // Create order lines
            const createdLines = [];
            for (const line of processedLines) {
                const subtotal = line.quantity * line.unit_price;
                const createdLine = await salesOrderRepository.createLine({
                    sales_order_id: order.id,
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
                customer_name: customer.name,
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
     * When status changes to CONFIRMED, auto-create customer invoice
     */
    async updateStatus(orderId, status) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            const order = await salesOrderRepository.findById(orderId);
            
            if (!order) {
                throw new NotFoundError('Sales order not found');
            }
            
            if (order.status === documentStatus.CANCELLED) {
                throw new BadRequestError('Cannot change status of cancelled order');
            }
            
            const updatedOrder = await salesOrderRepository.updateStatus(orderId, status, client);
            
            // Auto-create customer invoice when order is confirmed
            if (status === 'CONFIRMED' && order.status === 'DRAFT') {
                const lines = await salesOrderRepository.findLinesById(orderId);
                const customer = await contactRepository.findById(order.customer_id);
                
                // Ensure customer contact has auth credentials for portal access
                let resetToken = null;
                if (customer && !customer.password_hash) {
                    const userResult = await authService.ensureCustomerUser(
                        customer.email,
                        customer.name,
                        client
                    );
                    
                    if (userResult.isNew) {
                        resetToken = userResult.resetToken;
                    }
                }
                
                // Generate invoice number
                const invoice_number = await customerInvoiceRepository.generateInvoiceNumber(client);
                
                // Calculate due date (30 days from now)
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);
                
                // Create invoice with POSTED status (ready for customer payment)
                const invoice = await customerInvoiceRepository.create({
                    invoice_number,
                    customer_id: order.customer_id,
                    sales_order_id: orderId,
                    invoice_date: new Date(),
                    due_date: dueDate,
                    total_amount: order.total_amount,
                    notes: `Auto-generated from Sales Order ${order.order_number}`,
                    status: 'POSTED', // Auto-created invoices are ready for payment
                }, client);
                
                // Create invoice lines from sales order lines
                for (const line of lines) {
                    await customerInvoiceRepository.createLine({
                        customer_invoice_id: invoice.id,
                        product_id: line.product_id,
                        quantity: line.quantity,
                        unit_price: line.unit_price,
                        subtotal: line.subtotal,
                        analytical_account_id: line.analytical_account_id,
                    }, client);
                }
                
                console.log(`✅ Auto-created invoice ${invoice_number} from SO ${order.order_number}`);
                
                // Send welcome email after commit if new user was created
                if (resetToken && customer) {
                    // Queue email sending after transaction commits
                    process.nextTick(async () => {
                        try {
                            await emailService.sendWelcomeEmail(customer.email, customer.name, resetToken);
                            console.log(`📧 Welcome email sent to ${customer.email}`);
                        } catch (emailError) {
                            console.error('Failed to send welcome email:', emailError.message);
                        }
                    });
                }
            }
            
            await client.query('COMMIT');
            return updatedOrder;
            
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
        const order = await salesOrderRepository.findById(orderId);
        
        if (!order) {
            throw new NotFoundError('Sales order not found');
        }
        
        const lines = await salesOrderRepository.findLinesById(orderId);
        
        return { ...order, lines };
    }
}

module.exports = new SalesOrderService();
