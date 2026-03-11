import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Plus, Pencil, X, Check, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  gramaj: string;
  price: number;
  image_url: string | null;
  alergeni: string | null;
  obs: string | null;
  is_available: boolean;
  created_at: string;
}

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [editData, setEditData] = useState({
    name: '',
    category: '',
    gramaj: '',
    price: '',
    alergeni: '',
    obs: '',
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Main Courses',
    gramaj: '',
    price: '',
    alergeni: '',
    obs: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch menu items
  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  // Handle add item
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    // Inline validation
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Item name is required';
    if (!formData.gramaj.trim()) errors.gramaj = 'Portion size is required';
    if (!formData.price) errors.price = 'Price is required';
    else if (parseFloat(formData.price) <= 0) errors.price = 'Price must be greater than 0';
    else if (parseFloat(formData.price) > 500) errors.price = 'Price seems too high';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the highlighted fields');
      return;
    }
    setFormErrors({});

    try {
      setUploading(true);
      let imageUrl: string | null = null;
      let imageWarning = false;

      // Upload image if selected (non-blocking — item will still be added without image)
      if (imageFile) {
        try {
          const fileName = `${Date.now()}-${imageFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from('menu-images')
            .upload(fileName, imageFile);

          if (uploadError) {
            console.warn('Image upload failed (RLS policy or bucket issue):', uploadError.message);
            imageWarning = true;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('menu-images')
              .getPublicUrl(fileName);
            imageUrl = publicUrl;
          }
        } catch (imgErr) {
          console.warn('Image upload error:', imgErr);
          imageWarning = true;
        }
      }

      const { error } = await supabase.from('menu').insert([
        {
          name: formData.name,
          category: formData.category,
          gramaj: formData.gramaj,
          price: parseFloat(formData.price),
          is_available: true,
          ...(formData.alergeni && { alergeni: formData.alergeni }),
          ...(formData.obs && { obs: formData.obs }),
          ...(imageUrl && { image_url: imageUrl }),
        },
      ]);

      if (error) throw error;

      // Clear form
      setFormData({
        name: '',
        category: 'Main Courses',
        gramaj: '',
        price: '',
        alergeni: '',
        obs: '',
      });
      setImageFile(null);
      // Reset file input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Re-fetch menu items
      await fetchMenuItems();

      if (imageWarning) {
        toast.success('Item added! (image upload failed — added without image)');
      } else {
        toast.success('Item added successfully! ✨');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  // Handle delete item
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const { error } = await supabase.from('menu').delete().eq('id', id);

      if (error) throw error;

      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Item deleted');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  // Handle toggle availability
  const handleToggleAvailability = async (
    id: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('menu')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_available: !currentStatus } : item
        )
      );
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  // Start editing an item
  const handleStartEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditData({
      name: item.name,
      category: item.category,
      gramaj: item.gramaj,
      price: item.price.toString(),
      alergeni: item.alergeni || '',
      obs: item.obs || '',
    });
    setEditImageFile(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ name: '', category: '', gramaj: '', price: '', alergeni: '', obs: '' });
    setEditImageFile(null);
  };

  // Save edited item
  const handleSaveEdit = async (id: string) => {
    if (!editData.name || !editData.gramaj || !editData.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (parseFloat(editData.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    try {
      setUploading(true);
      let imageUrl: string | undefined;

      let imageWarning = false;

      // Upload new image if selected (non-blocking)
      if (editImageFile) {
        try {
          const fileName = `${Date.now()}-${editImageFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from('menu-images')
            .upload(fileName, editImageFile);

          if (uploadError) {
            console.warn('Image upload failed (RLS policy or bucket issue):', uploadError.message);
            imageWarning = true;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('menu-images')
              .getPublicUrl(fileName);
            imageUrl = publicUrl;
          }
        } catch (imgErr) {
          console.warn('Image upload error:', imgErr);
          imageWarning = true;
        }
      }

      const updatePayload: Record<string, unknown> = {
        name: editData.name,
        category: editData.category,
        gramaj: editData.gramaj,
        price: parseFloat(editData.price),
        ...(editData.alergeni && { alergeni: editData.alergeni }),
        ...(editData.obs && { obs: editData.obs }),
      };

      if (imageUrl) {
        updatePayload.image_url = imageUrl;
      }

      const { error } = await supabase
        .from('menu')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      handleCancelEdit();
      await fetchMenuItems();

      if (imageWarning) {
        toast.success('Item updated! (image upload failed)');
      } else {
        toast.success('Item updated successfully! ✨');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  // Handle edit form input changes
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
        <p className="mt-2 text-gray-600">Add, edit, and manage your canteen menu items</p>
      </div>

      {/* Add Item Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Plus size={20} className="text-green-500" />
          Add New Item
        </h2>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Chicken Soup"
                className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 ${formErrors.name ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'}`}
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Soups">Soups</option>
                <option value="Main Courses">Main Courses</option>
                <option value="Side Dishes">Side Dishes</option>
                <option value="Salads/Bread/Extras">Salads/Bread/Extras</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
              </select>
            </div>

            {/* Gramaj */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portion Size (grams)
              </label>
              <input
                type="text"
                name="gramaj"
                value={formData.gramaj}
                onChange={handleInputChange}
                placeholder="e.g., 250g"
                className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 ${formErrors.gramaj ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'}`}
              />
              {formErrors.gramaj && <p className="text-red-500 text-xs mt-1">{formErrors.gramaj}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (RON)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., 15.50"
                step="0.01"
                min="0"
                className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 ${formErrors.price ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'}`}
              />
              {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
            </div>

            {/* Alergeni */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergens (optional)
              </label>
              <input
                type="text"
                name="alergeni"
                value={formData.alergeni}
                onChange={handleInputChange}
                placeholder="e.g., Gluten, Lactate, Ouă"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Obs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <input
                type="text"
                name="obs"
                value={formData.obs}
                onChange={handleInputChange}
                placeholder="e.g., Spicy, Contains nuts"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Image (optional)
            </label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="image-upload"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <span className="text-gray-500 text-sm">
                  {imageFile ? imageFile.name : 'Click to select an image...'}
                </span>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              {imageFile && (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {uploading ? 'Uploading & Adding...' : 'Add Item'}
          </button>
        </form>
      </div>

      {/* Current Menu Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Menu</h2>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="All">All Categories</option>
            <option value="Soups">Soups</option>
            <option value="Main Courses">Main Courses</option>
            <option value="Side Dishes">Side Dishes</option>
            <option value="Salads/Bread/Extras">Salads/Bread/Extras</option>
            <option value="Desserts">Desserts</option>
            <option value="Beverages">Beverages</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading menu items...</p>
        ) : menuItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No menu items yet. Add your first item!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Image</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Portion</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems
                  .filter((item) => {
                    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
                    return matchesSearch && matchesCategory;
                  })
                  .map((item) => (
                  editingId === item.id ? (
                    // ---- EDITING ROW ----
                    <tr key={item.id} className="border-b border-blue-100 bg-blue-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {editImageFile ? (
                            <img
                              src={URL.createObjectURL(editImageFile)}
                              alt="Preview"
                              className="w-12 h-12 rounded-lg object-cover border border-blue-300"
                            />
                          ) : item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No img</span>
                            </div>
                          )}
                          <label className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs font-medium underline">
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          name="name"
                          value={editData.name}
                          onChange={handleEditInputChange}
                          placeholder="Name"
                          className="w-full px-2 py-1.5 border border-blue-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 mb-1"
                        />
                        <input
                          type="text"
                          name="alergeni"
                          value={editData.alergeni}
                          onChange={handleEditInputChange}
                          placeholder="Allergens"
                          className="w-full px-2 py-1 border border-blue-200 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 mb-1"
                        />
                        <input
                          type="text"
                          name="obs"
                          value={editData.obs}
                          onChange={handleEditInputChange}
                          placeholder="Notes"
                          className="w-full px-2 py-1 border border-blue-200 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          name="category"
                          value={editData.category}
                          onChange={handleEditInputChange}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="Soups">Soups</option>
                          <option value="Main Courses">Main Courses</option>
                          <option value="Side Dishes">Side Dishes</option>
                          <option value="Salads/Bread/Extras">Salads/Bread/Extras</option>
                          <option value="Desserts">Desserts</option>
                          <option value="Beverages">Beverages</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          name="gramaj"
                          value={editData.gramaj}
                          onChange={handleEditInputChange}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          name="price"
                          value={editData.price}
                          onChange={handleEditInputChange}
                          step="0.01"
                          min="0"
                          className="w-full px-2 py-1.5 border border-blue-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                          item.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_available ? 'Available' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            disabled={uploading}
                            className="text-green-600 hover:text-green-800 transition-colors p-1.5 rounded-lg hover:bg-green-100 disabled:opacity-50"
                            title="Save changes"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                            title="Cancel editing"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // ---- NORMAL ROW ----
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No img</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-900 font-medium">{item.name}</td>
                    <td className="py-4 px-4 text-gray-600">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{item.gramaj}</td>
                    <td className="py-4 px-4 text-gray-900 font-medium">{item.price} RON</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() =>
                          handleToggleAvailability(item.id, item.is_available)
                        }
                        className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                          item.is_available
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="text-blue-500 hover:text-blue-700 transition-colors p-2"
                          title="Edit item"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2"
                          title="Delete item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}