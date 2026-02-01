import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header({ user, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Shiv Furniture – Budget Accounting</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User size={20} className="text-gray-600" />
          <span className="text-sm text-gray-700">{user.name} ({user.role})</span>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout} className="flex items-center gap-2">
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </header>
  );
}
