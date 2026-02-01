const autoAnalyticalModelRepository = require('../repositories/autoAnalyticalModelRepository');
const { productRepository } = require('../repositories/productRepository');
const contactRepository = require('../repositories/contactRepository');

/**
 * Auto Analytical Model Engine (TASK 2 - Final Resolution Engine)
 * 
 * RESOLUTION RULES:
 * 1. A rule may contain: partner_id, partner_tag, product_id, product_category_id
 * 2. Any field may be NULL (not required for matching)
 * 3. Rule applies if AT LEAST ONE non-null field matches the context
 * 4. Count the number of matched fields per rule
 * 5. Rule with HIGHEST match count wins
 * 6. TIE-BREAKER: If match counts are equal, prefer the rule created MOST RECENTLY
 * 7. If NO rule matches: return null (analytical account must be manually provided)
 * 
 * ⚠️ Priority is CALCULATED at runtime, NOT stored in DB
 */
class AutoAnalyticalService {
    /**
     * Resolve the best matching analytical account for a transaction line
     * 
     * This is the main entry point for analytical account resolution.
     * Called for EACH line when creating invoices/bills.
     * 
     * @param {Object} context - The context for matching
     * @param {string} context.partnerId - The partner (customer/vendor) UUID
     * @param {string} context.partnerTag - The partner's tag string
     * @param {string} context.productId - The product UUID
     * @param {string} context.productCategoryId - The product's category UUID (from product.category_id FK)
     * @returns {string|null} - The analytical_account_id or null if no match
     */
    async resolveAnalyticalAccount(context) {
        const { partnerId, partnerTag, productId, productCategoryId } = context;
        
        // Get all active models, ordered by created_at DESC for tie-breaking
        // Models are returned with most recent first, so first match in case of tie wins
        const models = await autoAnalyticalModelRepository.findActiveModelsOrderedByRecency();
        
        console.log('[AutoAnalytical] Found', models.length, 'active models');
        
        if (models.length === 0) {
            console.log('[AutoAnalytical] No active models found');
            return null;
        }
        
        let bestMatch = null;
        let highestMatchCount = 0;
        
        for (const model of models) {
            const matchCount = this.calculateMatchScore(model, context);
            console.log('[AutoAnalytical] Model', model.name, '- score:', matchCount, 'fields:', {
                partner_id: model.partner_id,
                partner_tag: model.partner_tag,
                product_id: model.product_id,
                product_category_id: model.product_category_id
            });
            
            // Rule applies only if at least one field matches
            if (matchCount > 0) {
                // Since models are ordered by created_at DESC, first model with highest score wins
                // This handles tie-breaking: more recent model wins when match counts are equal
                if (matchCount > highestMatchCount) {
                    highestMatchCount = matchCount;
                    bestMatch = model;
                }
                // Note: We don't update bestMatch if matchCount === highestMatchCount
                // because the current bestMatch is already more recent (comes first in the array)
            }
        }
        
        console.log('[AutoAnalytical] Best match:', bestMatch?.name, 'analytical_account_id:', bestMatch?.analytical_account_id);
        
        return bestMatch ? bestMatch.analytical_account_id : null;
    }
    
    /**
     * Alias for resolveAnalyticalAccount (backward compatibility)
     * @deprecated Use resolveAnalyticalAccount instead
     */
    async findAnalyticalAccount(context) {
        return this.resolveAnalyticalAccount(context);
    }
    
    /**
     * Calculate how many fields match between a model and context
     * 
     * @param {Object} model - The auto analytical model
     * @param {Object} context - The matching context
     * @returns {number} - Number of matched fields (0-4)
     */
    calculateMatchScore(model, context) {
        let matchCount = 0;
        
        // Check partner match
        if (model.partner_id && model.partner_id === context.partnerId) {
            matchCount++;
        }
        
        // Check partner tag match
        if (model.partner_tag && model.partner_tag === context.partnerTag) {
            matchCount++;
        }
        
        // Check product match
        if (model.product_id && model.product_id === context.productId) {
            matchCount++;
        }
        
        // Check product category match
        if (model.product_category_id && model.product_category_id === context.productCategoryId) {
            matchCount++;
        }
        
        return matchCount;
    }
    
    /**
     * Assign analytical account to a document line
     * Used by vendor bills and customer invoices
     * 
     * @param {Object} params
     * @param {string} params.partnerId - Customer or Vendor ID
     * @param {string} params.productId - Product ID
     * @returns {string|null} - The analytical_account_id or null
     */
    async assignAnalyticalAccountForLine(partnerId, productId) {
        // Get partner details for tag
        const partner = await contactRepository.findById(partnerId);
        const partnerTag = partner?.tag || null;
        
        console.log('[AutoAnalytical] Partner lookup:', { partnerId, found: !!partner, tag: partnerTag });
        
        // Get product details for category
        const product = await productRepository.findById(productId);
        const productCategoryId = product?.category_id || null;
        
        console.log('[AutoAnalytical] Product lookup:', { productId, found: !!product, categoryId: productCategoryId });
        
        const context = {
            partnerId,
            partnerTag,
            productId,
            productCategoryId,
        };
        
        console.log('[AutoAnalytical] Context for resolution:', context);
        
        return this.findAnalyticalAccount(context);
    }
    
    /**
     * Process multiple lines and assign analytical accounts
     * 
     * @param {string} partnerId - The partner ID
     * @param {Array} lines - Array of line items with product_id
     * @returns {Array} - Lines with analytical_account_id assigned
     */
    async processLines(partnerId, lines) {
        const partner = await contactRepository.findById(partnerId);
        const partnerTag = partner?.tag || null;
        
        const processedLines = await Promise.all(
            lines.map(async (line) => {
                // If analytical_account_id is already provided, keep it
                if (line.analytical_account_id) {
                    return line;
                }
                
                const product = await productRepository.findById(line.product_id);
                const productCategoryId = product?.category_id || null;
                
                const context = {
                    partnerId,
                    partnerTag,
                    productId: line.product_id,
                    productCategoryId,
                };
                
                const analyticalAccountId = await this.findAnalyticalAccount(context);
                
                return {
                    ...line,
                    analytical_account_id: analyticalAccountId,
                };
            })
        );
        
        return processedLines;
    }
}

module.exports = new AutoAnalyticalService();
