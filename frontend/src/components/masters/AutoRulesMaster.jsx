import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { autoAnalyticalModelAPI, analyticalAccountAPI, contactAPI, productAPI } from '@/api';

export function AutoRulesMaster() {
  const [rules, setRules] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    partner_id: '',
    partner_tag: '',
    product_id: '',
    product_category_id: '',
    analytical_account_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, analyticsRes, vendorsRes, productsRes] = await Promise.all([
        autoAnalyticalModelAPI.getAll({ limit: 100 }),
        analyticalAccountAPI.getAll({ limit: 100 }),
        contactAPI.getVendors({ limit: 100 }),
        productAPI.getAll({ limit: 100 }),
      ]);
      
      setRules(rulesRes.data || []);
      setAnalytics(analyticsRes.data || []);
      setVendors(vendorsRes.data || []);
      setProducts(productsRes.data || []);
      
      // Extract unique categories from products
      const uniqueCategories = [];
      const categoryMap = new Map();
      (productsRes.data || []).forEach(p => {
        if (p.category_id && p.category_name && !categoryMap.has(p.category_id)) {
          categoryMap.set(p.category_id, true);
          uniqueCategories.push({ id: p.category_id, name: p.category_name });
        }
      });
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      partner_id: '',
      partner_tag: '',
      product_id: '',
      product_category_id: '',
      analytical_account_id: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = {
        name: formData.name,
        partner_id: formData.partner_id || null,
        partner_tag: formData.partner_tag || null,
        product_id: formData.product_id || null,
        product_category_id: formData.product_category_id || null,
        analytical_account_id: formData.analytical_account_id,
      };
      
      if (editingId) {
        await autoAnalyticalModelAPI.update(editingId, data);
      } else {
        await autoAnalyticalModelAPI.create(data);
      }
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Error saving rule:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rule) => {
    setFormData({
      name: rule.name || '',
      partner_id: rule.partner_id || '',
      partner_tag: rule.partner_tag || '',
      product_id: rule.product_id || '',
      product_category_id: rule.product_category_id || '',
      analytical_account_id: rule.analytical_account_id || '',
    });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await autoAnalyticalModelAPI.delete(deleteId);
      await loadData();
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  const getAnalyticName = (id) => analytics.find(a => a.id === id)?.name || '-';
  const getVendorName = (id) => vendors.find(v => v.id === id)?.name || '-';
  const getProductName = (id) => products.find(p => p.id === id)?.name || '-';
  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '-';

  const getConditionDisplay = (rule) => {
    const conditions = [];
    if (rule.partner_id) conditions.push(`Vendor: ${rule.partner_name || getVendorName(rule.partner_id)}`);
    if (rule.partner_tag) conditions.push(`Partner Tag: ${rule.partner_tag}`);
    if (rule.product_id) conditions.push(`Product: ${rule.product_name || getProductName(rule.product_id)}`);
    if (rule.product_category_id) conditions.push(`Category: ${rule.product_category_name || getCategoryName(rule.product_category_id)}`);
    return conditions.length > 0 ? conditions.join(', ') : 'No conditions';
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Auto Analytical Model (Rules)</h1>
          <p className="text-gray-600">Configure automatic cost center assignment based on vendors, products, or categories</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Add Rule
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
          <h2 className="text-lg font-medium mb-4">{editingId ? 'Edit Rule' : 'Add New Rule'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter rule name"
              />
            </div>
            <div>
              <Label htmlFor="partner_id">Vendor (Optional)</Label>
              <Select value={formData.partner_id || "__none__"} onValueChange={(value) => setFormData({ ...formData, partner_id: value === "__none__" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {vendors.filter(v => v.id).map(v => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="partner_tag">Partner Tag (Optional)</Label>
              <Input
                id="partner_tag"
                value={formData.partner_tag}
                onChange={(e) => setFormData({ ...formData, partner_tag: e.target.value })}
                placeholder="e.g., Premium, Local"
              />
            </div>
            <div>
              <Label htmlFor="product_id">Product (Optional)</Label>
              <Select value={formData.product_id || "__none__"} onValueChange={(value) => setFormData({ ...formData, product_id: value === "__none__" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {products.filter(p => p.id).map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="product_category_id">Product Category (Optional)</Label>
              <Select value={formData.product_category_id || "__none__"} onValueChange={(value) => setFormData({ ...formData, product_category_id: value === "__none__" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories.filter(c => c.id).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="analytical_account_id">Assign to Cost Center *</Label>
              <Select value={formData.analytical_account_id || ""} onValueChange={(value) => setFormData({ ...formData, analytical_account_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cost center" />
                </SelectTrigger>
                <SelectContent>
                  {analytics.filter(a => a.id).map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>How it works:</strong> When creating a Purchase Order, if a line item matches any of the conditions above, 
            the cost center will be automatically assigned. Rules with more matching conditions take priority.
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.analytical_account_id}>
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
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No rules found. Click "Add Rule" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Assigned Cost Center</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{getConditionDisplay(rule)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rule.analytical_account_name || getAnalyticName(rule.analytical_account_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rule.is_active !== false ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(rule.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Rule"
        message="Are you sure you want to delete this auto-analytical rule? This action cannot be undone."
      />
    </div>
  );
}
