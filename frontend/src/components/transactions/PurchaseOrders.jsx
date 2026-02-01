import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Download, Send, X, FileText, PieChart, ArrowLeft, Trash2, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { purchaseOrderAPI, contactAPI, productAPI, analyticalAccountAPI, autoAnalyticalModelAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function PurchaseOrders() {
  const [view, setView] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBudgetPanel, setShowBudgetPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [orders, setOrders] = useState([]);
  const [autoModels, setAutoModels] = useState([]);

  const [formData, setFormData] = useState({
    orderNo: '',
    vendorId: '',
    date: '',
    lines: [],
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, vendorsRes, productsRes, analyticsRes, autoModelsRes] = await Promise.all([
        purchaseOrderAPI.getAll({ limit: 100 }),
        contactAPI.getVendors({ limit: 100 }),
        productAPI.getAll({ limit: 100 }),
        analyticalAccountAPI.getAll({ limit: 100 }),
        autoAnalyticalModelAPI.getAll({ limit: 100 })
      ]);
      
      // Transform orders from API format
      const transformedOrders = (ordersRes.data || []).map(o => ({
        id: o.id.toString(),
        orderNo: o.order_number,
        vendorId: (o.vendor_id || o.contact_id)?.toString() || '',
        vendorName: o.vendor_name || '',
        date: o.order_date?.split('T')[0] || '',
        status: o.status || 'DRAFT',
        hasBill: o.has_bill || false,
        totalAmount: parseFloat(o.total_amount) || 0,
        lines: (o.lines || []).map(line => ({
          id: line.id?.toString() || Date.now().toString(),
          productId: line.product_id?.toString() || '',
          description: line.description || '',
          quantity: line.quantity || 1,
          price: parseFloat(line.unit_price) || 0,
          analyticId: line.analytical_account_id?.toString() || '',
        }))
      }));

      setOrders(transformedOrders);
      setVendors((vendorsRes.data || []).map(v => ({ id: v.id.toString(), name: v.name })));
      // Include vendor_id and category_id for filtering and auto-assignment
      setProducts((productsRes.data || []).map(p => ({ 
        id: p.id.toString(), 
        name: p.name, 
        price: parseFloat(p.cost_price) || 0,
        vendorId: p.vendor_id ? p.vendor_id.toString() : null,
        categoryId: p.category_id ? p.category_id.toString() : null
      })));
      setAnalytics((analyticsRes.data || []).map(a => ({ id: a.id.toString(), name: a.name, budgeted: parseFloat(a.budget_amount) || 0, consumed: parseFloat(a.consumed_amount) || 0 })));
      // Store auto analytical models for category-based budget assignment
      setAutoModels((autoModelsRes.data || []).map(m => ({
        id: m.id.toString(),
        categoryId: m.product_category_id?.toString() || null,
        productId: m.product_id?.toString() || null,
        analyticId: m.analytical_account_id?.toString() || ''
      })));
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getVendorName = (vendorId, order = null) => {
    if (order?.vendorName) return order.vendorName;
    return vendors.find(v => v.id === vendorId)?.name || 'Unknown';
  };
  const getProductName = (productId) => products.find(p => p.id === productId)?.name || 'Unknown';
  const getAnalyticName = (analyticId) => analytics.find(a => a.id === analyticId)?.name || 'Unknown';
  
  const getAnalyticStatus = (analyticId, amount) => {
    const analytic = analytics.find(a => a.id === analyticId);
    if (!analytic) return { status: 'unknown', message: '' };
    const remaining = analytic.budgeted - analytic.consumed;
    if (amount > remaining) return { status: 'exceed', message: `Exceeds budget by ${formatCurrency(amount - remaining)}` };
    if (amount > remaining * 0.8) return { status: 'warning', message: `${((amount / remaining) * 100).toFixed(0)}% of remaining budget` };
    return { status: 'ok', message: `${formatCurrency(remaining)} remaining` };
  };

  const getOrderTotal = (lines) => lines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  const getLineTotal = (line) => line.quantity * line.price;

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase() || 'DRAFT';
    switch (statusUpper) {
      case 'DRAFT': return 'secondary';
      case 'CONFIRMED': return 'default';
      case 'SENT': return 'outline';
      case 'RECEIVED': return 'outline';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusDisplay = (status) => {
    const statusUpper = status?.toUpperCase() || 'DRAFT';
    switch (statusUpper) {
      case 'DRAFT': return 'Draft';
      case 'CONFIRMED': return 'Confirmed';
      case 'SENT': return 'Sent';
      case 'RECEIVED': return 'Received';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const generateOrderNo = () => {
    const year = new Date().getFullYear();
    const count = orders.length + 1;
    return `PO-${year}-${count.toString().padStart(3, '0')}`;
  };

  const handleNew = () => {
    setFormData({
      orderNo: generateOrderNo(),
      vendorId: '',
      date: new Date().toISOString().split('T')[0],
      lines: [{ id: '1', productId: '', description: '', quantity: 1, price: 0, analyticId: '' }],
    });
    setIsEditing(false);
    setSelectedOrder(null);
    setView('form');
  };

  const handleOpenOrder = async (order) => {
    setLoading(true);
    try {
      // Fetch full order with lines
      const response = await purchaseOrderAPI.getById(order.id);
      const fullOrder = response.data;
      
      const transformedOrder = {
        id: fullOrder.id.toString(),
        orderNo: fullOrder.order_number,
        vendorId: (fullOrder.vendor_id || fullOrder.contact_id)?.toString() || '',
        vendorName: fullOrder.vendor_name || '',
        date: fullOrder.order_date?.split('T')[0] || '',
        status: fullOrder.status || 'DRAFT',
        hasBill: fullOrder.has_bill || false,
        totalAmount: parseFloat(fullOrder.total_amount) || 0,
        lines: (fullOrder.lines || []).map(line => ({
          id: line.id?.toString() || Date.now().toString(),
          productId: line.product_id?.toString() || '',
          description: line.description || '',
          quantity: parseFloat(line.quantity) || 1,
          price: parseFloat(line.unit_price) || 0,
          analyticId: line.analytical_account_id?.toString() || '',
        }))
      };
      
      // Ensure at least one line exists
      if (transformedOrder.lines.length === 0) {
        transformedOrder.lines = [{ id: '1', productId: '', description: '', quantity: 1, price: 0, analyticId: '' }];
      }
      
      setSelectedOrder(transformedOrder);
      setFormData(transformedOrder);
      setIsEditing(true);
      setView('form');
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (selectedOrder) {
      setSaving(true);
      try {
        await purchaseOrderAPI.updateStatus(parseInt(selectedOrder.id), 'CONFIRMED');
        await loadData();
        setFormData(prev => ({ ...prev, status: 'CONFIRMED' }));
        setSelectedOrder(prev => ({ ...prev, status: 'CONFIRMED' }));
      } catch (err) {
        setError(err.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSend = async () => {
    // Mark as sent (if API supports)
    if (selectedOrder && formData.status?.toUpperCase() === 'CONFIRMED') {
      setFormData(prev => ({ ...prev, status: 'SENT' }));
    }
  };

  const handleCancel = async () => {
    if (selectedOrder) {
      setSaving(true);
      try {
        await purchaseOrderAPI.updateStatus(parseInt(selectedOrder.id), 'CANCELLED');
        await loadData();
        setFormData(prev => ({ ...prev, status: 'CANCELLED' }));
      } catch (err) {
        setError(err.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDownload = async () => {
    if (!selectedOrder) return;
    try {
      await purchaseOrderAPI.downloadPdf(selectedOrder.id, formData.orderNo || 'purchase-order');
    } catch (err) {
      setError('Failed to download PDF: ' + err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Validate required fields
      if (!formData.vendorId) {
        setError('Please select a vendor');
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

      // Note: Budget validation is handled on the backend
      // The frontend analytics data only shows budgets active for the current date
      // so we skip client-side budget validation to avoid false rejections

      const orderData = {
        vendor_id: formData.vendorId,
        order_date: formData.date || undefined,
        lines: formData.lines.map(line => ({
          product_id: line.productId,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.price,
          analytical_account_id: line.analyticId || undefined,
        }))
      };

      if (isEditing && selectedOrder) {
        // Update existing order
        await purchaseOrderAPI.update(selectedOrder.id, orderData);
      } else {
        await purchaseOrderAPI.create(orderData);
      }
      await loadData();
      setView('list');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save order';
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

  // Resolve analytical account using backend auto analytical rules
  const resolveAnalyticalAccount = async (vendorId, productId) => {
    if (!vendorId || !productId) return '';
    try {
      console.log('[PO] Resolving analytics for vendor:', vendorId, 'product:', productId);
      const response = await autoAnalyticalModelAPI.resolve(vendorId, productId);
      console.log('[PO] API Response:', response);
      // Response is { success: true, data: { analyticalAccountId: '...' } }
      const analyticalAccountId = response?.data?.analyticalAccountId;
      const result = analyticalAccountId ? analyticalAccountId.toString() : '';
      console.log('[PO] Resolved analyticalAccountId:', result);
      return result;
    } catch (err) {
      console.error('Error resolving analytical account:', err);
      return '';
    }
  };

  // Handle vendor change - re-resolve analytics for all lines
  const handleVendorChange = async (vendorId) => {
    // Update vendor first
    setFormData(prev => ({ ...prev, vendorId }));
    
    // Re-resolve analytics for all lines with products
    const currentLines = formData.lines;
    const updatedLines = await Promise.all(
      currentLines.map(async (line) => {
        if (line.productId && vendorId) {
          const analyticalAccountId = await resolveAnalyticalAccount(vendorId, line.productId);
          return { ...line, analyticId: analyticalAccountId || line.analyticId };
        }
        return line;
      })
    );
    
    setFormData(prev => ({ ...prev, vendorId, lines: updatedLines }));
  };

  const handleLineChange = async (lineId, field, value) => {
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      // Auto-resolve analytical account using backend rules
      const autoAnalyticId = formData.vendorId ? await resolveAnalyticalAccount(formData.vendorId, value) : '';
      
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.map(line => {
          if (line.id === lineId) {
            return { 
              ...line, 
              productId: value, 
              price: product?.price || 0, 
              description: product?.name || '',
              analyticId: autoAnalyticId || line.analyticId 
            };
          }
          return line;
        }),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.map(line => {
          if (line.id === lineId) {
            return { ...line, [field]: field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value };
          }
          return line;
        }),
      }));
    }
  };

  // List View
  const renderListView = () => (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Manage and track purchase orders with budget validation</p>
        </div>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus size={18} />
          New Purchase Order
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No purchase orders found. Click "New Purchase Order" to create one.
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Order No</TableHead>
              <TableHead className="font-semibold">Vendor</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleOpenOrder(order)}>
                <TableCell className="font-medium text-blue-600 hover:text-blue-800">{order.orderNo}</TableCell>
                <TableCell>{getVendorName(order.vendorId, order)}</TableCell>
                <TableCell>{order.date ? new Date(order.date).toLocaleDateString('en-IN') : '-'}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount || getOrderTotal(order.lines))}</TableCell>
                <TableCell className="text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status || 'DRAFT'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>
    </div>
  );

  // Form View
  const renderFormView = () => {
    return (
      <div className="p-8">
        <div className="mb-4">
          <Button variant="outline" onClick={() => setView('list')}>
            <ArrowLeft size={18} className="mr-2" />
            Back to List
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {selectedOrder && (
              <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
                <Download size={16} /> Download PDF
              </Button>
            )}
            <Button onClick={() => setShowBudgetPanel(!showBudgetPanel)} variant="outline" className="flex items-center gap-2">
              <PieChart size={16} /> Budget
            </Button>
          </div>
        </div>

        {showBudgetPanel && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <PieChart size={18} /> Budget Impact Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.map(a => {
                const orderAmount = formData.lines.filter(l => l.analyticId === a.id).reduce((sum, l) => sum + getLineTotal(l), 0);
                const remaining = a.budgeted - a.consumed;
                const newRemaining = remaining - orderAmount;
                return (
                  <div key={a.id} className="bg-white rounded-lg p-3 border">
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-gray-500">Budget: {formatCurrency(a.budgeted)}</p>
                    <p className="text-xs text-gray-500">Consumed: {formatCurrency(a.consumed)}</p>
                    <p className="text-xs text-gray-500">Remaining: {formatCurrency(remaining)}</p>
                    {orderAmount > 0 && (
                      <p className={`text-xs font-medium mt-1 ${newRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        After PO: {formatCurrency(newRemaining)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{isEditing ? `Edit ${formData.orderNo}` : 'Create New Purchase Order'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="orderNo">Order No</Label>
              <Input id="orderNo" value={formData.orderNo} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label htmlFor="vendorId">Vendor</Label>
              <Select value={formData.vendorId} onValueChange={handleVendorChange}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-medium">Order Lines</h3>
            <Button onClick={handleAddLine} variant="outline" size="sm" className="flex items-center gap-1">
              <Plus size={14} /> Add Line
            </Button>
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
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lines.map((line) => {
                  const lineTotal = getLineTotal(line);
                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Select value={line.productId} onValueChange={(value) => handleLineChange(line.id, 'productId', value)}>
                          <SelectTrigger className="w-40"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {products.filter(p => formData.vendorId && p.vendorId === formData.vendorId).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input value={line.description} onChange={(e) => handleLineChange(line.id, 'description', e.target.value)} 
                          className="w-40" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input type="number" value={line.quantity} onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)} 
                          className="w-20 text-right ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input type="number" value={line.price} onChange={(e) => handleLineChange(line.id, 'price', e.target.value)} 
                          className="w-28 text-right ml-auto" />
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(lineTotal)}</TableCell>
                      <TableCell>
                        <Select value={line.analyticId} onValueChange={(value) => handleLineChange(line.id, 'analyticId', value)}>
                          <SelectTrigger className="w-40"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {analytics.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveLine(line.id)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="bg-gray-50 rounded-lg p-4 w-full max-w-xs">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(getOrderTotal(formData.lines))}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Save Order
            </Button>
            <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'form') return renderFormView();
  return renderListView();
}
