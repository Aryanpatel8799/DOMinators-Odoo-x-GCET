import { useState, useEffect } from 'react';
import { Plus, CreditCard, CheckCircle, ArrowLeft, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { vendorBillAPI, contactAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function BillPayments() {
  const [view, setView] = useState('list');
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [vendors, setVendors] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [billsRes, vendorsRes, paymentsRes] = await Promise.all([
        vendorBillAPI.getAll({ limit: 100 }),
        contactAPI.getVendors({ limit: 100 }),
        vendorBillAPI.getAllPayments()
      ]);

      // Transform bills
      const transformedBills = (billsRes.data || []).map(b => ({
        id: b.id.toString(),
        billNo: b.bill_number,
        vendorId: b.vendor_id?.toString() || b.contact_id?.toString() || '',
        vendorName: b.vendor_name || '',
        totalAmount: parseFloat(b.total_amount) || 0,
        paidAmount: parseFloat(b.paid_amount) || 0,
        dueDate: b.due_date?.split('T')[0] || '',
        status: b.status || 'DRAFT'
      }));

      // Transform vendors
      const transformedVendors = (vendorsRes.data || []).map(v => ({
        id: v.id.toString(),
        name: v.name
      }));

      // Transform payments
      const transformedPayments = (paymentsRes.data || []).map(p => ({
        id: p.id.toString(),
        paymentNo: p.payment_number || `BP-${p.id}`,
        billId: p.vendor_bill_id?.toString() || '',
        billNo: p.bill_number || '',
        vendorName: p.vendor_name || '',
        date: p.payment_date?.split('T')[0] || '',
        amount: parseFloat(p.amount) || 0,
        method: p.payment_method || '',
        reference: p.reference || ''
      }));

      setBills(transformedBills);
      setVendors(transformedVendors);
      setPayments(transformedPayments);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const [formData, setFormData] = useState({
    billId: '',
    date: '',
    amount: '',
    method: '',
    reference: '',
    memo: '',
  });

  const paymentMethods = ['Cash', 'Bank Transfer', 'NEFT', 'RTGS', 'UPI', 'Cheque'];

  const getVendorName = (vendorId, bill = null) => {
    if (bill?.vendorName) return bill.vendorName;
    return vendors.find(v => v.id === vendorId)?.name || 'Unknown';
  };
  const getBillInfo = (billId) => bills.find(b => b.id === billId);
  const getBalance = (bill) => bill.totalAmount - bill.paidAmount;

  const getPaymentStatus = (bill) => {
    if (bill.paidAmount >= bill.totalAmount) return { status: 'Paid', variant: 'default' };
    if (bill.paidAmount > 0) return { status: 'Partial', variant: 'outline' };
    return { status: 'Unpaid', variant: 'secondary' };
  };

  const generatePaymentNo = () => {
    const year = new Date().getFullYear();
    const count = payments.length + 1;
    return `BP-${year}-${count.toString().padStart(3, '0')}`;
  };

  const handleNewPayment = (bill = null) => {
    setFormData({
      billId: bill?.id || '',
      date: new Date().toISOString().split('T')[0],
      amount: bill ? getBalance(bill).toString() : '',
      method: '',
      reference: '',
      memo: '',
    });
    setSelectedBill(bill);
    setView('form');
  };

  const handleSavePayment = async () => {
    const bill = bills.find(b => b.id === formData.billId);
    if (!bill) return;

    const paymentAmount = parseFloat(formData.amount) || 0;

    setSaving(true);
    try {
      await vendorBillAPI.createPayment(formData.billId, {
        amount: paymentAmount,
        payment_date: formData.date,
        payment_method: formData.method,
        reference: formData.reference,
        memo: formData.memo
      });

      // Reload data to get fresh state
      await loadData();
      setView('list');
      setFormData({ billId: '', date: '', amount: '', method: '', reference: '', memo: '' });
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  // List View
  const renderListView = () => (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bill Payments</h1>
          <p className="text-gray-600">Record and manage payments for vendor bills</p>
        </div>
        <Button onClick={() => handleNewPayment()} className="flex items-center gap-2">
          <Plus size={18} />
          New Payment
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <Button onClick={() => setError(null)} variant="outline" size="sm" className="mt-2">Dismiss</Button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-blue-600" />
          <span className="font-medium text-blue-800">Payment Process</span>
        </div>
        <p className="text-sm text-blue-700">
          Select a vendor bill from the list below and click the payment icon to record a payment. 
          Partial payments are supported - the balance will be automatically updated.
        </p>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading bills...</span>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Vendor Bills - Payment Status</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Bill No</TableHead>
                  <TableHead className="font-semibold">Vendor</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold text-right">Total Amount</TableHead>
                  <TableHead className="font-semibold text-right">Paid Amount</TableHead>
                  <TableHead className="font-semibold text-right">Balance</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No vendor bills found.
                    </TableCell>
                  </TableRow>
                ) : bills.map((bill) => {
                  const balance = getBalance(bill);
                  const paymentStatus = getPaymentStatus(bill);
                  const isOverdue = new Date(bill.dueDate) < new Date() && balance > 0;
                  return (
                    <TableRow key={bill.id} className={isOverdue ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{bill.billNo}</TableCell>
                      <TableCell>{getVendorName(bill.vendorId, bill)}</TableCell>
                      <TableCell className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : '-'}
                        {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(bill.totalAmount)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(bill.paidAmount)}</TableCell>
                      <TableCell className={`text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(balance)}
                      </TableCell>
                      <TableCell><Badge variant={paymentStatus.variant}>{paymentStatus.status}</Badge></TableCell>
                      <TableCell className="text-center">
                        {balance > 0 && bill.status?.toUpperCase() === 'POSTED' ? (
                          <Button variant="outline" size="sm" onClick={() => handleNewPayment(bill)} className="flex items-center gap-1">
                            <CreditCard size={14} /> Pay
                          </Button>
                        ) : balance <= 0 ? (
                          <CheckCircle size={18} className="text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400 text-xs">Post first</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Recent Payments</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Payment No</TableHead>
                  <TableHead className="font-semibold">Bill No</TableHead>
                  <TableHead className="font-semibold">Vendor</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold text-right">Amount</TableHead>
                  <TableHead className="font-semibold">Method</TableHead>
                  <TableHead className="font-semibold">Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No payments recorded yet.
                    </TableCell>
                  </TableRow>
                ) : payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-blue-600">{payment.paymentNo}</TableCell>
                    <TableCell>{payment.billNo || '-'}</TableCell>
                    <TableCell>{payment.vendorName || '-'}</TableCell>
                    <TableCell>{payment.date ? new Date(payment.date).toLocaleDateString('en-IN') : '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell><Badge variant="outline">{payment.method}</Badge></TableCell>
                    <TableCell className="text-gray-600">{payment.reference || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );

  // Form View
  const renderFormView = () => {
    const bill = bills.find(b => b.id === formData.billId);
    const maxPayable = bill ? getBalance(bill) : 0;

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
            <CreditCard size={20} /> Record Bill Payment
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="billId">Vendor Bill *</Label>
              <Select value={formData.billId} onValueChange={(value) => {
                const selectedBill = bills.find(b => b.id === value);
                setFormData({ 
                  ...formData, 
                  billId: value,
                  amount: selectedBill ? getBalance(selectedBill).toString() : ''
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor bill" />
                </SelectTrigger>
                <SelectContent>
                  {bills.filter(b => getBalance(b) > 0 && b.status?.toUpperCase() === 'POSTED').map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.billNo} - {getVendorName(b.vendorId, b)} (Balance: {formatCurrency(getBalance(b))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {bill && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Bill Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Vendor:</span> {getVendorName(bill.vendorId, bill)}</div>
                  <div><span className="text-gray-500">Due Date:</span> {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : '-'}</div>
                  <div><span className="text-gray-500">Total Amount:</span> {formatCurrency(bill.totalAmount)}</div>
                  <div><span className="text-gray-500">Already Paid:</span> {formatCurrency(bill.paidAmount)}</div>
                  <div className="col-span-2 text-lg font-bold text-red-600">
                    Balance Due: {formatCurrency(maxPayable)}
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
                  max={maxPayable}
                />
                {parseFloat(formData.amount) > maxPayable && (
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
              <Button onClick={handleSavePayment} disabled={saving || !formData.billId || !formData.amount || !formData.method || parseFloat(formData.amount) > maxPayable}>
                {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
                <CheckCircle size={16} className="mr-2" /> Record Payment
              </Button>
              <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'form') return renderFormView();
  return renderListView();
}
