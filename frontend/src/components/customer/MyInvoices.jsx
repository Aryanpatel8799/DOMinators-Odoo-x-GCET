import { useState, useEffect } from 'react';
import { Eye, CreditCard, Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { customerPortalAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function MyInvoices({ onViewInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerPortalAPI.getInvoices({ limit: 100 });
      const transformedInvoices = (response.data || []).map(invoice => ({
        id: String(invoice.id),
        invoiceNo: invoice.invoice_number,
        date: invoice.invoice_date,
        dueDate: invoice.due_date,
        amount: parseFloat(invoice.total_amount) || 0,
        paidAmount: parseFloat(invoice.paid_amount) || 0,
        status: invoice.status,
        paymentStatus: invoice.payment_status,
      }));
      setInvoices(transformedInvoices);
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (paymentStatus, dueDate) => {
    const isOverdue = paymentStatus !== 'PAID' && new Date(dueDate) < new Date();
    
    switch (paymentStatus?.toUpperCase()) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="secondary" className="bg-orange-500 text-white">Partial</Badge>;
      default:
        return isOverdue 
          ? <Badge variant="destructive">Overdue</Badge>
          : <Badge variant="secondary">Unpaid</Badge>;
    }
  };

  const getBalance = (invoice) => invoice.amount - invoice.paidAmount;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Invoices</h1>
        <p className="text-gray-600">View and pay your invoices</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading invoices...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          <p>{error}</p>
          <Button variant="outline" size="sm" className="ml-auto" onClick={loadInvoices}>
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <p>No invoices found</p>
        </div>
      )}

      {!loading && !error && invoices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Invoice No</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold text-right">Paid</TableHead>
                <TableHead className="font-semibold text-right">Balance</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const balance = getBalance(invoice);
                const isOverdue = invoice.paymentStatus !== 'PAID' && new Date(invoice.dueDate) < new Date();
                
                return (
                  <TableRow key={invoice.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '-'}
                      {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(invoice.paidAmount)}</TableCell>
                    <TableCell className={`text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(invoice.paymentStatus, invoice.dueDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onViewInvoice(invoice)}
                          title="View Invoice"
                        >
                          <Eye size={16} />
                        </Button>
                        {balance > 0 && invoice.status !== 'CANCELLED' && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => onViewInvoice(invoice)}
                            title="Pay Now"
                          >
                            <CreditCard size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
