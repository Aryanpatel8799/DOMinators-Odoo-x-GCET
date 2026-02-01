import { useState, useEffect } from 'react';
import { Plus, CreditCard, CheckCircle, ArrowLeft, Info, DollarSign, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { customerInvoiceAPI, contactAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function InvoicePayments() {
  const [view, setView] = useState('list');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const [formData, setFormData] = useState({
    invoiceId: '',
    date: '',
    amount: '',
    method: '',
    reference: '',
    memo: '',
  });

  const paymentMethods = ['Cash', 'Bank Transfer', 'NEFT', 'RTGS', 'UPI', 'Cheque', 'Credit Card', 'STRIPE'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoicesRes, customersRes, paymentsRes] = await Promise.all([
        customerInvoiceAPI.getAll({ limit: 100 }),
        contactAPI.getCustomers({ limit: 100 }),
        customerInvoiceAPI.getAllPayments({ limit: 100 })
      ]);

      // Transform invoices
      const transformedInvoices = (invoicesRes.data || []).map(inv => ({
        id: inv.id,
        invoiceNo: inv.invoice_number,
        customerId: inv.customer_id,
        customerName: inv.customer_name,
        totalAmount: parseFloat(inv.total_amount) || 0,
        receivedAmount: parseFloat(inv.paid_amount) || 0,
        dueDate: inv.due_date,
        status: inv.status,
        paymentStatus: inv.payment_status,
      }));

      // Transform payments from API response
      const transformedPayments = (paymentsRes.data || []).map(p => ({
        id: p.id,
        paymentNo: p.payment_number,
        invoiceId: p.customer_invoice_id,
        invoiceNo: p.invoice_number,
        customerName: p.customer_name,
        amount: parseFloat(p.amount) || 0,
        date: p.payment_date,
        method: p.payment_method,
        reference: p.reference || ''
      }));

      setInvoices(transformedInvoices);
      setPayments(transformedPayments);
      setCustomers((customersRes.data || []).map(c => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId) => {
    const invoice = invoices.find(i => i.customerId === customerId);
    if (invoice?.customerName) return invoice.customerName;
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  };
  const getInvoiceInfo = (invoiceId) => invoices.find(i => i.id === invoiceId);
  const getBalance = (invoice) => invoice.totalAmount - invoice.receivedAmount;

  const getPaymentStatus = (invoice) => {
    if (invoice.receivedAmount >= invoice.totalAmount) return { status: 'Paid', variant: 'default' };
    if (invoice.receivedAmount > 0) return { status: 'Partial', variant: 'outline' };
    return { status: 'Unpaid', variant: 'secondary' };
  };

  const getPaymentMethodBadge = (method) => {
    if (method === 'STRIPE') {
      return <Badge variant="default" className="bg-purple-600">Stripe</Badge>;
    }
    return <Badge variant="outline">{method}</Badge>;
  };

  const handleNewPayment = (invoice = null) => {
    setFormData({
      invoiceId: invoice?.id || '',
      date: new Date().toISOString().split('T')[0],
      amount: invoice ? getBalance(invoice).toString() : '',
      method: '',
      reference: '',
      memo: '',
    });
    setSelectedInvoice(invoice);
    setView('form');
  };

  const handleSavePayment = async () => {
    const invoice = invoices.find(i => i.id === formData.invoiceId);
    if (!invoice) return;

    const paymentAmount = parseFloat(formData.amount) || 0;
    
    setSaving(true);
    setError(null);
    try {
      await customerInvoiceAPI.createPayment(formData.invoiceId, {
        amount: paymentAmount,
        payment_date: formData.date,
        payment_method: formData.method,
        reference: formData.reference,
        notes: formData.memo
      });
      
      await loadData();
      setView('list');
      setFormData({ invoiceId: '', date: '', amount: '', method: '', reference: '', memo: '' });
    } catch (err) {
      setError(err.message || 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  // List View
  const renderListView = () => (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoice Payments</h1>
          <p className="text-gray-600">Record and manage payments received from customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading} className="flex items-center gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button onClick={() => handleNewPayment()} className="flex items-center gap-2">
            <Plus size={18} />
            New Payment
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-green-600" />
          <span className="font-medium text-green-800">Payment Collection</span>
        </div>
        <p className="text-sm text-green-700">
          Select a customer invoice from the list below and click the payment icon to record a received payment. 
          Partial payments are supported. <span className="font-medium">Stripe payments</span> made by customers online are automatically recorded.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
      <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Customer Invoices - Payment Status</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No invoices found</div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Invoice No</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold text-right">Total Amount</TableHead>
              <TableHead className="font-semibold text-right">Received</TableHead>
              <TableHead className="font-semibold text-right">Balance</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const balance = getBalance(invoice);
              const paymentStatus = getPaymentStatus(invoice);
              const isOverdue = new Date(invoice.dueDate) < new Date() && balance > 0;
              return (
                <TableRow key={invoice.id} className={isOverdue ? 'bg-orange-50' : ''}>
                  <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                  <TableCell>{invoice.customerName || getCustomerName(invoice.customerId)}</TableCell>
                  <TableCell className={isOverdue ? 'text-orange-600 font-medium' : ''}>
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '-'}
                    {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(invoice.receivedAmount)}</TableCell>
                  <TableCell className={`text-right font-medium ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(balance)}
                  </TableCell>
                  <TableCell><Badge variant={paymentStatus.variant}>{paymentStatus.status}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Recent Payments Received</h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payments recorded yet</div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Payment No</TableHead>
              <TableHead className="font-semibold">Invoice No</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold">Method</TableHead>
              <TableHead className="font-semibold">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const invoice = getInvoiceInfo(payment.invoiceId);
              return (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium text-green-600">{payment.paymentNo}</TableCell>
                  <TableCell>{payment.invoiceNo || invoice?.invoiceNo || '-'}</TableCell>
                  <TableCell>{payment.customerName || (invoice ? getCustomerName(invoice.customerId) : '-')}</TableCell>
                  <TableCell>{payment.date ? new Date(payment.date).toLocaleDateString('en-IN') : '-'}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{getPaymentMethodBadge(payment.method)}</TableCell>
                  <TableCell className="text-gray-600">{payment.reference || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </div>
      </>
      )}
    </div>
  );

  // Form View
  const renderFormView = () => {
    const invoice = invoices.find(i => i.id === formData.invoiceId);
    const maxReceivable = invoice ? getBalance(invoice) : 0;

    return (
      <div className="p-8">
        <div className="mb-4">
          <Button variant="outline" onClick={() => setView('list')}>
            <ArrowLeft size={18} className="mr-2" />
            Back to List
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <DollarSign size={20} /> Record Invoice Payment
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="invoiceId">Customer Invoice *</Label>
              <Select value={formData.invoiceId} onValueChange={(value) => {
                const selectedInvoice = invoices.find(i => i.id === value);
                setFormData({ 
                  ...formData, 
                  invoiceId: value,
                  amount: selectedInvoice ? getBalance(selectedInvoice).toString() : ''
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.filter(i => getBalance(i) > 0).map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.invoiceNo} - {getCustomerName(i.customerId)} (Balance: ₹{getBalance(i).toLocaleString('en-IN')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {invoice && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Invoice Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Customer:</span> {getCustomerName(invoice.customerId)}</div>
                  <div><span className="text-gray-500">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</div>
                  <div><span className="text-gray-500">Total Amount:</span> ₹{invoice.totalAmount.toLocaleString('en-IN')}</div>
                  <div><span className="text-gray-500">Already Received:</span> ₹{invoice.receivedAmount.toLocaleString('en-IN')}</div>
                  <div className="col-span-2 text-lg font-bold text-orange-600">
                    Balance Due: ₹{maxReceivable.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Payment Date *</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  max={maxReceivable}
                />
                {parseFloat(formData.amount) > maxReceivable && (
                  <p className="text-red-500 text-xs mt-1">Amount exceeds balance due</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Payment Method *</Label>
                <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(pm => (
                      <SelectItem key={pm} value={pm}>{pm}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reference">Reference / Transaction ID</Label>
                <Input 
                  id="reference" 
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Enter reference number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="memo">Memo / Notes</Label>
              <Textarea 
                id="memo" 
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="Add any notes about this payment"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSavePayment} 
                disabled={!formData.invoiceId || !formData.amount || !formData.method || parseFloat(formData.amount) > maxReceivable || saving}
              >
                {saving ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle size={16} className="mr-2" /> Record Payment</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setView('list')} disabled={saving}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'form') return renderFormView();
  return renderListView();
}
