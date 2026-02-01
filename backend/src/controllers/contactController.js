const contactRepository = require('../repositories/contactRepository');
const contactService = require('../services/contactService');
const dependencyService = require('../services/dependencyService');
const { asyncHandler, successResponse, createdResponse, paginatedResponse, noContentResponse } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errors');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts with filters and pagination
 * @access  Admin
 */
const getContacts = asyncHandler(async (req, res) => {
    const { page, limit, contact_type, tag, search } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { contact_type, tag, search };
    
    const [contacts, total] = await Promise.all([
        contactRepository.findAll(filters, pagination),
        contactRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, contacts, paginationMeta, 'Contacts fetched successfully');
});

/**
 * @route   GET /api/contacts/:id
 * @desc    Get contact by ID
 * @access  Admin
 */
const getContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await contactRepository.findById(id);
    
    if (!contact) {
        throw new NotFoundError('Contact not found');
    }
    
    successResponse(res, contact, 'Contact fetched successfully');
});

/**
 * @route   POST /api/contacts
 * @desc    Create a new contact (with user account for CUSTOMER)
 * @access  Admin
 * 
 * For CUSTOMER contacts:
 * - Creates a user account linked to the contact
 * - Sends welcome email with password setup link
 */
const createContact = asyncHandler(async (req, res) => {
    const contact = await contactService.createContact(req.body);
    createdResponse(res, contact, 'Contact created successfully');
});

/**
 * @route   PUT /api/contacts/:id
 * @desc    Update a contact
 * @access  Admin
 */
const updateContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const existing = await contactRepository.findById(id);
    if (!existing) {
        throw new NotFoundError('Contact not found');
    }
    
    const contact = await contactRepository.update(id, req.body);
    successResponse(res, contact, 'Contact updated successfully');
});

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete a contact (TASK 9 - Safe Delete)
 * @access  Admin
 * 
 * Validates that contact has no dependencies before deletion.
 * Returns 409 Conflict if contact is referenced elsewhere.
 */
const deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const contact = await contactRepository.findById(id);
    if (!contact) {
        throw new NotFoundError('Contact not found');
    }
    
    // TASK 9: Check dependencies before delete
    await dependencyService.validateContactDeleteManual(id);
    
    await contactRepository.delete(id);
    noContentResponse(res);
});

module.exports = {
    getContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact,
};
