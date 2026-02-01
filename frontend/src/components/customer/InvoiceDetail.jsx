import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { customerPortalAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function InvoiceDetail({ invoice, onBack }) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (invoice?.id) {
      loadInvoiceDetails();
      checkPaymentStatus();
    } else if (invoice) {
      setInvoiceData(transformInvoice(invoice));
    }
  }, [invoice]);

  const checkPaymentStatus = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const invoiceId = urlParams.get('invoice_id');
    
    // Check if we have a payment session to verify
    if (sessionId && (invoiceId === invoice?.id || invoiceId === String(invoice?.id))) {
      try {
        setPaymentLoading(true);
        await customerPortalAPI.verifyStripePayment(invoiceId, sessionId);
        setPaymentSuccess(true);
        // Clean URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
        // Reload invoice to show updated payment status
        await loadInvoiceDetails();
      } catch (err) {
        setError('Payment verification failed: ' + err.message);
      } finally {
        setPaymentLoading(false);
      }
    }
  };

  const loadInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerPortalAPI.getInvoiceById(invoice.id);
      const data = response.data || response;
      setInvoiceData(transformInvoice(data));
    } catch (err) {
      setError(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const transformInvoice = (inv) => ({
    id: inv.id,
    invoiceNo: inv.invoiceNo || inv.invoice_number,
    customer: inv.customer || inv.customer_name,
    date: inv.date || inv.invoice_date,
    dueDate: inv.dueDate || inv.due_date,
    invoiceStatus: inv.status, // Keep raw status for checking cancelled
    products: inv.products || (inv.lines || []).map(line => ({
      name: line.product_name || line.name,
      quantity: parseFloat(line.quantity) || 1,
      unitPrice: parseFloat(line.unit_price) || 0,
      total: parseFloat(line.subtotal) || (parseFloat(line.quantity) * parseFloat(line.unit_price)) || 0,
    })),
    total: parseFloat(inv.total) || parseFloat(inv.total_amount) || 0,
    paidAmount: parseFloat(inv.paidAmount) || parseFloat(inv.paid_amount) || 0,
    status: getPaymentStatusDisplay(inv.payment_status || inv.status),
  });

  const getPaymentStatusDisplay = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'Paid';
      case 'PARTIALLY_PAID': return 'Partially Paid';
      case 'NOT_PAID': return 'Not Paid';
      default: return status || 'Not Paid';
    }
  };

  const handlePayNow = async () => {
    if (!displayData.id) {
      setError('Invoice ID is missing. Please refresh and try again.');
      return;
    }
    try {
      setPaymentLoading(true);
      setError(null);
      const response = await customerPortalAPI.createStripeCheckout(displayData.id);
      const { url } = response.data || response;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      setPaymentLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await customerPortalAPI.downloadInvoice(displayData.id, displayData.invoiceNo);
    } catch (err) {
      setError(err.message || 'Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const displayData = invoiceData || {
    id: invoice?.id,
    invoiceNo: invoice?.invoiceNo || invoice?.invoice_number || 'Loading...',
    customer: invoice?.customer || invoice?.customer_name || '',
    date: invoice?.date || invoice?.invoice_date || new Date().toISOString(),
    products: invoice?.products || [],
    total: invoice?.amount || invoice?.total || invoice?.total_amount || 0,
    paidAmount: invoice?.paidAmount || invoice?.paid_amount || 0,
    status: invoice?.status || invoice?.payment_status || 'Loading...',
  };

  const balance = displayData.total - (displayData.paidAmount || 0);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoice Details</h1>
          <p className="text-gray-600">View and pay your invoice</p>
        </div>
      </div>

      {paymentSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Payment Successful!</p>
            <p className="text-sm text-green-600">Your payment has been processed successfully.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">{displayData.invoiceNo}</h2>
            <p className="text-gray-600">Date: {new Date(displayData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {displayData.dueDate && (
              <p className="text-gray-600">Due: {new Date(displayData.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            )}
          </div>
          <Badge variant={displayData.status === 'Paid' ? 'default' : displayData.status === 'Partially Paid' ? 'secondary' : 'destructive'}>
            {displayData.status}
          </Badge>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Bill To:</h3>
          <p className="text-lg font-medium text-gray-900">{displayData.customer}</p>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-medium text-gray-600">Product</th>
                <th className="text-right py-3 text-sm font-medium text-gray-600">Quantity</th>
                <th className="text-right py-3 text-sm font-medium text-gray-600">Unit Price</th>
                <th className="text-right py-3 text-sm font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {displayData.products.map((product, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-4">{product.name}</td>
                  <td className="text-right py-4">{product.quantity}</td>
                  <td className="text-right py-4">{formatCurrency(product.unitPrice)}</td>
                  <td className="text-right py-4 font-semibold">{formatCurrency(product.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-6">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">{formatCurrency(displayData.total)}</span>
            </div>
            {displayData.paidAmount > 0 && (
              <div className="flex justify-between text-lg text-green-600">
                <span>Paid Amount:</span>
                <span className="font-semibold">{formatCurrency(displayData.paidAmount)}</span>
              </div>
            )}
            {balance > 0 && (
              <div className="flex justify-between text-xl border-t pt-2">
                <span className="font-semibold">Balance Due:</span>
                <span className="font-bold text-red-600">{formatCurrency(balance)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {balance > 0 && displayData.invoiceStatus !== 'CANCELLED' && (
            <Button onClick={handlePayNow} disabled={paymentLoading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              {paymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard size={18} />}
              {paymentLoading ? 'Processing...' : `Pay Now ${formatCurrency(balance)}`}
            </Button>
          )}
          <Button variant="outline" onClick={handleDownload} disabled={downloading} className="flex items-center gap-2">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={18} />}
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {balance > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Payment Information</h3>
          <p className="text-sm text-blue-700">
            Click "Pay Now" to securely pay your invoice using credit/debit card via Stripe. 
            You will be redirected to a secure payment page.
          </p>
        </div>
      )}
    </div>
  );
}
