import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FolderTree, 
  DollarSign, 
  Settings,
  ShoppingCart,
  FileText,
  CreditCard,
  BarChart3,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export function AdminSidebar({ currentPage, onNavigate }) {
  const [expandedSections, setExpandedSections] = useState({
    masterData: true,
    transactions: true,
    payments: true,
    reports: true,
  });

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const menuSections = [
    {
      title: 'Dashboard',
      id: 'dashboard',
      icon: LayoutDashboard,
      single: true,
    },
    {
      title: 'Master Data',
      id: 'masterData',
      icon: Package,
      items: [
        { id: 'contacts', label: 'Contacts', icon: Users },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'cost-centers', label: 'Analytics Master', icon: FolderTree },
        { id: 'budgets', label: 'Budgets', icon: DollarSign },
        { id: 'auto-rules', label: 'Auto Analytical Models', icon: Settings },
      ],
    },
    {
      title: 'Transactions',
      id: 'transactions',
      icon: ShoppingCart,
      items: [
        { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
        { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart },
        { id: 'customer-invoices', label: 'Customer Invoices', icon: FileText },
      ],
    },
    {
      title: 'Payments',
      id: 'payments',
      icon: CreditCard,
      items: [
        { id: 'invoice-payments', label: 'Invoice Payments', icon: CreditCard },
      ],
    },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full overflow-auto">
      <nav className="p-4">
        {menuSections.map((section) => {
          if (section.single) {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => onNavigate(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                  currentPage === section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{section.title}</span>
              </button>
            );
          }

          const Icon = section.icon;
          const isExpanded = expandedSections[section.id];

          return (
            <div key={section.id} className="mb-2">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span>{section.title}</span>
                </div>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          currentPage === item.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }`}
                      >
                        <ItemIcon size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
