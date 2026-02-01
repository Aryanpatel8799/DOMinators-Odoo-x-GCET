import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, ChevronDown, ChevronUp, X, PieChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { budgetAPI, analyticalAccountAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

// Mini Pie Chart component for budget utilization
const BudgetPieChart = ({ budgetAmount, usedAmount }) => {
  const remaining = Math.max(0, budgetAmount - usedAmount);
  const overBudget = usedAmount > budgetAmount ? usedAmount - budgetAmount : 0;
  
  const data = overBudget > 0 
    ? [
        { name: 'Used', value: budgetAmount, color: '#f97316' },
        { name: 'Over', value: overBudget, color: '#ef4444' },
      ]
    : [
        { name: 'Used', value: usedAmount, color: '#f97316' },
        { name: 'Remaining', value: remaining, color: '#22c55e' },
      ];
  
  // Don't render if no budget
  if (budgetAmount <= 0) return <div className="w-10 h-10 bg-gray-100 rounded-full" />;
  
  return (
    <div className="w-10 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={8}
            outerRadius={18}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export function BudgetMaster() {
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    analytical_account_id: '',
    period_start: '',
    period_end: '',
    budget_amount: '',
    description: '',
  });
  
  // State for showing purchase order entries
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // State for pie chart modal
  const [pieChartModal, setPieChartModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [budgetsRes, analyticsRes] = await Promise.all([
        budgetAPI.getAll({ limit: 100 }),
        analyticalAccountAPI.getAll({ limit: 100 })
      ]);
      setBudgets(budgetsRes.data || []);
      setAnalytics(analyticsRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      analytical_account_id: '',
      period_start: '',
      period_end: '',
      budget_amount: '',
      description: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const budgetData = {
        analytical_account_id: formData.analytical_account_id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        budget_amount: parseFloat(formData.budget_amount) || 0,
        description: formData.description || undefined,
      };

      if (editingId) {
        await budgetAPI.update(editingId, budgetData);
      } else {
        await budgetAPI.create(budgetData);
      }
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Error saving budget:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (budget) => {
    setFormData({
      analytical_account_id: budget.analytical_account_id || '',
      period_start: budget.period_start?.split('T')[0] || '',
      period_end: budget.period_end?.split('T')[0] || '',
      budget_amount: budget.budget_amount?.toString() || '',
      description: budget.description || '',
    });
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await budgetAPI.delete(deleteId);
      await loadData();
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  const getAnalyticName = (id) => {
    const account = analytics.find(a => a.id === id);
    return account ? account.name : '-';
  };

  const getStatusBadge = (budget) => {
    // Used amount from PO line subtotals
    const used = parseFloat(budget.used_amount) || parseFloat(budget.actual_amount) || 0;
    const budgeted = parseFloat(budget.budget_amount) || 0;
    const utilization = budgeted > 0 ? (used / budgeted) * 100 : 0;
    
    if (utilization >= 100) {
      return <Badge variant="destructive">Over Budget</Badge>;
    } else if (utilization >= 80) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On Track</Badge>;
    }
  };

  // Load purchase order entries for a budget
  const handleBudgetClick = async (budget) => {
    console.log('Budget clicked:', budget);
    
    if (selectedBudget?.id === budget.id) {
      // Toggle off if already selected
      setSelectedBudget(null);
      setEntries([]);
      return;
    }
    
    setSelectedBudget(budget);
    setLoadingEntries(true);
    setEntries([]); // Clear previous entries
    
    try {
      console.log('Fetching entries for analytical_account_id:', budget.analytical_account_id);
      const response = await budgetAPI.getPurchaseOrderEntries(budget.analytical_account_id);
      console.log('Entries response:', response);
      setEntries(response.data || []);
    } catch (err) {
      console.error('Error loading entries:', err);
      setError('Failed to load purchase order entries');
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Budget Master</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Add Budget
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? 'Edit Budget' : 'Add New Budget'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="analytical_account_id">Analytical Account</Label>
              <Select 
                value={formData.analytical_account_id} 
                onValueChange={(value) => setFormData({ ...formData, analytical_account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select analytical account" />
                </SelectTrigger>
                <SelectContent>
                  {analytics.map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget_amount">Budget Amount</Label>
              <Input
                id="budget_amount"
                type="number"
                value={formData.budget_amount}
                onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                placeholder="Enter budget amount"
              />
            </div>
            <div>
              <Label htmlFor="period_start">Period Start</Label>
              <Input
                id="period_start"
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="period_end">Period End</Label>
              <Input
                id="period_end"
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No budgets found. Click "Add Budget" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Analytical Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Budget Amount</TableHead>
                <TableHead className="text-right">Used Amount</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Pie Chart</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const budgetAmount = parseFloat(budget.budget_amount) || 0;
                // Use used_amount from backend (sum of PO line subtotals)
                const usedAmount = parseFloat(budget.used_amount) || parseFloat(budget.actual_amount) || 0;
                // Use remaining_amount from backend or calculate
                const remaining = parseFloat(budget.remaining_amount) || (budgetAmount - usedAmount);
                const isSelected = selectedBudget?.id === budget.id;
                
                return (
                  <React.Fragment key={budget.id}>
                    <TableRow 
                      className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                      onClick={() => handleBudgetClick(budget)}
                    >
                      <TableCell>
                        {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </TableCell>
                      <TableCell className="font-medium">{getAnalyticName(budget.analytical_account_id)}</TableCell>
                      <TableCell>
                        {budget.period_start?.split('T')[0]} to {budget.period_end?.split('T')[0]}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(budgetAmount)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(usedAmount)}</TableCell>
                      <TableCell className={`text-right ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(remaining)}
                      </TableCell>
                      <TableCell>{getStatusBadge(budget)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPieChartModal({
                              name: getAnalyticName(budget.analytical_account_id),
                              budgetAmount,
                              usedAmount,
                              remaining,
                              period: `${budget.period_start?.split('T')[0]} to ${budget.period_end?.split('T')[0]}`
                            });
                          }}
                          className="p-1"
                        >
                          <PieChartIcon size={20} className="text-blue-600" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(budget.id)}>
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isSelected && (
                      <TableRow key={`${budget.id}-entries`}>
                        <TableCell colSpan={9} className="bg-gray-50 p-0">
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-medium text-gray-700">Purchase Order Entries for {getAnalyticName(budget.analytical_account_id)}</h3>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedBudget(null); setEntries([]); }}>
                                <X size={16} />
                              </Button>
                            </div>
                            {loadingEntries ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                              </div>
                            ) : entries.length === 0 ? (
                              <div className="text-center text-gray-500 py-4">
                                No purchase order entries found for this budget.
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-100">
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {entries.map((entry) => (
                                    <TableRow key={entry.id}>
                                      <TableCell className="font-medium">{entry.order_number}</TableCell>
                                      <TableCell>{entry.order_date?.split('T')[0]}</TableCell>
                                      <TableCell>{entry.vendor_name}</TableCell>
                                      <TableCell>{entry.product_name}</TableCell>
                                      <TableCell className="text-right">{entry.quantity}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(entry.unit_price)}</TableCell>
                                      <TableCell className="text-right font-medium">{formatCurrency(entry.subtotal)}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow className="bg-gray-100 font-medium">
                                    <TableCell colSpan={6} className="text-right">Total Used:</TableCell>
                                    <TableCell className="text-right text-orange-600">
                                      {formatCurrency(entries.reduce((sum, e) => sum + parseFloat(e.subtotal || 0), 0))}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pie Chart Modal */}
      {pieChartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPieChartModal(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Budget Utilization</h2>
              <Button variant="ghost" size="sm" onClick={() => setPieChartModal(null)}>
                <X size={20} />
              </Button>
            </div>
            <div className="text-center mb-4">
              <h3 className="font-medium text-gray-800">{pieChartModal.name}</h3>
              <p className="text-sm text-gray-500">{pieChartModal.period}</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      pieChartModal.usedAmount > pieChartModal.budgetAmount
                        ? [
                            { name: 'Budget Used', value: pieChartModal.budgetAmount, fill: '#f97316' },
                            { name: 'Over Budget', value: pieChartModal.usedAmount - pieChartModal.budgetAmount, fill: '#ef4444' },
                          ]
                        : [
                            { name: 'Used', value: pieChartModal.usedAmount, fill: '#f97316' },
                            { name: 'Remaining', value: Math.max(0, pieChartModal.remaining), fill: '#22c55e' },
                          ]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Budget Amount</span>
                <span className="font-medium">{formatCurrency(pieChartModal.budgetAmount)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-orange-700 flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  Used Amount
                </span>
                <span className="font-medium text-orange-700">{formatCurrency(pieChartModal.usedAmount)}</span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded ${pieChartModal.remaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={`flex items-center gap-2 ${pieChartModal.remaining >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  <div className={`w-3 h-3 rounded-full ${pieChartModal.remaining >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {pieChartModal.remaining >= 0 ? 'Remaining' : 'Over Budget'}
                </span>
                <span className={`font-medium ${pieChartModal.remaining >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(Math.abs(pieChartModal.remaining))}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-blue-700">Utilization</span>
                <span className="font-medium text-blue-700">
                  {pieChartModal.budgetAmount > 0 
                    ? ((pieChartModal.usedAmount / pieChartModal.budgetAmount) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
      />
    </div>
  );
}
