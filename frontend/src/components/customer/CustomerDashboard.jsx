import { useState, useEffect } from 'react';
import { FileText, ShoppingCart, CreditCard, DollarSign, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { customerPortalAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    customer: null,
    summary: {
      total_invoices: 0,
      total_amount: 0,
      paid_amount: 0,
      outstanding_amount: 0,
      unpaid_count: 0,
      partial_count: 0,
      paid_count: 0,
      overdue_count: 0,
      overdue_amount: 0
    },
    recent_invoices: []
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerPortalAPI.getDashboard();
      const data = response.data || response;
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const { summary, recent_invoices, customer } = dashboardData;

  const stats = [
    { 
      title: 'Total Invoices', 
      value: summary.total_invoices || 0, 
      icon: FileText, 
      color: 'bg-blue-500',
      subtext: `${summary.paid_count || 0} paid, ${summary.unpaid_count || 0} unpaid`
    },
    { 
      title: 'Outstanding Amount', 
      value: formatCurrency(summary.outstanding_amount || 0), 
      icon: DollarSign, 
      color: 'bg-orange-500',
      subtext: summary.overdue_count > 0 ? `${summary.overdue_count} overdue` : 'All current'
    },
    { 
      title: 'Total Paid', 
      value: formatCurrency(summary.paid_amount || 0), 
      icon: CheckCircle, 
      color: 'bg-green-500',
      subtext: `of ${formatCurrency(summary.total_amount || 0)}`
    },
    { 
      title: 'Pending Payments', 
      value: (summary.unpaid_count || 0) + (summary.partial_count || 0), 
      icon: Clock, 
      color: 'bg-purple-500',
      subtext: summary.overdue_amount > 0 ? `${formatCurrency(summary.overdue_amount)} overdue` : 'No overdue'
    },
  ];

  const getPaymentStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="secondary" className="bg-orange-500 text-white">Partial</Badge>;
      default:
        return <Badge variant="destructive">Unpaid</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2 flex items-center gap-2">
            <AlertCircle size={20} />
            Error Loading Dashboard
          </h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome{customer?.name ? `, ${customer.name}` : ''}!
        </h1>
        <p className="text-gray-600">Here's your account overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {summary.overdue_count > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">You have {summary.overdue_count} overdue invoice(s)</p>
            <p className="text-sm text-red-600">Total overdue amount: {formatCurrency(summary.overdue_amount)}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {(!recent_invoices || recent_invoices.length === 0) ? (
            <p className="text-gray-500 text-center py-4">No invoices found.</p>
          ) : (
            <div className="space-y-3">
              {recent_invoices.map((invoice) => {
                const balance = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount || 0);
                const isOverdue = invoice.payment_status !== 'PAID' && new Date(invoice.due_date) < new Date();
                
                return (
                  <div 
                    key={invoice.invoice_number || invoice.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg ${isOverdue ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invoice.invoice_number}</p>
                        {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
                        {invoice.due_date && (
                          <span className="ml-2">• Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                      {balance > 0 && (
                        <p className="text-sm text-red-600">Balance: {formatCurrency(balance)}</p>
                      )}
                      {getPaymentStatusBadge(invoice.payment_status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
