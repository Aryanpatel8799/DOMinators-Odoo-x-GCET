import { useState, useEffect } from 'react';
import { authAPI } from '@/api';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';

// Auth Components
import { Login } from '@/components/auth/Login.jsx';
import { Signup } from '@/components/auth/Signup.jsx';
import { SetPassword } from '@/components/auth/SetPassword.jsx';

// Layout Components
import { Header } from '@/components/layout/Header.jsx';
import { AdminSidebar } from '@/components/layout/AdminSidebar.jsx';
import { CustomerSidebar } from '@/components/layout/CustomerSidebar.jsx';

// Master Data Components
import { AdminDashboard } from '@/components/admin/AdminDashboard.jsx';
import { ContactMaster } from '@/components/masters/ContactMaster.jsx';
import { ProductMaster } from '@/components/masters/ProductMaster.jsx';
import { CostCenterMaster } from '@/components/masters/CostCenterMaster.jsx';
import { BudgetMaster } from '@/components/masters/BudgetMaster.jsx';
import { AutoRulesMaster } from '@/components/masters/AutoRulesMaster.jsx';

// Transaction Components
import { PurchaseOrders } from '@/components/transactions/PurchaseOrders.jsx';
import { SalesOrders } from '@/components/transactions/SalesOrders.jsx';
import { CustomerInvoices } from '@/components/transactions/CustomerInvoices.jsx';

// Payment Components
import { InvoicePayments } from '@/components/payments/InvoicePayments.jsx';

// Customer Portal Components
import { CustomerDashboard } from '@/components/customer/CustomerDashboard.jsx';
import { MyInvoices } from '@/components/customer/MyInvoices.jsx';
import { MyOrders } from '@/components/customer/MyOrders.jsx';
import { InvoiceDetail } from '@/components/customer/InvoiceDetail.jsx';

export default function App() {
  const [authView, setAuthView] = useState('login'); // 'login', 'signup', or 'set-password'
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordToken, setPasswordToken] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check authentication on mount and handle URL parameters
  useEffect(() => {
    checkUrlParams();
    checkAuth();
  }, []);

  // Check URL for set-password or reset-password token, and payment redirects
  function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const sessionId = urlParams.get('session_id');
    const invoiceId = urlParams.get('invoice_id');
    const path = window.location.pathname;
    
    if ((path === '/set-password' || path === '/reset-password') && token) {
      setPasswordToken(token);
      setAuthView('set-password');
      setLoading(false);
    }
    
    // Handle Stripe payment success redirect
    if (path === '/payment-success' && sessionId && invoiceId) {
      // Store the invoice to view after auth check
      setSelectedInvoice({ id: invoiceId });
      setCurrentPage('invoice-detail');
    }
    
    // Handle Stripe payment cancelled redirect
    if (path === '/payment-cancelled') {
      setCurrentPage('my-invoices');
    }
  }

  async function checkAuth() {
    // Skip if handling password setup
    if (passwordToken) {
      return;
    }
    
    try {
      // Check if there's a stored token
      if (authAPI.isAuthenticated()) {
        const response = await authAPI.getCurrentUser();
        if (response.success && response.data) {
          const userData = {
            ...response.data,
            role: response.data.role === 'ADMIN' ? 'Admin' : 'Customer'
          };
          setUser(userData);
          
          // Don't override page if already set (e.g., from payment redirect)
          if (currentPage === 'dashboard' && userData.role !== 'Admin') {
            setCurrentPage('customer-dashboard');
          } else if (currentPage === 'customer-dashboard' && userData.role === 'Admin') {
            setCurrentPage('dashboard');
          }
        }
      }
    } catch (error) {
      // Token invalid or expired - logout
      authAPI.logout();
      console.log('Authentication check failed');
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = (userData) => {
    setUser(userData);
    // Clear URL params
    window.history.replaceState({}, document.title, '/');
    if (userData.role === 'Admin') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('customer-dashboard');
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    setAuthView('login');
    setCurrentPage('dashboard');
  };

  const handlePasswordSetSuccess = () => {
    // Clear URL params and redirect to login
    window.history.replaceState({}, document.title, '/');
    setPasswordToken(null);
    setAuthView('login');
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setCurrentPage('invoice-detail');
  };

  const handleBackFromInvoice = () => {
    setRefreshKey(prev => prev + 1); // Force refresh of components
    setCurrentPage('my-invoices');
    setSelectedInvoice(null);
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return <FullPageSpinner />;
  }

  // Password setup/reset screen (before auth check)
  if (authView === 'set-password' && passwordToken) {
    return (
      <SetPassword 
        token={passwordToken} 
        onSuccess={handlePasswordSetSuccess}
        onNavigateToLogin={handlePasswordSetSuccess}
      />
    );
  }

  // Auth screens
  if (!user) {
    if (authView === 'login') {
      return <Login onLogin={handleLogin} onNavigateToSignup={() => setAuthView('signup')} />;
    } else if (authView === 'signup') {
      return <Signup onNavigateToLogin={() => setAuthView('login')} />;
    }
  }

  // Render admin pages
  const renderAdminPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'contacts':
        return <ContactMaster />;
      case 'products':
        return <ProductMaster />;
      case 'cost-centers':
        return <CostCenterMaster />;
      case 'budgets':
        return <BudgetMaster />;
      case 'auto-rules':
        return <AutoRulesMaster />;
      case 'purchase-orders':
        return <PurchaseOrders />;
      case 'sales-orders':
        return <SalesOrders />;
      case 'customer-invoices':
        return <CustomerInvoices />;
      case 'invoice-payments':
        return <InvoicePayments />;
      default:
        return <AdminDashboard />;
    }
  };

  // Render customer pages
  const renderCustomerPage = () => {
    switch (currentPage) {
      case 'customer-dashboard':
        return <CustomerDashboard key={refreshKey} />;
      case 'my-invoices':
        return <MyInvoices key={refreshKey} onViewInvoice={handleViewInvoice} />;
      case 'my-orders':
        return <MyOrders key={refreshKey} />;
      case 'invoice-detail':
        return <InvoiceDetail invoice={selectedInvoice} onBack={handleBackFromInvoice} />;
      default:
        return <CustomerDashboard key={refreshKey} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        {user.role === 'Admin' ? (
          <AdminSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        ) : (
          <CustomerSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        )}
        <main className="flex-1 overflow-auto">
          {user.role === 'Admin' ? renderAdminPage() : renderCustomerPage()}
        </main>
      </div>
    </div>
  );
}
