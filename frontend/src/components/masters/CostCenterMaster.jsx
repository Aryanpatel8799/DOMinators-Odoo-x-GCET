import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { analyticalAccountAPI } from '@/api';

export function CostCenterMaster() {
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  useEffect(() => {
    loadCostCenters();
  }, []);

  async function loadCostCenters() {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticalAccountAPI.getAll({ limit: 100 });
      setCostCenters(response.data || []);
    } catch (err) {
      console.error('Error loading cost centers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
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
        code: formData.code,
        description: formData.description,
      };

      if (editingId) {
        await analyticalAccountAPI.update(editingId, data);
      } else {
        await analyticalAccountAPI.create(data);
      }
      resetForm();
      await loadCostCenters();
    } catch (err) {
      console.error('Error saving cost center:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (costCenter) => {
    setFormData({
      name: costCenter.name,
      code: costCenter.code || '',
      description: costCenter.description || '',
    });
    setEditingId(costCenter.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await analyticalAccountAPI.delete(deleteId);
      await loadCostCenters();
    } catch (err) {
      console.error('Error deleting cost center:', err);
      setError(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Master (Cost Centers)</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Add Cost Center
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
          <h2 className="text-lg font-medium mb-4">{editingId ? 'Edit Cost Center' : 'Add New Cost Center'}</h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter cost center name"
                />
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Enter code (e.g., CC-001)"
                />
              </div>
            </div>
            <div>
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
        ) : costCenters.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No cost centers found. Click "Add Cost Center" to create one.
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costCenters.map((costCenter) => (
              <TableRow key={costCenter.id}>
                <TableCell className="font-mono text-sm">{costCenter.code || '-'}</TableCell>
                <TableCell className="font-medium">{costCenter.name}</TableCell>
                <TableCell>{costCenter.description || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(costCenter)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(costCenter.id)}>
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
        title="Delete Cost Center"
        message="Are you sure you want to delete this cost center? This action cannot be undone."
      />
    </div>
  );
}
