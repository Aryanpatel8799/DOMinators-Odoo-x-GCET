import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { analyticalAccountAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function CostCenterReport() {
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
      const response = await analyticalAccountAPI.getReport();
      const reportData = (response.data || []).map(item => ({
        costCenter: item.name || 'Unknown',
        totalExpense: parseFloat(item.total_expense) || 0,
        totalIncome: parseFloat(item.total_income) || 0,
      }));
      setData(reportData);
    } catch (err) {
      console.error('Error loading report:', err);
      // If specific report endpoint doesn't exist, try getting all accounts
      try {
        const fallbackResponse = await analyticalAccountAPI.getAll({ limit: 100 });
        const fallbackData = (fallbackResponse.data || []).map(item => ({
          costCenter: item.name || 'Unknown',
          totalExpense: 0,
          totalIncome: 0,
        }));
        setData(fallbackData);
      } catch (fallbackErr) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const chartData = data.map(item => ({
    name: item.costCenter,
    value: item.totalExpense,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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
        <h1 className="text-2xl font-semibold text-gray-900">Cost Center Report</h1>
        <p className="text-gray-600">Expense and income breakdown by cost center</p>
      </div>

      {data.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No cost center data available. Create analytical accounts to see this report.
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Expense Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost Center</TableHead>
                  <TableHead>Total Expense</TableHead>
                  <TableHead>Total Income</TableHead>
                  <TableHead>Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => {
                  const net = item.totalIncome - item.totalExpense;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        {item.costCenter}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(item.totalExpense)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(item.totalIncome)}
                      </TableCell>
                      <TableCell className={`font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(net)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
