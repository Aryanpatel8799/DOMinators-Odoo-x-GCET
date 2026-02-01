import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Printer, X, CreditCard, PieChart, ArrowLeft, Trash2, AlertTriangle, Info, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { vendorBillAPI, contactAPI, productAPI, analyticalAccountAPI, purchaseOrderAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function VendorBills() {
  const [view, setView] = useState('list');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBudgetPanel, setShowBudgetPanel] = useState(false);

  // Data states
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [bills, setBills] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    billNo: '',
    vendorId: '',
    purchaseOrderId: '',
    date: '',
    dueDate: '',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    lines: [],
  });
  const [isEditing, setIsEditing] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [vendorsRes, purchaseOrdersRes, productsRes, analyticsRes, billsRes] = await Promise.all([
        contactAPI.getVendors({ limit: 100 }),
        purchaseOrderAPI.getAll({ limit: 100 }),
        productAPI.getAll({ limit: 100 }),
        analyticalAccountAPI.getAll({ limit: 100 }),
        vendorBillAPI.getAll({ limit: 100 }),
      ]);

      // Transform vendors
      setVendors((vendorsRes.data || []).map(v => ({
        id: String(v.id),
        name: v.name,
      })));

      // Transform purchase orders
      setPurchaseOrders((purchaseOrdersRes.data || []).map(po => ({
        id: String(po.id),
        orderNo: po.order_number,
        vendorId: String(po.vendor_id || po.contact_id || ''),
        amount: parseFloat(po.total_amount) || 0,
      })));

      // Transform products (include vendor_id for filtering and cost_price for auto-fill)
      setProducts((productsRes.data || []).map(p => ({
        id: String(p.id),
        name: p.name,
        price: parseFloat(p.sale_price) || 0,
        costPrice: parseFloat(p.cost_price) || 0,
        vendorId: p.vendor_id ? String(p.vendor_id) : null,
      })));

      // Transform analytics
      setAnalytics((analyticsRes.data || []).map(a => ({
        id: String(a.id),
        name: a.name,
        budgeted: parseFloat(a.budget_amount) || 0,
        consumed: parseFloat(a.consumed_amount) || 0,
      })));

      // Transform bills
      setBills((billsRes.data || []).map(transformBillFromAPI));

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Transform bill from API format to component format
  const transformBillFromAPI = (bill) => ({
    id: String(bill.id),
    billNo: bill.bill_number,
    vendorId: String(bill.vendor_id || bill.contact_id || ''),
    vendorName: bill.vendor_name || '',
    purchaseOrderId: String(bill.purchase_order_id || ''),
    date: bill.bill_date ? bill.bill_date.split('T')[0] : '',
    dueDate: bill.due_date ? bill.due_date.split('T')[0] : '',
    status: bill.status || 'DRAFT',
    paymentStatus: bill.payment_status || 'UNPAID',
    paidAmount: parseFloat(bill.paid_amount) || 0,
    totalAmount: parseFloat(bill.total_amount) || 0,
    lines: (bill.lines || []).map((line, idx) => ({
      id: String(line.id || idx + 1),
      productId: String(line.product_id || ''),
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 1,
      price: parseFloat(line.unit_price) || 0,
      analyticId: String(line.analytical_account_id || ''),
    })),
  });

  // Transform bill to API format for create/update
  const transformBillToAPI = (bill) => ({
    vendor_id: bill.vendorId,
    purchase_order_id: bill.purchaseOrderId || null,
    bill_number: bill.billNo,
    bill_date: bill.date,
    due_date: bill.dueDate,
    notes: bill.notes || '',
    lines: bill.lines.map(line => ({
      product_id: line.productId,
      quantity: line.quantity,
      unit_price: line.price,
      description: line.description,
      analytical_account_id: line.analyticId || null,
    })),
  });

  const getVendorName = (vendorId, bill = null) => {
    if (bill?.vendorName) return bill.vendorName;
    return vendors.find(v => v.id === vendorId)?.name || 'Unknown';
  };
  const getProductName = (productId) => products.find(p => p.id === productId)?.name || 'Unknown';
  const getAnalyticName = (analyticId) => analytics.find(a => a.id === analyticId)?.name || 'Unknown';
  const getPurchaseOrderNo = (poId) => purchaseOrders.find(p => p.id === poId)?.orderNo || '-';
  
  // Helper functions for displaying status values
  const getStatusDisplay = (status) => {
    const statusMap = {
      'DRAFT': 'Draft',
      'POSTED': 'Posted',
      'CONFIRMED': 'Posted',
      'PAID': 'Paid',
      'CANCELLED': 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusDisplay = (status) => {
    const statusMap = {
      'UNPAID': 'Unpaid',
      'PARTIAL': 'Partial',
      'PAID': 'Paid',
    };
    return statusMap[status] || status;
  };

  const getAnalyticStatus = (analyticId, amount) => {
    const analytic = analytics.find(a => a.id === analyticId);
    if (!analytic) return { status: 'unknown', message: '' };
    const remaining = analytic.budgeted - analytic.consumed;
    if (amount > remaining) return { status: 'exceed', message: `Exceeds budget by ${formatCurrency(amount - remaining)}` };
    if (amount > remaining * 0.8) return { status: 'warning', message: `${((amount / remaining) * 100).toFixed(0)}% of remaining budget` };
    return { status: 'ok', message: `${formatCurrency(remaining)} remaining` };
  };

  const getBillTotal = (lines) => lines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  const getLineTotal = (line) => line.quantity * line.price;
  const getBalanceDue = (bill) => {
    const total = bill.totalAmount || getBillTotal(bill.lines);
    return total - (bill.paidAmount || 0);
  };
  
  const getPaymentStatus = (bill) => {
    // Use paymentStatus from API if available
    if (bill.paymentStatus) {
      const status = bill.paymentStatus.toUpperCase();
      if (status === 'PAID') return { status: 'Paid', variant: 'default' };
      if (status === 'PARTIAL') return { status: 'Partial', variant: 'outline' };
      return { status: 'Unpaid', variant: 'secondary' };
    }
    // Fallback calculation
    const total = bill.totalAmount || getBillTotal(bill.lines);
    if (bill.paidAmount >= total) return { status: 'Paid', variant: 'default' };
    if (bill.paidAmount > 0) return { status: 'Partial', variant: 'outline' };
    return { status: 'Unpaid', variant: 'secondary' };
  };

  const getStatusColor = (status) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'DRAFT': return 'secondary';
      case 'POSTED': 
      case 'CONFIRMED': return 'default';
      case 'PAID': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const generateBillNo = () => {
    const year = new Date().getFullYear();
    const count = bills.length + 1;
    return `VB-${year}-${count.toString().padStart(3, '0')}`;
  };

  const handleNew = () => {
    setFormData({
      billNo: generateBillNo(),
      vendorId: '',
      purchaseOrderId: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      lines: [{ id: '1', productId: '', description: '', quantity: 1, price: 0, analyticId: '' }],
    });
    setIsEditing(false);
    setSelectedBill(null);
    setView('form');
  };

  const handleOpenBill = async (bill) => {
    try {
      setLoading(true);
      const response = await vendorBillAPI.getById(bill.id);
      const fullBill = transformBillFromAPI(response.data || response);
      setSelectedBill(fullBill);
      setFormData({ ...fullBill });
      setIsEditing(true);
      setView('form');
    } catch (err) {
      console.error('Error loading bill:', err);
      setError('Failed to load bill details.');
      // Fallback to local data
      setSelectedBill(bill);
      setFormData({ ...bill });
      setIsEditing(true);
      setView('form');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (selectedBill) {
      try {
        setSaving(true);
        await vendorBillAPI.updateStatus(selectedBill.id, 'POSTED');
        setBills(bills.map(b => b.id === selectedBill.id ? { ...b, status: 'POSTED' } : b));
        setFormData(prev => ({ ...prev, status: 'POSTED' }));
        setSelectedBill(prev => ({ ...prev, status: 'POSTED' }));
      } catch (err) {
        console.error('Error posting bill:', err);
        setError('Failed to post bill. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancel = async () => {
    if (selectedBill) {
      try {
        setSaving(true);
        await vendorBillAPI.updateStatus(selectedBill.id, 'CANCELLED');
        setBills(bills.map(b => b.id === selectedBill.id ? { ...b, status: 'CANCELLED' } : b));
        setFormData(prev => ({ ...prev, status: 'CANCELLED' }));
      } catch (err) {
        console.error('Error cancelling bill:', err);
        setError('Failed to cancel bill. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleRegisterPayment = () => {
    alert(`Register Payment for ${formData.billNo}\nThis will navigate to Bill Payments with pre-filled data.`);
  };

  const handlePrint = async () => {
    try {
      if (selectedBill) {
        await vendorBillAPI.downloadPdf(selectedBill.id, formData.billNo);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert(`Error printing ${formData.billNo}. Please try again.`);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!formData.vendorId) {
        setError('Please select a vendor');
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

      const billData = transformBillToAPI(formData);

      if (isEditing && selectedBill) {
        // Update existing bill - Note: API may not support full update, using create for now
        // If API supports update, use: await vendorBillAPI.update(selectedBill.id, billData);
        setBills(bills.map(b => b.id === selectedBill.id ? { ...formData, id: selectedBill.id } : b));
      } else {
        const response = await vendorBillAPI.create(billData);
        const newBill = transformBillFromAPI(response.data || response);
        setBills([...bills, newBill]);
      }
      setView('list');
    } catch (err) {
      console.error('Error saving bill:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save bill. Please try again.';
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

  const handleLineChange = (lineId, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id === lineId) {
          if (field === 'productId') {
            const product = products.find(p => p.id === value);
            // Use costPrice (purchase price) for vendor bills
            return { ...line, productId: value, price: product?.costPrice || 0, description: product?.name || '' };
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
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-600">Loading vendor bills...</p>
          </div>
        </div>
      );
    }

    return (
    <div className="p-8">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle size={16} />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vendor Bills</h1>
          <p className="text-gray-600">Manage and track vendor bills with payment status</p>
        </div>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus size={18} />
          New Vendor Bill
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Bill No</TableHead>
              <TableHead className="font-semibold">Vendor</TableHead>
              <TableHead className="font-semibold">PO Ref</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold text-right">Paid</TableHead>
              <TableHead className="font-semibold text-right">Balance</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No vendor bills found. Click "New Vendor Bill" to create one.
                </TableCell>
              </TableRow>
            ) : bills.map((bill) => {
              const total = bill.totalAmount || getBillTotal(bill.lines);
              const balance = getBalanceDue(bill);
              const paymentStatus = getPaymentStatus(bill);
              return (
                <TableRow key={bill.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleOpenBill(bill)}>
                  <TableCell className="font-medium text-blue-600 hover:text-blue-800">{bill.billNo}</TableCell>
                  <TableCell>{getVendorName(bill.vendorId, bill)}</TableCell>
                  <TableCell>{getPurchaseOrderNo(bill.purchaseOrderId)}</TableCell>
                  <TableCell>{bill.date ? new Date(bill.date).toLocaleDateString('en-IN') : '-'}</TableCell>
                  <TableCell>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(total)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(bill.paidAmount || 0)}</TableCell>
                  <TableCell className={`text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(balance)}
                  </TableCell>
                  <TableCell><Badge variant={paymentStatus.variant}>{paymentStatus.status}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
  };

  // Form View
  const renderFormView = () => {
    const total = getBillTotal(formData.lines);
    const hasPayments = (formData.paidAmount || 0) > 0;
    const canEdit = formData.status === 'DRAFT' && !hasPayments;
    const balance = total - (formData.paidAmount || 0);

    return (
      <div className="p-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle size={16} />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                <X size={16} />
              </Button>
            </div>
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
            <Button onClick={handleNew} variant="outline" className="flex items-center gap-2">
              <Plus size={16} /> New
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
              <Printer size={16} /> Print
            </Button>
            <div className="border-l border-gray-300 h-8 mx-2"></div>
            <Button onClick={handleRegisterPayment} disabled={balance <= 0} 
              variant="outline" className="flex items-center gap-2 text-green-600 hover:text-green-700">
              <CreditCard size={16} /> Register Payment
            </Button>
            <Button onClick={() => setShowBudgetPanel(!showBudgetPanel)} variant="outline" className="flex items-center gap-2">
              <PieChart size={16} /> Budget
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-500">Payment:</span>
            <Badge variant={getPaymentStatus(formData).variant}>{getPaymentStatus(formData).status}</Badge>
          </div>
        </div>

        {showBudgetPanel && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <PieChart size={18} /> Budget Impact Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.map(a => {
                const billAmount = formData.lines.filter(l => l.analyticId === a.id).reduce((sum, l) => sum + getLineTotal(l), 0);
                const remaining = a.budgeted - a.consumed;
                const newRemaining = remaining - billAmount;
                return (
                  <div key={a.id} className="bg-white rounded-lg p-3 border">
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-gray-500">Budget: {formatCurrency(a.budgeted)}</p>
                    <p className="text-xs text-gray-500">Consumed: {formatCurrency(a.consumed)}</p>
                    <p className="text-xs text-gray-500">Remaining: {formatCurrency(remaining)}</p>
                    {billAmount > 0 && (
                      <p className={`text-xs font-medium mt-1 ${newRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        After Bill: {formatCurrency(newRemaining)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{isEditing ? `Edit ${formData.billNo}` : 'Create New Vendor Bill'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="billNo">Bill No</Label>
              <Input id="billNo" value={formData.billNo} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label htmlFor="vendorId">Vendor</Label>
              <Select value={formData.vendorId} onValueChange={(value) => setFormData({ ...formData, vendorId: value })} disabled={!canEdit}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="purchaseOrderId">Purchase Order</Label>
              <Select value={formData.purchaseOrderId} onValueChange={(value) => setFormData({ ...formData, purchaseOrderId: value })} disabled={!canEdit}>
                <SelectTrigger><SelectValue placeholder="Select PO" /></SelectTrigger>
                <SelectContent>
                  {purchaseOrders.filter(po => !formData.vendorId || po.vendorId === formData.vendorId).map(po => (
                    <SelectItem key={po.id} value={po.id}>{po.orderNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Bill Date</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} disabled={!canEdit} />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} disabled={!canEdit} />
            </div>
          </div>

          {hasPayments && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              Payment received ({formatCurrency(formData.paidAmount)}) - Bill is locked and cannot be edited
            </div>
          )}

          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-medium">Bill Lines</h3>
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
                  <TableHead className="font-semibold">Analytics</TableHead>
                  <TableHead className="font-semibold">Budget Status</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lines.map((line) => {
                  const lineTotal = getLineTotal(line);
                  const budgetStatus = getAnalyticStatus(line.analyticId, lineTotal);
                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Select value={line.productId} onValueChange={(value) => handleLineChange(line.id, 'productId', value)} disabled={!canEdit}>
                          <SelectTrigger className="w-40"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {products.filter(p => formData.vendorId && p.vendorId === formData.vendorId).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input value={line.description} onChange={(e) => handleLineChange(line.id, 'description', e.target.value)} 
                          className="w-40" disabled={!canEdit} />
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
                      <TableCell>
                        {line.analyticId && (
                          <div className={`flex items-center gap-1 text-xs ${
                            budgetStatus.status === 'exceed' ? 'text-red-600' : 
                            budgetStatus.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {budgetStatus.status !== 'ok' && <AlertTriangle size={14} />}
                            {budgetStatus.status === 'ok' && <CheckCircle size={14} />}
                            <span>{budgetStatus.message}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveLine(line.id)}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        )}
                      </TableCell>
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
                <span className="text-gray-600">Paid Amount:</span>
                <span className="font-bold text-green-600">{formatCurrency(formData.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Balance Due:</span>
                <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : 'Save Bill'}
            </Button>
            <Button variant="outline" onClick={() => setView('list')} disabled={saving}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'form') return renderFormView();
  return renderListView();
}
