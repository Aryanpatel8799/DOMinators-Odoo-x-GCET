import { LayoutDashboard, FileText, ShoppingCart, CreditCard } from 'lucide-react';

export function CustomerSidebar({ currentPage, onNavigate }) {
  const menuItems = [
    { id: 'customer-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-invoices', label: 'My Invoices', icon: FileText },
    { id: 'my-orders', label: 'My Orders', icon: ShoppingCart },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
