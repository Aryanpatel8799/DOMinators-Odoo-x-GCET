import { useState, useEffect } from 'react';
import { Users, Package, FolderTree, DollarSign, ShoppingCart, FileText, CreditCard, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { budgetAPI, contactAPI, productAPI, analyticalAccountAPI, salesOrderAPI, purchaseOrderAPI, customerInvoiceAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalProducts: 0,
    totalCostCenters: 0,
    activeBudgets: 0,
    purchaseOrders: 0,
    salesOrders: 0,
    pendingInvoices: 0,
    totalBudget: 0
  });
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [
        contactsRes,
        productsRes,
        costCentersRes,
        budgetsRes,
        purchaseOrdersRes,
        salesOrdersRes,
        invoicesRes,
        allBudgetsRes
      ] = await Promise.all([
        contactAPI.getAll({ limit: 1 }),
        productAPI.getAll({ limit: 1 }),
        analyticalAccountAPI.getAll({ limit: 1 }),
        budgetAPI.getAll({ status: 'ACTIVE', limit: 1 }),
        purchaseOrderAPI.getAll({ limit: 1 }),
        salesOrderAPI.getAll({ limit: 1 }),
        customerInvoiceAPI.getAll({ payment_status: 'NOT_PAID', limit: 1 }),
        budgetAPI.getAll({ limit: 100 }) 
      ]);

      const totalBudgetAmount = (allBudgetsRes.data || []).reduce(
        (sum, b) => sum + (parseFloat(b.budget_amount) || 0), 0
      );

      setStats({
        totalContacts: contactsRes.pagination?.total || 0,
        totalProducts: productsRes.pagination?.total || 0,
        totalCostCenters: costCentersRes.pagination?.total || 0,
        activeBudgets: budgetsRes.pagination?.total || 0,
        purchaseOrders: purchaseOrdersRes.pagination?.total || 0,
        salesOrders: salesOrdersRes.pagination?.total || 0,
        pendingInvoices: invoicesRes.pagination?.total || 0,
        totalBudget: totalBudgetAmount
      });

      if (allBudgetsRes.data?.length > 0) {
        const budgetData = allBudgetsRes.data
          .slice(0, 5)
          .map(budget => {
            const budgetAmount = parseFloat(budget.budget_amount) || 0;
            const usedAmount = parseFloat(budget.used_amount) || 0;
            const utilizationPercent = budgetAmount > 0 ? (usedAmount / budgetAmount) * 100 : 0;
            return {
              name: budget.analytical_account_name || budget.name || 'Unknown',
              budget_amount: budgetAmount,
              used_amount: usedAmount,
              utilization_percent: utilizationPercent
            };
          });
        setBudgetSummary(budgetData);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { title: 'Total Contacts', value: stats.totalContacts, icon: Users, color: 'bg-blue-500' },
    { title: 'Active Products', value: stats.totalProducts, icon: Package, color: 'bg-green-500' },
    { title: 'Cost Centers', value: stats.totalCostCenters, icon: FolderTree, color: 'bg-purple-500' },
    { title: 'Active Budgets', value: stats.activeBudgets, icon: DollarSign, color: 'bg-orange-500' },
    { title: 'Purchase Orders', value: stats.purchaseOrders, icon: ShoppingCart, color: 'bg-indigo-500' },
    { title: 'Sales Orders', value: stats.salesOrders, icon: ShoppingCart, color: 'bg-pink-500' },
    { title: 'Pending Invoices', value: stats.pendingInvoices, icon: FileText, color: 'bg-red-500' },
    { title: 'Total Budget', value: formatCurrency(stats.totalBudget), icon: TrendingUp, color: 'bg-cyan-500' },
  ];

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
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Shiv Furniture - Budget Accounting System Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetSummary.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No budget data available</p>
            ) : (
              <div className="space-y-4">
                {budgetSummary.map((budget, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{budget.name}</span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(budget.used_amount || 0)} / {formatCurrency(budget.budget_amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          budget.utilization_percent > 100 ? 'bg-red-600' : 
                          budget.utilization_percent > 80 ? 'bg-yellow-600' : 'bg-green-600'
                        }`} 
                        style={{ width: `${Math.min(budget.utilization_percent || 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(budget.utilization_percent || 0).toFixed(1)}% utilized
                      {budget.utilization_percent > 100 && <span className="text-red-600 ml-1">(Over Budget!)</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Total Contacts</span>
                <span className="font-semibold">{stats.totalContacts}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Products in Catalog</span>
                <span className="font-semibold">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium">Active Cost Centers</span>
                <span className="font-semibold">{stats.totalCostCenters}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium">Pending Payments</span>
                <span className="font-semibold">{stats.pendingInvoices}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
