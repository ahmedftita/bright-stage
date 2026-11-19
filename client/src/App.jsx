import React, { useState, useMemo, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { 
  ChevronLeft,
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Users2,
  Package,
  Users,
  HardHat,
  Briefcase,
  UserCheck,
  Truck,
  Car,
  ClipboardList,
  Wrench,
  Handshake,
  Calculator,
  Monitor,
  Layers,
  QrCode,
  FileSpreadsheet,
  Sparkles,
  Receipt,
  AlarmClock,
  TrendingUp,
  Scale,
  ClipboardCheck,
  Settings,
  Zap,
  Coins,
  LogOut,
  Menu,
  X
} from 'lucide-react';

// View Components
import SplashScreen from './components/SplashScreen';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ComingSoon from './components/ComingSoon';
import ChatWidget from './components/ChatWidget';

// ✅ Operations & Planning
import ProjectList from './components/ProjectList';
import ProjectEditor from './components/ProjectEditor';
import CalendarView from './components/CalendarView';
import HRView from './components/HRView';

// ✅ Magasin (Inventory / Store)
import InventoryList from './components/InventoryList';
import InventoryForm from './components/InventoryForm';
import QRCodeScreen from './components/QRCodeScreen';

// ✅ Contacts & Staff
import ClientView from './components/ClientView';
import WorkersView from './components/WorkersView';
import FreelancerView from './components/FreelancerView';

// ✅ Logistique
import DriverView from './components/DriverView';
import CarrierView from './components/CarrierView';
import VehicleView from './components/VehicleView';
import DeliveryNoteList from './components/DeliveryNoteList';
import DeliveryNoteForm from './components/DeliveryNoteForm';

// ✅ Equipment Operations & System Tools
import MaintenanceView from './components/MaintenanceView';
import SubcontractedManagement from './components/SubcontractedManagement';
import StructureCalcView from './components/StructureCalcView';
import LedConfigurator from './components/LedConfigurator';
import StageConfigurator from './components/StageConfigurator';
import FullStageStudio from './components/FullStageStudio';

// ✅ Finance Module & Administration
import QuotesList from './components/QuotesList';
import QuoteBuilder from './components/QuoteBuilder';
import InvoiceList from './components/InvoiceList';
import InvoiceBuilder from './components/InvoiceBuilder';
import OverdueInvoices from './components/OverdueInvoices';
import FinancialReportsView from './components/FinancialReportsView';
import FiscalDashboard from './components/FiscalDashboard';
import AuditListView from './components/AuditListView';
import AuditDetailView from './components/AuditDetailView';
import SettingsView from './components/SettingsView';

import './index.css';

// --- Shared Components & Contexts ---

const SidebarContext = createContext({
  collapsed: false,
  onHoverTooltip: () => {},
  onLeaveTooltip: () => {}
});

const ProjectEditorWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <ProjectEditor
      project={{ _id: id }}
      onClose={() => navigate('/projects')}
      onSave={() => navigate('/projects')}
    />
  );
};

const SidebarItem = ({ icon: Icon, label, path, active, onClick, iconColor }) => {
  const navigate = useNavigate();
  const { collapsed, onHoverTooltip, onLeaveTooltip } = useContext(SidebarContext);

  const handleMouseEnter = (e) => {
    if (collapsed && onHoverTooltip) {
      const rect = e.currentTarget.getBoundingClientRect();
      onHoverTooltip(label, active, rect.top + rect.height / 2);
    }
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === 'string') return <span style={{ fontSize: '1.2rem' }}>{Icon}</span>;
    const IconComponent = Icon;
    return <IconComponent size={19} color={active ? '#ffffff' : (iconColor || '#94a3b8')} strokeWidth={active ? 2.2 : 1.9} />;
  };

  return (
    <div
      onClick={() => {
        navigate(path);
        if (onClick) onClick();
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeaveTooltip}
      className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
      style={{ cursor: 'pointer' }}
    >
      <span className="nav-item-icon" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '8px',
        background: active ? (iconColor || '#6366f1') : (iconColor ? `${iconColor}15` : 'transparent'),
        transition: 'all 0.2s ease',
        flexShrink: 0
      }}>
        {renderIcon()}
      </span>
      {!collapsed && <span className="nav-item-label">{label}</span>}
    </div>
  );
};

const SectionHeader = ({ label }) => {
  const { collapsed } = useContext(SidebarContext);
  if (collapsed) {
    return <div className="section-divider-collapsed" />;
  }
  return (
    <>
      <div className="section-divider-full" />
      <div className="section-header-label">{label}</div>
    </>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) {
    console.log('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: '#330000', borderRadius: '8px', margin: '20px' }}>
          <h1>System Encountered an Error</h1>
          <pre>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} className="btn" style={{ marginTop: '10px' }}>Reload Application</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main Application Components ---

const AuthenticatedApp = () => {
  const { user, login, logout, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState('operations');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('bs_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const nextVal = !prev;
      try {
        localStorage.setItem('bs_sidebar_collapsed', String(nextVal));
      } catch (e) {
        console.error(e);
      }
      return nextVal;
    });
  };

  const handleHoverTooltip = (label, active, top) => {
    setHoveredTooltip({ label, active, top });
  };

  const handleLeaveTooltip = () => {
    setHoveredTooltip(null);
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && !e.target?.isContentEditable) {
          e.preventDefault();
          toggleSidebarCollapse();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-close mobile drawer upon route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const userRole = useMemo(() => user?.role?.toLowerCase(), [user]);
  const hasAccess = (roles) => roles.some(r => r.toLowerCase() === userRole);
  const isWorker = userRole === 'worker';
  const isFounder = userRole === 'founder' || userRole === 'admin';
  const isMaintenancier = userRole === 'maintenancier';

  const isCollapsedDesktop = sidebarCollapsed && !mobileMenuOpen;

  const getSection = (Component, comingSoonProps, allowedRoles = []) => {
    if (isMaintenancier) return <Navigate to="/maintenance" replace />;
    if (isFounder) return Component;
    if (allowedRoles.length > 0 && hasAccess(allowedRoles)) return Component;
    return <ComingSoon {...comingSoonProps} />;
  };

  if (loading) return <SplashScreen />;
  if (!user) return <LoginView onLogin={login} />;

  const isPathActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  const closeDrawer = () => setMobileMenuOpen(false);

  return (
    <div className="app-container">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop-overlay" onClick={closeDrawer} />
      )}

      {/* Sidebar (Desktop fixed / Mobile sliding drawer) */}
      <div className={`sidebar shadow-xl ${mobileMenuOpen ? 'mobile-open' : ''} ${isCollapsedDesktop ? 'collapsed' : ''}`}>
        
        {/* Desktop Collapse / Expand Toggle Button */}
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={toggleSidebarCollapse}
          aria-label={isCollapsedDesktop ? "Agrandir le menu (Ctrl+B)" : "Réduire le menu (Ctrl+B)"}
          title={isCollapsedDesktop ? "Agrandir le menu (Ctrl+B)" : "Réduire le menu (Ctrl+B)"}
        >
          <ChevronLeft className={`toggle-icon ${isCollapsedDesktop ? 'rotated' : ''}`} size={15} />
        </button>

        {/* Logo Section */}
        <div className={`logo-container ${isCollapsedDesktop ? 'collapsed' : ''}`} style={{ padding: isCollapsedDesktop ? '16px 0' : '20px 0', textAlign: 'center', position: 'relative' }}>
          {isCollapsedDesktop ? (
            <div 
              className="logo-collapsed-box"
              onClick={toggleSidebarCollapse}
              title="Bright Stage — Cliquez pour agrandir (Ctrl+B)"
            >
              <img src="/logo.png?v=3" alt="Bright Stage" className="logo-compact-img" />
            </div>
          ) : (
            <img src="/logo.png?v=3" alt="Bright Stage" style={{ maxWidth: '65px', maxHeight: '80px', width: 'auto', height: 'auto', filter: 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(99, 102, 241, 0.5))' }} />
          )}

          {mobileMenuOpen && (
            <button
              onClick={closeDrawer}
              style={{
                position: 'absolute', right: '15px', top: '15px',
                background: 'rgba(255,255,255,0.08)', border: 'none',
                color: '#fff', width: '32px', height: '32px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Module Switcher */}
        {hasAccess(['Founder', 'Manager']) && (
          isCollapsedDesktop ? (
            <div className="module-switcher-collapsed">
              <button
                type="button"
                onClick={() => setActiveModule('operations')}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleHoverTooltip('Module Opérations (OPS)', activeModule === 'operations', rect.top + rect.height / 2);
                }}
                onMouseLeave={handleLeaveTooltip}
                className={`mini-mod-btn ${activeModule === 'operations' ? 'ops-active' : ''}`}
                aria-label="Opérations"
              >
                <Zap size={16} />
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('finance')}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleHoverTooltip('Module Finance (FINANCE)', activeModule === 'finance', rect.top + rect.height / 2);
                }}
                onMouseLeave={handleLeaveTooltip}
                className={`mini-mod-btn ${activeModule === 'finance' ? 'fin-active' : ''}`}
                aria-label="Finance"
              >
                <Coins size={16} />
              </button>
            </div>
          ) : (
            <div className="module-switcher" style={{ padding: '0 10px 20px 10px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveModule('operations')}
                className={`module-btn ${activeModule === 'operations' ? 'ops-active' : ''}`}
              >
                <Zap size={13} /> OPS
              </button>
              <button
                onClick={() => setActiveModule('finance')}
                className={`module-btn ${activeModule === 'finance' ? 'fin-active' : ''}`}
              >
                <Coins size={13} /> FINANCE
              </button>
            </div>
          )
        )}

        {/* Navigation Wrapped with SidebarContext */}
        <SidebarContext.Provider value={{ collapsed: isCollapsedDesktop, onHoverTooltip: handleHoverTooltip, onLeaveTooltip: handleLeaveTooltip }}>
          <nav style={{ flex: 1, overflowY: 'auto', paddingRight: isCollapsedDesktop ? '0' : '5px' }}>
            {isMaintenancier ? (
              <SidebarItem icon={Wrench} label={t('maintenance')} path="/maintenance" active={isPathActive('/maintenance')} iconColor="#ef4444" />
            ) : (
              <>
                {/* OPERATIONS MODULE */}
                {activeModule === 'operations' && (
                  <>
                    {!isWorker && <SidebarItem icon={LayoutDashboard} label={t('dashboard')} path="/" active={isPathActive('/')} iconColor="#6366f1" />}
                    {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                      <SidebarItem icon={FolderKanban} label={t('projects')} path="/projects" active={isPathActive('/projects')} iconColor="#10b981" />
                    )}
                    <SidebarItem icon={CalendarDays} label={t('calendar')} path="/calendar" active={isPathActive('/calendar')} iconColor="#06b6d4" />
                    <SidebarItem icon={Users2} label="Human Resources" path="/hr" active={isPathActive('/hr')} iconColor="#a855f7" />

                    {hasAccess(['Founder', 'Manager', 'Storekeeper']) && (
                      <SidebarItem icon={Package} label={t('inventory')} path="/inventory" active={isPathActive('/inventory')} iconColor="#f59e0b" />
                    )}

                    {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                      <>
                        <SectionHeader label="Contacts & Staff" />
                        <SidebarItem icon={Users} label={t('clients')} path="/clients" active={isPathActive('/clients')} iconColor="#3b82f6" />
                        <SidebarItem icon={HardHat} label={t('workers')} path="/workers" active={isPathActive('/workers')} iconColor="#eab308" />
                        <SidebarItem icon={Briefcase} label={t('freelancers')} path="/freelancers" active={isPathActive('/freelancers')} iconColor="#ec4899" />
                      </>
                    )}

                    <SectionHeader label={t('logistics')} />
                    {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                      <>
                        <SidebarItem icon={UserCheck} label={t('drivers')} path="/drivers" active={isPathActive('/drivers')} iconColor="#14b8a6" />
                        <SidebarItem icon={Truck} label="Transporteurs" path="/carriers" active={isPathActive('/carriers')} iconColor="#8b5cf6" />
                        <SidebarItem icon={Car} label={t('vehicles')} path="/vehicles" active={isPathActive('/vehicles')} iconColor="#38bdf8" />
                      </>
                    )}
                    <SidebarItem icon={ClipboardList} label="Bons de Livraison" path="/delivery-notes" active={isPathActive('/delivery-notes')} iconColor="#f97316" />

                    <SectionHeader label="Equipment Operations" />
                    {!isWorker && (
                      <>
                        <SidebarItem icon={Wrench} label={t('maintenance')} path="/maintenance" active={isPathActive('/maintenance')} iconColor="#ef4444" />
                        <SidebarItem icon={Handshake} label={t('subcontracting')} path="/subcontracting" active={isPathActive('/subcontracting')} iconColor="#6366f1" />
                      </>
                    )}

                    <SectionHeader label="System Tools" />
                    {!isWorker && (
                      <>
                        <SidebarItem icon={Calculator} label={t('structure_calc')} path="/calculator" active={isPathActive('/calculator')} iconColor="#a855f7" />
                        <SidebarItem icon={Monitor} label="LED Configurator" path="/led-config" active={isPathActive('/led-config')} iconColor="#3b82f6" />
                        <SidebarItem icon={Layers} label="Stage Calculator" path="/stage-calc" active={isPathActive('/stage-calc')} iconColor="#10b981" />
                        <SidebarItem icon={Sparkles} label="Studio Conception 3D" path="/stage-studio" active={isPathActive('/stage-studio')} iconColor="#ec4899" />
                      </>
                    )}
                    {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                      <SidebarItem icon={QrCode} label={t('qr_codes') || 'Global QR Export'} path="/qr-codes" active={isPathActive('/qr-codes')} iconColor="#f59e0b" />
                    )}
                  </>
                )}

                {/* FINANCE MODULE */}
                {activeModule === 'finance' && hasAccess(['Founder', 'Manager']) && (
                  <>
                    <SidebarItem icon={FileSpreadsheet} label="Quotes / Devis" path="/quotes" active={isPathActive('/quotes')} iconColor="#10b981" />
                    <SidebarItem icon={Sparkles} label="Quote Builder" path="/quote-builder" active={isPathActive('/quote-builder')} iconColor="#8b5cf6" />
                    <SidebarItem icon={Receipt} label="Invoice Management" path="/invoices" active={isPathActive('/invoices')} iconColor="#fbbf24" />
                    <SidebarItem icon={AlarmClock} label="Overdue Invoices" path="/overdue" active={isPathActive('/overdue')} iconColor="#f87171" />

                    {userRole !== 'manager' && (
                      <>
                        <SectionHeader label="Analytics & Reporting" />
                        <SidebarItem icon={TrendingUp} label="Financial Reports" path="/reports" active={isPathActive('/reports')} iconColor="#06b6d4" />
                        <SidebarItem icon={Scale} label="Fiscal Dashboard" path="/fiscal" active={isPathActive('/fiscal')} iconColor="#c084fc" />
                        <SidebarItem icon={ClipboardCheck} label={t('audits')} path="/audits" active={isPathActive('/audits')} iconColor="#94a3b8" />
                      </>
                    )}

                    <SectionHeader label="Administration" />
                    <SidebarItem icon={Settings} label="Settings" path="/settings" active={isPathActive('/settings')} iconColor="#64748b" />
                  </>
                )}
              </>
            )}
          </nav>
        </SidebarContext.Provider>

        {/* User Profile & Logout */}
        <div className={`sidebar-footer ${isCollapsedDesktop ? 'collapsed' : ''}`}>
          {isCollapsedDesktop ? (
            <div className="sidebar-footer-collapsed-inner">
              <div 
                className="user-avatar collapsed-avatar"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleHoverTooltip(`${user.name} (${user.role})`, false, rect.top + rect.height / 2);
                }}
                onMouseLeave={handleLeaveTooltip}
              >
                {user.name.charAt(0)}
              </div>
              <button 
                onClick={logout} 
                className="logout-btn collapsed-logout-btn"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleHoverTooltip(t('logout'), false, rect.top + rect.height / 2);
                }}
                onMouseLeave={handleLeaveTooltip}
                aria-label={t('logout')}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="user-profile-summary">
                <div className="user-avatar">
                  {user.name.charAt(0)}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-role-label">{user.role}</div>
                </div>
              </div>
              <button onClick={logout} className="logout-btn">
                <LogOut size={15} style={{ marginRight: '6px' }} /> {t('logout')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating Smart Popover Tooltip for Collapsed Sidebar */}
      {isCollapsedDesktop && hoveredTooltip && (
        <div
          className="sidebar-floating-popover"
          style={{
            top: `${hoveredTooltip.top}px`,
          }}
        >
          <div className="popover-caret" />
          <span className="popover-label">{hoveredTooltip.label}</span>
          {hoveredTooltip.active && <span className="popover-active-badge">Actif</span>}
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Mobile Topbar with Hamburger Toggle */}
        <div className="mobile-topbar">
          <button
            className="mobile-menu-trigger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="mobile-logo-brand">
            <img src="/logo.png?v=3" alt="Bright Stage" style={{ maxHeight: '32px', width: 'auto', filter: 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(99, 102, 241, 0.5))' }} />
          </div>
          <div className="mobile-badge-module">
            {activeModule === 'operations' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={13} /> OPS
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Coins size={13} /> FIN
              </span>
            )}
          </div>
        </div>

        <div className="mobile-page-content">
          <Routes>
            {isMaintenancier ? (
              <>
                <Route path="/maintenance" element={<MaintenanceView />} />
                <Route path="*" element={<Navigate to="/maintenance" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<DashboardView />} />

                {/* ── OPERATIONS MODULE ── */}
                <Route path="/projects" element={getSection(<ProjectList />, { icon: FolderKanban, featureName: "Gestion des Projets", description: "Créez, planifiez et suivez tous vos projets événementiels en temps réel." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager'])} />
                <Route path="/projects/:id" element={getSection(<ProjectEditorWrapper />, { icon: FolderKanban, featureName: "Éditeur de Projet", description: "Détails et configuration du projet." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager'])} />
                <Route path="/project/:id" element={getSection(<ProjectEditorWrapper />, { icon: FolderKanban, featureName: "Éditeur de Projet", description: "Détails et configuration du projet." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager'])} />
                <Route path="/calendar" element={getSection(<CalendarView />, { icon: CalendarDays, featureName: "Calendrier", description: "Vue calendrier unifiée de tous vos événements, réservations et plannings d'équipe." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager', 'Worker'])} />
                <Route path="/hr" element={getSection(<HRView />, { icon: Users2, featureName: "Ressources Humaines", description: "Gérez les contrats, congés, paies et dossiers de tous vos employés." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager', 'Worker'])} />

                {/* ✅ MAGASIN / INVENTAIRE — ACTIF */}
                <Route path="/inventory" element={<InventoryList />} />
                <Route path="/inventory/new" element={<InventoryForm />} />
                <Route path="/inventory/edit/:id" element={<InventoryForm />} />
                <Route path="/qr-codes" element={<QRCodeScreen />} />

                {/* Contacts & Staff */}
                <Route path="/clients" element={getSection(<ClientView />, { icon: Users, featureName: "Clients", description: "Base de données clients, historique des projets et gestion des contacts." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager'])} />
                <Route path="/workers" element={getSection(<WorkersView />, { icon: HardHat, featureName: "Techniciens", description: "Annuaire complet de vos techniciens avec compétences et disponibilités." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager'])} />
                <Route path="/freelancers" element={getSection(<FreelancerView />, { icon: Briefcase, featureName: "Freelancers", description: "Gestion des prestataires indépendants, contrats et fiches de paie." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager'])} />

                {/* ✅ LOGISTIQUE — ACTIF */}
                <Route path="/drivers" element={<DriverView />} />
                <Route path="/carriers" element={<CarrierView />} />
                <Route path="/vehicles" element={<VehicleView />} />
                <Route path="/delivery-notes" element={<DeliveryNoteList />} />
                <Route path="/delivery-notes/new" element={<DeliveryNoteForm />} />
                <Route path="/delivery-notes/edit/:id" element={<DeliveryNoteForm />} />

                {/* Equipment Operations */}
                <Route path="/maintenance" element={<MaintenanceView />} />
                <Route path="/subcontracting" element={getSection(<SubcontractedManagement />, { icon: Handshake, featureName: "Sous-traitance", description: "Gestion des prestataires externes et du matériel sous-traité." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager'])} />

                {/* System Tools */}
                <Route path="/calculator" element={<ComingSoon icon={Calculator} featureName="Calculateur Structure" description="Calculateur de charges et résistances pour vos structures scéniques. Ce module sera bientôt disponible." />} />
                <Route path="/led-config" element={<ComingSoon icon={Monitor} featureName="LED Configurator" description="Configurez et visualisez en 3D vos murs et scènes LED. Ce module sera bientôt disponible." />} />
                <Route path="/stage-calc" element={getSection(<StageConfigurator />, { icon: Layers, featureName: "Stage Calculator", description: "Calculateur de dimensions et de capacité pour vos scènes et podiums." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager'])} />
                <Route path="/stage-studio" element={getSection(<FullStageStudio />, { icon: Sparkles, featureName: "Studio Conception Scénique 3D", description: "Studio unifié de conception complète : Scène, Écran LED, Éclairage & Structure Truss." }, ['Founder', 'Manager', 'Storekeeper', 'Site Manager'])} />

                {/* ── FINANCE MODULE ── */}
                <Route path="/quotes" element={getSection(<QuotesList />, { icon: FileSpreadsheet, featureName: "Devis", description: "Créez des devis professionnels et suivez leur validation par vos clients." }, ['Founder', 'Manager'])} />
                <Route path="/quote-builder" element={getSection(<QuoteBuilder />, { icon: Sparkles, featureName: "Quote Builder", description: "Constructeur de devis avancé avec catalogue de prestations et tarifs." }, ['Founder', 'Manager'])} />
                <Route path="/invoices" element={getSection(<InvoiceList />, { icon: Receipt, featureName: "Facturation", description: "Émettez, envoyez et suivez toutes vos factures clients en quelques clics." }, ['Founder', 'Manager'])} />
                <Route path="/invoice-builder" element={getSection(<InvoiceBuilder />, { icon: Receipt, featureName: "Invoice Builder", description: "Constructeur de factures avec personnalisation et calcul TVA automatique." }, ['Founder', 'Manager'])} />
                <Route path="/overdue" element={getSection(<OverdueInvoices />, { icon: AlarmClock, featureName: "Factures Impayées", description: "Tableau de bord des factures en retard avec relances automatiques." }, ['Founder', 'Manager'])} />
                <Route path="/reports" element={<ComingSoon icon={TrendingUp} featureName="Financial Reports" description="Analyses détaillées de votre chiffre d'affaires, marges et rentabilité. Ce module sera bientôt disponible." />} />
                <Route path="/fiscal" element={<ComingSoon icon={Scale} featureName="Fiscal Dashboard" description="Suivi de votre situation fiscale, TVA collectée et déclarations. Ce module sera bientôt disponible." />} />
                <Route path="/audits" element={<ComingSoon icon={ClipboardCheck} featureName="Audits" description="Journal d'audit complet de toutes les actions effectuées dans le système. Ce module sera bientôt disponible." />} />
                <Route path="/audits/:id" element={<ComingSoon icon={ClipboardCheck} featureName="Détail Audit" description="Détails complets d'un événement d'audit spécifique. Ce module sera bientôt disponible." />} />
                <Route path="/settings" element={getSection(<SettingsView />, { icon: Settings, featureName: "Paramètres", description: "Configuration générale, utilisateurs, rôles et préférences de l'application." }, ['Founder'])} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <ConfirmProvider>
          <AuthProvider>
            <LanguageProvider>
              <ErrorBoundary>
                <AuthenticatedApp />
              </ErrorBoundary>
            </LanguageProvider>
          </AuthProvider>
        </ConfirmProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
