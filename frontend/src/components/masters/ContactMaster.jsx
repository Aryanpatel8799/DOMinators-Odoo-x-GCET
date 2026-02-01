import { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { contactAPI } from '@/api';

export function ContactMaster() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    contact_type: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    image: '',
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    setLoading(true);
    setError(null);
    try {
      const response = await contactAPI.getAll({ limit: 100 });
      setContacts(response.data || []);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      contact_type: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      image: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const contactData = {
        contact_type: formData.contact_type.toUpperCase(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      };

      if (editingId) {
        await contactAPI.update(editingId, contactData);
      } else {
        await contactAPI.create(contactData);
      }
      resetForm();
      await loadContacts();
    } catch (err) {
      console.error('Error saving contact:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (contact) => {
    setFormData({
      contact_type: contact.contact_type,
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      image: '',
    });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await contactAPI.delete(deleteId);
      await loadContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Contact Master</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Add Contact
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
          <h2 className="text-lg font-medium mb-4">{editingId ? 'Edit Contact' : 'Add New Contact'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center gap-4">
              <div className="flex flex-col items-center">
                <Label className="mb-2">Profile Image</Label>
                {formData.image ? (
                  <img src={formData.image} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold border-2 border-gray-200">
                    {getInitials(formData.name)}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 flex items-center gap-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  Upload
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="contact_type">Type</Label>
              <Select value={formData.contact_type} onValueChange={(value) => setFormData({ ...formData, contact_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="VENDOR">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
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
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No contacts found. Click "Add Contact" to create one.
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(contact.name)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    contact.contact_type === 'CUSTOMER' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {contact.contact_type}
                  </span>
                </TableCell>
                <TableCell>{contact.email || '-'}</TableCell>
                <TableCell>{contact.phone || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(contact.id)}>
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
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
      />
    </div>
  );
}
