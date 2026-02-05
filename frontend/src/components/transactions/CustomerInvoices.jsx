import { useState, useEffect } from 'react';
import { CheckCircle, Printer, Send, X, CreditCard, ArrowLeft, Trash2, Info, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { customerInvoiceAPI, contactAPI, productAPI, analyticalAccountAPI, salesOrderAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function CustomerInvoices() {
  const [view, setView] = useState('list');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Data states
  const [customers, setCustomers] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    invoiceNo: '',
    customerId: '',
    salesOrderId: '',
    date: '',
    dueDate: '',
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
    receivedAmount: 0,
    lines: [],
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [customersRes, salesOrdersRes, productsRes, analyticsRes, invoicesRes] = await Promise.all([
        contactAPI.getCustomers({ limit: 100 }),
        salesOrderAPI.getAll({ limit: 100 }),
        productAPI.getAll({ limit: 100 }),
        analyticalAccountAPI.getAll({ limit: 100 }),
        customerInvoiceAPI.getAll({ limit: 100 }),
      ]);

      // Transform customers
      setCustomers((customersRes.data || []).map(c => ({
        id: String(c.id),
        name: c.name,
      })));

      // Transform sales orders
      setSalesOrders((salesOrdersRes.data || []).map(so => ({
        id: String(so.id),
        orderNo: so.order_number,
        customerId: String(so.customer_id || so.contact_id),
        amount: parseFloat(so.total_amount) || 0,
      })));

      // Transform products
      setProducts((productsRes.data || []).map(p => ({
        id: String(p.id),
        name: p.name,
        price: parseFloat(p.sale_price) || 0,
      })));

      // Transform analytics
      setAnalytics((analyticsRes.data || []).map(a => ({
        id: String(a.id),
        name: a.name,
        budgeted: parseFloat(a.budget_amount) || 0,
        achieved: parseFloat(a.actual_amount) || 0,
      })));

      // Transform invoices
      setInvoices((invoicesRes.data || []).map(transformInvoice));
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const transformInvoice = (invoice) => ({
    id: String(invoice.id),
    invoiceNo: invoice.invoice_number,
    customerId: String(invoice.customer_id || invoice.contact_id || ''),
    customerName: invoice.customer_name || '',
    salesOrderId: invoice.sales_order_id ? String(invoice.sales_order_id) : '',
    date: invoice.invoice_date?.split('T')[0] || '',
    dueDate: invoice.due_date?.split('T')[0] || '',
    status: invoice.status || 'DRAFT',
    paymentStatus: invoice.payment_status || 'NOT_PAID',
    receivedAmount: parseFloat(invoice.paid_amount) || 0,
    totalAmount: parseFloat(invoice.total_amount) || 0,
    lines: (invoice.lines || []).map((line, idx) => ({
      id: String(line.id || idx + 1),
      productId: line.product_id ? String(line.product_id) : '',
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 1,
      price: parseFloat(line.unit_price) || 0,
      analyticId: line.analytical_account_id ? String(line.analytical_account_id) : '',
    })),
  });

  // Status display helpers
  const getStatusDisplay = (status) => {
    const statusMap = {
      'DRAFT': 'Draft',
      'POSTED': 'Posted',
      'CONFIRMED': 'Posted',
      'SENT': 'Sent',
      'PAID': 'Paid',
      'CANCELLED': 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusDisplay = (paymentStatus) => {
    const statusMap = {
      'UNPAID': 'Unpaid',
      'PARTIAL': 'Partial',
      'PAID': 'Paid',
    };
    return statusMap[paymentStatus] || paymentStatus;
  };

  const getCustomerName = (customerId, invoice = null) => {
    if (invoice?.customerName) return invoice.customerName;
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  };
  const getProductName = (productId) => products.find(p => p.id === productId)?.name || 'Unknown';
  const getAnalyticName = (analyticId) => analytics.find(a => a.id === analyticId)?.name || 'Unknown';
  const getSalesOrderNo = (soId) => salesOrders.find(s => s.id === soId)?.orderNo || '-';

  const getInvoiceTotal = (lines) => lines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  const getLineTotal = (line) => line.quantity * line.price;
  const getBalanceDue = (invoice) => (invoice.totalAmount || getInvoiceTotal(invoice.lines)) - invoice.receivedAmount;
  
  const getPaymentStatus = (invoice) => {
    const total = invoice.totalAmount || getInvoiceTotal(invoice.lines);
    const paymentStatus = (invoice.paymentStatus || '').toUpperCase();
    const receivedAmount = invoice.receivedAmount || 0;
    
    // Check actual payment status from backend first
    if (paymentStatus === 'PAID') return { status: 'Paid', variant: 'default' };
    if (paymentStatus === 'PARTIALLY_PAID') return { status: 'Partial', variant: 'outline' };
    if (paymentStatus === 'NOT_PAID') return { status: 'Unpaid', variant: 'secondary' };
    
    // Fallback to amount-based check
    if (receivedAmount >= total && total > 0) return { status: 'Paid', variant: 'default' };
    if (receivedAmount > 0) return { status: 'Partial', variant: 'outline' };
    return { status: 'Unpaid', variant: 'secondary' };
  };

  const getStatusColor = (status) => {
    const upperStatus = status?.toUpperCase() || '';
    switch (upperStatus) {
      case 'DRAFT': return 'secondary';
      case 'POSTED': 
      case 'CONFIRMED': return 'default';
      case 'SENT': return 'outline';
      case 'PAID': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const generateInvoiceNo = () => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${count.toString().padStart(3, '0')}`;
  };

  const handleNew = () => {
    setFormData({
      invoiceNo: generateInvoiceNo(),
      customerId: '',
      salesOrderId: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'DRAFT',
      paymentStatus: 'UNPAID',
      receivedAmount: 0,
      lines: [{ id: '1', productId: '', description: '', quantity: 1, price: 0, analyticId: '' }],
    });
    setIsEditing(false);
    setSelectedInvoice(null);
    setView('form');
  };

  const handleOpenInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setIsEditing(true);
    setView('form');
    
    // Fetch full invoice details with lines
    try {
      const response = await customerInvoiceAPI.getById(invoice.id);
      const fullInvoice = response.data || response;
      
      const transformedInvoice = {
        id: fullInvoice.id?.toString() || invoice.id,
        invoiceNo: fullInvoice.invoice_number || invoice.invoiceNo,
        customerId: (fullInvoice.customer_id || fullInvoice.contact_id)?.toString() || invoice.customerId,
        customerName: fullInvoice.customer_name || invoice.customerName,
        salesOrderId: fullInvoice.sales_order_id?.toString() || invoice.salesOrderId,
        date: fullInvoice.invoice_date?.split('T')[0] || invoice.date,
        dueDate: fullInvoice.due_date?.split('T')[0] || invoice.dueDate,
        status: fullInvoice.status || invoice.status,
        paymentStatus: fullInvoice.payment_status || invoice.paymentStatus,
        receivedAmount: parseFloat(fullInvoice.paid_amount) || invoice.receivedAmount || 0,
        totalAmount: parseFloat(fullInvoice.total_amount) || invoice.totalAmount || 0,
        lines: (fullInvoice.lines || []).map((line, idx) => ({
          id: line.id?.toString() || (idx + 1).toString(),
          productId: line.product_id?.toString() || '',
          description: line.description || line.product_name || '',
          quantity: parseFloat(line.quantity) || 1,
          price: parseFloat(line.unit_price) || 0,
          analyticId: line.analytical_account_id?.toString() || '',
        }))
      };
      
      // Ensure at least one line exists
      if (transformedInvoice.lines.length === 0) {
        transformedInvoice.lines = [{ id: '1', productId: '', description: '', quantity: 1, price: 0, analyticId: '' }];
      }
      
      setFormData(transformedInvoice);
      setSelectedInvoice(transformedInvoice);
    } catch (err) {
      console.error('Error loading invoice details:', err);
      // Fallback to basic invoice data
      setFormData({ ...invoice, lines: invoice.lines || [{ id: '1', productId: '', description: '', quantity: 1, price: 0, analyticId: '' }] });
    }
  };

  const handleConfirm = async () => {
    if (!selectedInvoice) return;
    try {
      setSaving(true);
      await customerInvoiceAPI.updateStatus(selectedInvoice.id, 'POSTED');
      setInvoices(invoices.map(i => i.id === selectedInvoice.id ? { ...i, status: 'POSTED' } : i));
      setFormData(prev => ({ ...prev, status: 'POSTED' }));
      setSelectedInvoice(prev => ({ ...prev, status: 'POSTED' }));
    } catch (err) {
      console.error('Error confirming invoice:', err);
      setError(err.message || 'Failed to confirm invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = () => {
    if (selectedInvoice && (formData.status === 'POSTED' || formData.status === 'CONFIRMED')) {
      setInvoices(invoices.map(i => i.id === selectedInvoice.id ? { ...i, status: 'SENT' } : i));
      setFormData(prev => ({ ...prev, status: 'SENT' }));
    }
  };

  const handleCancel = async () => {
    if (!selectedInvoice) return;
    try {
      setSaving(true);
      await customerInvoiceAPI.updateStatus(selectedInvoice.id, 'CANCELLED');
      setInvoices(invoices.map(i => i.id === selectedInvoice.id ? { ...i, status: 'CANCELLED' } : i));
      setFormData(prev => ({ ...prev, status: 'CANCELLED' }));
    } catch (err) {
      console.error('Error cancelling invoice:', err);
      setError(err.message || 'Failed to cancel invoice');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    if (!selectedInvoice) return;
    try {
      await customerInvoiceAPI.downloadPdf(selectedInvoice.id, formData.invoiceNo);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert(`Error downloading PDF: ${err.message}`);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!formData.customerId) {
        setError('Please select a customer');
        setSaving(false);
        return;
      }
      if (!formData.dueDate) {
        setError('Please enter a due date');
        setSaving(false);
        return;
      }
      if (formData.lines.length === 0) {
        setError('Please add at least one line item');
        setSaving(false);
        return;
      }
      const invalidLine = formData.lines.find(line => !line.productId);
      if (invalidLine) {
        setError('Please select a product for all line items');
        setSaving(false);
        return;
      }

      const payload = {
        customer_id: formData.customerId,
        sales_order_id: formData.salesOrderId || undefined,
        invoice_date: formData.date || undefined,
        due_date: formData.dueDate,
        lines: formData.lines.map(line => ({
          product_id: line.productId,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.price,
          analytical_account_id: line.analyticId || undefined,
        })),
      };

      if (isEditing && selectedInvoice) {
        // For updates, we just update local state since API might not have full update
        setInvoices(invoices.map(i => i.id === selectedInvoice.id ? { ...formData, id: selectedInvoice.id } : i));
      } else {
        const response = await customerInvoiceAPI.create(payload);
        const newInvoice = transformInvoice(response.data || response);
        setInvoices([...invoices, newInvoice]);
      }
      setView('list');
    } catch (err) {
      console.error('Error saving invoice:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save invoice';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLine = () => {
    const newLine = { id: Date.now().toString(), productId: '', description: '', quantity: 1, price: 0, analyticId: '' };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  };

  const handleRemoveLine = (lineId) => {
    setFormData(prev => ({ ...prev, lines: prev.lines.filter(l => l.id !== lineId) }));
  };

  const handleRegisterPayment = () => {
    alert(`Register Payment for ${formData.invoiceNo}\nThis will navigate to Invoice Payments with pre-filled data.`);
  };

  const handleLineChange = (lineId, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id === lineId) {
          if (field === 'productId') {
            const product = products.find(p => p.id === value);
            return { ...line, productId: value, price: product?.price || 0, description: product?.name || '' };
          }
          return { ...line, [field]: field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value };
        }
        return line;
      }),
    }));
  };

  // List View
  const renderListView = () => {
    if (loading) {
      return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading invoices...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
            <Button onClick={loadData} variant="outline" className="mt-2">Retry</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Customer Invoices</h1>
            <p className="text-gray-600">Invoices are auto-created when Sales Orders are confirmed</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Invoice No</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">SO Ref</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold text-right">Received</TableHead>
                <TableHead className="font-semibold text-right">Balance</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No invoices found. Click "New Invoice" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const total = invoice.totalAmount || getInvoiceTotal(invoice.lines);
                  const balance = getBalanceDue(invoice);
                  const paymentStatus = getPaymentStatus(invoice);
                  return (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleOpenInvoice(invoice)}>
                      <TableCell className="font-medium text-blue-600 hover:text-blue-800">{invoice.invoiceNo}</TableCell>
                      <TableCell>{getCustomerName(invoice.customerId, invoice)}</TableCell>
                      <TableCell>{getSalesOrderNo(invoice.salesOrderId)}</TableCell>
                      <TableCell>{invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN') : '-'}</TableCell>
                      <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(total)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(invoice.receivedAmount)}</TableCell>
                      <TableCell className={`text-right font-medium ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatCurrency(balance)}
                      </TableCell>
                      <TableCell><Badge variant={getStatusColor(invoice.status)}>{getStatusDisplay(invoice.status)}</Badge></TableCell>
                      <TableCell><Badge variant={paymentStatus.variant}>{paymentStatus.status}</Badge></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Form View
  const renderFormView = () => {
    const hasPayments = formData.receivedAmount > 0;
    const canEdit = formData.status === 'DRAFT' && !hasPayments;
    const total = getInvoiceTotal(formData.lines);
    const balance = total - formData.receivedAmount;

    return (
      <div className="p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
            <Button onClick={() => setError(null)} variant="outline" size="sm" className="mt-2">Dismiss</Button>
          </div>
        )}

        <div className="mb-4">
          <Button variant="outline" onClick={() => setView('list')}>
            <ArrowLeft size={18} className="mr-2" />
            Back to List
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={handleConfirm} disabled={formData.status !== 'DRAFT' || saving} className="flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Post
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
              <Printer size={16} /> Print
            </Button>
            <Button onClick={handleSend} disabled={formData.status !== 'POSTED' && formData.status !== 'CONFIRMED'} variant="outline" className="flex items-center gap-2">
              <Send size={16} /> Send
            </Button>
            <Button onClick={handleRegisterPayment} disabled={formData.status === 'DRAFT' || balance <= 0} 
              variant="outline" className="flex items-center gap-2 text-green-600 hover:text-green-700">
              <CreditCard size={16} /> Register Payment
            </Button>
            <Button onClick={handleCancel} disabled={formData.status === 'CANCELLED' || formData.status === 'DRAFT' || saving} 
              variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Cancel
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-500">Status:</span>
            <Badge variant={getStatusColor(formData.status)}>{getStatusDisplay(formData.status)}</Badge>
            <span className="text-sm text-gray-500 ml-4">Payment:</span>
            <Badge variant={getPaymentStatus(formData).variant}>{getPaymentStatus(formData).status}</Badge>
            {hasPayments && (
              <span className="text-sm text-amber-600 ml-4 flex items-center gap-1">
                <CreditCard size={14} /> Payment received - Invoice locked
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{isEditing ? `View ${formData.invoiceNo}` : 'Create New Invoice'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="invoiceNo">Invoice No</Label>
              <Input id="invoiceNo" value={formData.invoiceNo} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label htmlFor="customerId">Customer</Label>
              <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value, salesOrderId: '' })} disabled={!canEdit}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="salesOrderId">Sales Order</Label>
              <Select 
                value={formData.salesOrderId} 
                onValueChange={(value) => {
                  const selectedSO = salesOrders.find(so => so.id === value);
                  setFormData({ ...formData, salesOrderId: value });
                  // We can enhance this later to load sales order lines
                }} 
                disabled={!canEdit || !formData.customerId}
              >
                <SelectTrigger><SelectValue placeholder={formData.customerId ? "Select SO" : "Select customer first"} /></SelectTrigger>
                <SelectContent>
                  {salesOrders.filter(so => !formData.customerId || so.customerId === formData.customerId).map(so => (
                    <SelectItem key={so.id} value={so.id}>{so.orderNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Invoice Date</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} disabled={!canEdit} />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} disabled={!canEdit} />
            </div>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-medium">Invoice Lines</h3>
            {canEdit && (
              <Button onClick={handleAddLine} variant="outline" size="sm" className="flex items-center gap-1">
                <Plus size={14} /> Add Line
              </Button>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold text-right">Quantity</TableHead>
                  <TableHead className="font-semibold text-right">Unit Price</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="font-semibold">Analytics (Revenue)</TableHead>
                  {canEdit && <TableHead className="font-semibold text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lines.map((line) => {
                  const lineTotal = getLineTotal(line);
                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Select value={line.productId} onValueChange={(value) => handleLineChange(line.id, 'productId', value)} disabled={!canEdit}>
                          <SelectTrigger className="w-40"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input value={line.description} onChange={(e) => handleLineChange(line.id, 'description', e.target.value)} 
                          className="w-48" disabled={!canEdit} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input type="number" value={line.quantity} onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)} 
                          className="w-20 text-right ml-auto" disabled={!canEdit} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input type="number" value={line.price} onChange={(e) => handleLineChange(line.id, 'price', e.target.value)} 
                          className="w-28 text-right ml-auto" disabled={!canEdit} />
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(lineTotal)}</TableCell>
                      <TableCell>
                        <Select value={line.analyticId} onValueChange={(value) => handleLineChange(line.id, 'analyticId', value)} disabled={!canEdit}>
                          <SelectTrigger className="w-40"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {analytics.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveLine(line.id)}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="bg-gray-50 rounded-lg p-4 w-full max-w-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Received Amount:</span>
                <span className="font-bold text-green-600">{formatCurrency(formData.receivedAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Balance Due:</span>
                <span className={`font-bold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Save Invoice
              </Button>
              <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (view === 'form') return renderFormView();
  return renderListView();
}
