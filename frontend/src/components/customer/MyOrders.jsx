import { useState, useEffect } from 'react';
import { Eye, Loader2, AlertCircle, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { customerPortalAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerPortalAPI.getSalesOrders({ limit: 100 });
      const transformedOrders = (response.data || []).map((order) => ({
        id: String(order.id),
        orderNo: order.order_number,
        date: order.order_date,
        amount: parseFloat(order.total_amount) || 0,
        status: order.status,
        hasInvoice: order.has_invoice || false,
        items: order.lines?.length || 0,
      }));
      setOrders(transformedOrders);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (order) => {
    try {
      setOrderLoading(true);
      const response = await customerPortalAPI.getSalesOrderById(order.id);
      const data = response.data || response;
      setSelectedOrder({
        ...order,
        lines: (data.lines || []).map(line => ({
          product: line.product_name || line.name,
          quantity: parseFloat(line.quantity) || 1,
          price: parseFloat(line.unit_price) || 0,
          total: parseFloat(line.subtotal) || (line.quantity * line.unit_price)
        }))
      });
    } catch (err) {
      setError('Failed to load order details: ' + err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const downloadOrder = async (order) => {
    try {
      await customerPortalAPI.downloadSalesOrder(order.id, order.orderNo);
    } catch (err) {
      setError('Failed to download order: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
      case 'SENT':
        return <Badge variant="secondary" className="bg-blue-500 text-white">Sent</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track your order history</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track your order history</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
          <Button variant="outline" className="ml-auto" onClick={loadOrders}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Order Detail View
  if (selectedOrder) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setSelectedOrder(null)} className="mb-4">
            ← Back to Orders
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{selectedOrder.orderNo}</h1>
              <p className="text-gray-600">Order Date: {new Date(selectedOrder.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            {getStatusBadge(selectedOrder.status)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold text-right">Quantity</TableHead>
                <TableHead className="font-semibold text-right">Unit Price</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedOrder.lines?.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell>{line.product}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.price)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(line.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-xl font-semibold">
              Total: {formatCurrency(selectedOrder.amount)}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => downloadOrder(selectedOrder)} className="flex items-center gap-2">
            <Download size={16} /> Download PDF
          </Button>
          {selectedOrder.hasInvoice && (
            <div className="flex items-center gap-2 text-green-600">
              <FileText size={16} />
              <span>Invoice has been generated</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
        <p className="text-gray-600">Track your order history</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <p>No orders found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Order No</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-center">Items</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">Invoice</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-blue-600">{order.orderNo}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell className="text-center">{order.items}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(order.amount)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-center">
                    {order.hasInvoice ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">Yes</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => viewOrderDetails(order)}
                        disabled={orderLoading}
                        title="View Details"
                      >
                        {orderLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => downloadOrder(order)}
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
