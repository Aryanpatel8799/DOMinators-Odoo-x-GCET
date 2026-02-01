import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { budgetAPI } from '@/api';
import { formatCurrency } from '@/utils/formatters';

export function BudgetVsActual() {
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
      const response = await budgetAPI.getVsActualReport();
      // API returns { report: [...], summary: {...} }
      const reportArray = response.data?.report || response.report || [];
      const reportData = reportArray.map(item => {
        const budgetAmount = parseFloat(item.budget_amount) || 0;
        const actualAmount = parseFloat(item.actual_amount) || parseFloat(item.net_actual) || 0;
        const remaining = budgetAmount - actualAmount;
        let achievement = 0;
        if (item.utilization_percent !== undefined && item.utilization_percent !== null) {
          achievement = parseFloat(item.utilization_percent) || 0;
        } else if (budgetAmount > 0) {
          achievement = parseFloat(((actualAmount / budgetAmount) * 100).toFixed(1)) || 0;
        }
        return {
          costCenter: item.analytical_account_name || item.name || 'Unknown',
          budgetAmount,
          actualAmount,
          remaining,
          achievement,
        };
      });
      setData(reportData);
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const chartData = data.map(item => ({
    name: item.costCenter,
    Budget: item.budgetAmount,
    Actual: item.actualAmount,
  }));

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
        <h1 className="text-2xl font-semibold text-gray-900">Budget vs Actual Report</h1>
        <p className="text-gray-600">Compare budget allocation with actual spending</p>
      </div>

      {data.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No budget data available. Create budgets with analytical accounts to see this report.
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Budget Performance Chart</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Budget" fill="#3b82f6" />
                <Bar dataKey="Actual" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost Center</TableHead>
                  <TableHead>Budget Amount</TableHead>
                  <TableHead>Actual Amount</TableHead>
                  <TableHead>Remaining Amount</TableHead>
                  <TableHead>Achievement %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.costCenter}</TableCell>
                    <TableCell>{formatCurrency(item.budgetAmount)}</TableCell>
                    <TableCell>{formatCurrency(item.actualAmount)}</TableCell>
                    <TableCell>{formatCurrency(item.remaining)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(item.achievement) >= 80 ? 'bg-red-600' :
                              parseFloat(item.achievement) >= 60 ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(item.achievement, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{item.achievement}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
