import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Printer, X, ArrowLeft, Trash2, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { salesOrderAPI, contactAPI, productAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function SalesOrders() {
  const [view, setView] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [formData, setFormData] = useState({
    orderNo: '',
    customerId: '',
    date: '',
    status: 'DRAFT',
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
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        salesOrderAPI.getAll({ limit: 100 }),
        contactAPI.getCustomers({ limit: 100 }),
        productAPI.getAll({ limit: 100 })
      ]);
      
      // Transform orders from API format
      const transformedOrders = (ordersRes.data || []).map(o => ({
        id: o.id.toString(),
        orderNo: o.order_number,
        customerId: (o.customer_id || o.contact_id)?.toString() || '',
        customerName: o.customer_name || '',
        date: o.order_date?.split('T')[0] || '',
        status: o.status || 'DRAFT',
        hasInvoice: o.has_invoice || false,
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
      setCustomers((customersRes.data || []).map(c => ({ id: c.id.toString(), name: c.name })));
      setProducts((productsRes.data || []).map(p => ({ 
        id: p.id.toString(), 
        name: p.name, 
        price: parseFloat(p.sales_price) || parseFloat(p.cost_price) || 0 
      })));
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getCustomerName = (customerId, order = null) => {
    if (order?.customerName) return order.customerName;
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  };
  const getProductName = (productId) => products.find(p => p.id === productId)?.name || 'Unknown';

  const getOrderTotal = (lines) => lines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  const getLineTotal = (line) => line.quantity * line.price;

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase() || 'DRAFT';
    switch (statusUpper) {
      case 'DRAFT': return 'secondary';
      case 'CONFIRMED': return 'default';
      case 'SENT': return 'outline';
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
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const generateOrderNo = () => {
    const year = new Date().getFullYear();
    const count = orders.length + 1;
    return `SO-${year}-${count.toString().padStart(3, '0')}`;
  };

  const handleNew = () => {
    setFormData({
      orderNo: generateOrderNo(),
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      lines: [{ id: '1', productId: '', description: '', quantity: 1, price: 0 }],
    });
    setIsEditing(false);
    setSelectedOrder(null);
    setView('form');
  };

  const handleOpenOrder = async (order) => {
    setSelectedOrder(order);
    setIsEditing(true);
    setView('form');
    
    // Fetch full order details with lines
    try {
      const response = await salesOrderAPI.getById(order.id);
      const fullOrder = response.data || response;
      
      const transformedOrder = {
        id: fullOrder.id?.toString() || order.id,
        orderNo: fullOrder.order_number || order.orderNo,
        customerId: (fullOrder.customer_id || fullOrder.contact_id)?.toString() || order.customerId,
        customerName: fullOrder.customer_name || order.customerName,
        date: fullOrder.order_date?.split('T')[0] || order.date,
        status: fullOrder.status || order.status,
        hasInvoice: fullOrder.has_invoice || order.hasInvoice,
        totalAmount: parseFloat(fullOrder.total_amount) || order.totalAmount,
        lines: (fullOrder.lines || []).map(line => ({
          id: line.id?.toString() || Date.now().toString(),
          productId: line.product_id?.toString() || '',
          description: line.description || line.product_name || '',
          quantity: parseFloat(line.quantity) || 1,
          price: parseFloat(line.unit_price) || 0,
        }))
      };
      
      // Ensure at least one line exists
      if (transformedOrder.lines.length === 0) {
        transformedOrder.lines = [{ id: '1', productId: '', description: '', quantity: 1, price: 0 }];
      }
      
      setFormData(transformedOrder);
      setSelectedOrder(transformedOrder);
    } catch (err) {
      console.error('Error loading order details:', err);
      // Fallback to basic order data
      setFormData({ ...order, lines: order.lines || [{ id: '1', productId: '', description: '', quantity: 1, price: 0 }] });
    }
  };

  const handleConfirm = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    setError(null);
    try {
      await salesOrderAPI.confirm(selectedOrder.id);
      await loadData();
      // Find the updated order from loaded data
      const updatedOrder = orders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setFormData(prev => ({ ...prev, status: 'CONFIRMED' }));
        setSelectedOrder(prev => ({ ...prev, status: 'CONFIRMED' }));
      }
      alert('Sales Order confirmed and Customer Invoice created automatically!');
    } catch (err) {
      setError(err.message || 'Failed to confirm order');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    // Mark as sent (if API supports)
    if (selectedOrder && formData.status?.toUpperCase() === 'CONFIRMED') {
      setFormData(prev => ({ ...prev, status: 'SENT' }));
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    setError(null);
    try {
      await salesOrderAPI.cancel(selectedOrder.id);
      await loadData();
      setFormData(prev => ({ ...prev, status: 'CANCELLED' }));
      setSelectedOrder(prev => ({ ...prev, status: 'CANCELLED' }));
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrder) return;
    // Invoice is auto-created when order is confirmed
    alert('Invoice is automatically created when you confirm the Sales Order.');
  };

  const handlePrint = async () => {
    if (!selectedOrder) return;
    try {
      await salesOrderAPI.downloadPdf(selectedOrder.id, formData.orderNo);
    } catch (err) {
      setError(err.message || 'Failed to download PDF');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Validate required fields
      if (!formData.customerId) {
        setError('Please select a customer');
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
      
      // Validate date is not in the future
      if (formData.date) {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (selectedDate > today) {
          setError('Order date cannot be in the future');
          setSaving(false);
          return;
        }
      }

      const orderData = {
        customer_id: formData.customerId,
        order_date: formData.date || undefined,
        lines: formData.lines.map(line => ({
          product_id: line.productId,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.price,
        }))
      };

      if (isEditing && selectedOrder) {
        await salesOrderAPI.update(selectedOrder.id, orderData);
      } else {
        await salesOrderAPI.create(orderData);
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
    const newLine = { id: Date.now().toString(), productId: '', description: '', quantity: 1, price: 0 };
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
            return { ...line, productId: value, price: product?.price || 0, description: product?.name || '' };
          }
          return { ...line, [field]: field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value };
        }
        return line;
      }),
    }));
  };

  // List View
  const renderListView = () => (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sales Orders</h1>
          <p className="text-gray-600">Manage and track sales orders with budget analytics</p>
        </div>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus size={18} />
          New Sales Order
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
            No sales orders found. Click "New Sales Order" to create one.
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Order No</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">Invoice Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleOpenOrder(order)}>
                <TableCell className="font-medium text-blue-600 hover:text-blue-800">{order.orderNo}</TableCell>
                <TableCell>{getCustomerName(order.customerId, order)}</TableCell>
                <TableCell>{order.date ? new Date(order.date).toLocaleDateString('en-IN') : '-'}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount || getOrderTotal(order.lines))}</TableCell>
                <TableCell><Badge variant={getStatusColor(order.status)}>{getStatusDisplay(order.status)}</Badge></TableCell>
                <TableCell className="text-center">
                  {order.hasInvoice ? <CheckCircle size={18} className="text-green-600 mx-auto" /> : <span className="text-gray-400">-</span>}
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
    const isDraft = formData.status?.toUpperCase() === 'DRAFT';
    const isConfirmed = formData.status?.toUpperCase() === 'CONFIRMED';
    const isSent = formData.status?.toUpperCase() === 'SENT';
    const isCancelled = formData.status?.toUpperCase() === 'CANCELLED';
    const canEdit = isDraft;

    return (
      <div className="p-8">
        <div className="mb-4">
          <Button variant="outline" onClick={() => setView('list')}>
            <ArrowLeft size={18} className="mr-2" />
            Back to List
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={handleConfirm} disabled={!isDraft || saving} className="flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <CheckCircle size={16} /> Confirm
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
              <Printer size={16} /> Print
            </Button>
            <Button onClick={handleCancel} disabled={isCancelled || isDraft || saving} 
              variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
              <X size={16} /> Cancel
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">Current Status:</span>
            <Badge variant={getStatusColor(formData.status)}>{getStatusDisplay(formData.status)}</Badge>
            {(isConfirmed || isSent) && (
              <span className="ml-4 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle size={14} /> Invoice will be auto-created
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{isEditing ? `Edit ${formData.orderNo}` : 'Create New Sales Order'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="orderNo">Order No</Label>
              <Input id="orderNo" value={formData.orderNo} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label htmlFor="customerId">Customer</Label>
              <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })} disabled={!canEdit}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={formData.date} 
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                disabled={!canEdit} 
              />
              <p className="text-xs text-gray-500 mt-1">Date cannot be in the future</p>
            </div>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-medium">Order Lines</h3>
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
                      <TableCell className="text-right font-medium">₹{lineTotal.toLocaleString('en-IN')}</TableCell>
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
            <div className="bg-gray-50 rounded-lg p-4 w-full max-w-xs">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{getOrderTotal(formData.lines).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Order
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
