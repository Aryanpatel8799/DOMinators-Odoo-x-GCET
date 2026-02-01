import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { customerInvoiceAPI, vendorBillAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function PaymentStatusReport() {
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const [invoicesRes, billsRes] = await Promise.all([
        customerInvoiceAPI.getAll({ limit: 100 }),
        vendorBillAPI.getAll({ limit: 100 })
      ]);

      const invoices = (invoicesRes.data || []).map(inv => ({
        id: `inv-${inv.id}`,
        type: 'Invoice',
        number: inv.invoice_number || `INV-${inv.id}`,
        party: inv.contact_name || 'Unknown Customer',
        totalAmount: parseFloat(inv.total_amount) || 0,
        paidAmount: parseFloat(inv.paid_amount) || 0,
        status: getPaymentStatus(inv.payment_status, inv.total_amount, inv.paid_amount),
      }));

      const bills = (billsRes.data || []).map(bill => ({
        id: `bill-${bill.id}`,
        type: 'Bill',
        number: bill.bill_number || `BILL-${bill.id}`,
        party: bill.contact_name || 'Unknown Vendor',
        totalAmount: parseFloat(bill.total_amount) || 0,
        paidAmount: parseFloat(bill.paid_amount) || 0,
        status: getPaymentStatus(bill.payment_status, bill.total_amount, bill.paid_amount),
      }));

      setData([...invoices, ...bills]);
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getPaymentStatus(apiStatus, total, paid) {
    const totalAmount = parseFloat(total) || 0;
    const paidAmount = parseFloat(paid) || 0;
    
    if (apiStatus?.toUpperCase() === 'PAID' || paidAmount >= totalAmount) return 'Paid';
    if (apiStatus?.toUpperCase() === 'PARTIAL' || (paidAmount > 0 && paidAmount < totalAmount)) return 'Partially Paid';
    return 'Not Paid';
  }

  const filteredData = filter === 'all' ? data : data.filter(item => item.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Partially Paid':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  const totals = {
    totalAmount: data.reduce((sum, item) => sum + item.totalAmount, 0),
    paidAmount: data.reduce((sum, item) => sum + item.paidAmount, 0),
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Error loading report: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payment Status Report</h1>
        <p className="text-gray-600">Track payment status for invoices and bills</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Total Amount</Label>
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(totals.totalAmount)}
            </div>
          </div>
          <div>
            <Label>Paid Amount</Label>
            <div className="text-2xl font-semibold text-green-600">
              {formatCurrency(totals.paidAmount)}
            </div>
          </div>
          <div>
            <Label>Outstanding</Label>
            <div className="text-2xl font-semibold text-red-600">
              {formatCurrency(totals.totalAmount - totals.paidAmount)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="w-64">
          <Label htmlFor="filter">Filter by Status</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Partially Paid">Partially Paid</SelectItem>
              <SelectItem value="Not Paid">Not Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No invoices or bills found. Create some to see this report.
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Customer / Vendor</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Paid Amount</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => {
              const balance = item.totalAmount - item.paidAmount;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell>{item.number}</TableCell>
                  <TableCell>{item.party}</TableCell>
                  <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                  <TableCell>{formatCurrency(item.paidAmount)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(balance)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </div>
    </div>
  );
}
