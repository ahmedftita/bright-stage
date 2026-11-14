import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../context/ConfirmContext';
import './DashboardView.css';
import { CONFIG } from '../config';
import { 
    Banknote, 
    AlertTriangle, 
    Mail, 
    FileText, 
    Calendar, 
    Star, 
    Wrench, 
    TrendingDown, 
    Package, 
    RotateCcw, 
    ArrowUpRight, 
    ArrowDownLeft, 
    MapPin, 
    PlusCircle, 
    CheckCircle2, 
    QrCode,
    Clock,
    RefreshCw,
    ChevronRight,
    Zap,
    FolderKanban,
    ShieldCheck,
    Sparkles,
    Crown
} from 'lucide-react';

const API_URL = CONFIG.API_URL;

const DashboardView = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showAlert } = useDialog();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalItems: 0,
        totalProjects: 0,
        statusCounts: {},
        activeTickets: 0,
        maintCounts: {},
        totalLoss: 0,
        unvalidatedCount: 0,
        overdueCount: 0,
        pendingInvoiceCount: 0,
        totalRevenueMonth: 0,
        draftQuotesCount: 0
    });
    const [todayProjects, setTodayProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isFounderOrManager = ['Founder', 'Manager'].includes(user?.role);
    const isStorekeeper = user?.role === 'Storekeeper';
    const isSiteManager = user?.role === 'Site Manager';
    const isWorker = user?.role === 'Worker';

    const fetchStats = useCallback(async (showRefreshingState = false) => {
        if (showRefreshingState) setRefreshing(true);
        try {
            const promises = [
                axios.get(`${API_URL}/inventory`),
                axios.get(`${API_URL}/projects`),
                axios.get(`${API_URL}/maintenance`),
                axios.get(`${API_URL}/invoices`)
            ];

            if (isFounderOrManager) {
                promises.push(axios.get(`${API_URL}/loss-reports`));
            }

            const results = await Promise.all(promises);
            const invRes = results[0];
            const projRes = results[1];
            const maintRes = results[2];
            const invoiceRes = results[3];
            const lossRes = isFounderOrManager ? results[4] : { data: [] };

            const projectData = projRes.data || [];
            const invoiceData = invoiceRes.data || [];

            // Filter today's projects (pickup or return)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            const todaySchedule = projectData.filter(p => {
                const pickupDate = p.pickupDate ? new Date(p.pickupDate).toISOString().split('T')[0] : null;
                const returnDate = p.returnDate ? new Date(p.returnDate).toISOString().split('T')[0] : null;
                return pickupDate === todayStr || returnDate === todayStr;
            });

            setTodayProjects(todaySchedule);

            // Project status counts
            const statusCounts = { Late: 0, Draft: 0, Quote: 0, Confirmed: 0, Pickup: 0, Return: 0, Done: 0 };
            projectData.forEach(p => {
                let s = p.status;
                if (statusCounts[s] !== undefined) {
                    statusCounts[s]++;
                } else {
                    statusCounts[s] = (statusCounts[s] || 0) + 1;
                }
            });

            // Maintenance counts
            const maintData = maintRes.data || [];
            const maintCounts = { Open: 0, 'Sent to Repair': 0, Fixed: 0, Resolved: 0 };
            maintData.forEach(t => { 
                const s = t.status || 'Open'; 
                if (maintCounts[s] !== undefined) maintCounts[s]++; 
                else maintCounts[s] = (maintCounts[s] || 0) + 1; 
            });

            const openTicketIds = new Set(maintData.filter(t => t.status !== 'Fixed' && t.status !== 'Resolved').map(t => String(t.inventoryItem?._id || '')));
            const unreportedCount = invRes.data.filter(i => {
                const state = i.state || 'Fonctionnel';
                return state !== 'Fonctionnel' && !openTicketIds.has(String(i._id));
            }).length;
            maintCounts['Unreported'] = unreportedCount;

            const unvalidatedCount = projectData.filter(p => p.isValidated === false && p.status !== 'Done').length;

            // Finance Stats
            const now = new Date();
            const overdueInvoices = invoiceData.filter(inv => {
                return (inv.status === 'Sent' || inv.status === 'Partially Paid') && new Date(inv.dueDate) < now;
            });

            const pendingInvoices = invoiceData.filter(inv => inv.status === 'Sent');
            const totalRevenueMonth = invoiceData
                .filter(inv => inv.status === 'Paid' && new Date(inv.date).getMonth() === now.getMonth())
                .reduce((acc, curr) => acc + (curr.financials?.totalInclTax || 0), 0);

            setStats({
                totalItems: invRes.data.length,
                totalProjects: projectData.filter(p => p.status !== 'Done').length,
                statusCounts,
                activeTickets: maintData.filter(t => t.status !== 'Fixed' && t.status !== 'Resolved').length + unreportedCount,
                maintCounts,
                totalLoss: lossRes.data ? lossRes.data.reduce((acc, curr) => acc + (curr.lossValuation || 0), 0) : 0,
                unvalidatedCount,
                overdueCount: overdueInvoices.length,
                pendingInvoiceCount: pendingInvoices.length,
                totalRevenueMonth,
                draftQuotesCount: statusCounts['Quote'] || statusCounts['Draft'] || 0
            });
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
            if (showRefreshingState) {
                setTimeout(() => setRefreshing(false), 500);
            }
        }
    }, [isFounderOrManager]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleManualRefresh = () => {
        fetchStats(true);
    };

    // French formatted date
    const formattedDate = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
        <div className="dashboard-container">
            {/* --- Executive Hero Header --- */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <div className="hero-avatar-box">
                        <Sparkles size={28} color="#a5b4fc" />
                        <div className="hero-status-beacon" title="Système opérationnel" />
                    </div>

                    <div className="hero-text-group">
                        <div className="hero-badges-row">
                            <span className="hero-badge-role">
                                <Crown size={13} /> {user?.role || 'Membre'} Espace de Travail
                            </span>
                            <span className="hero-badge-status">
                                <ShieldCheck size={13} /> Système Opérationnel
                            </span>
                        </div>
                        <h1 className="hero-title">
                            {t('welcome') || 'Bienvenue'}, <span className="hero-title-name">{user?.name || 'Admin'}</span>
                        </h1>
                        <p className="hero-subtitle">
                            Tableau de bord exécutif & supervision en temps réel des opérations Bright Stage
                        </p>
                    </div>
                </div>

                <div className="hero-right-actions">
                    <div className="hero-time-badge">
                        <Clock size={16} color="#818cf8" />
                        <span>{capitalizedDate}</span>
                    </div>
                    <button 
                        className={`hero-refresh-btn ${refreshing ? 'spinning' : ''}`}
                        onClick={handleManualRefresh}
                        title="Actualiser les données"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner-modern">
                    <RefreshCw className="spinner-icon" size={36} />
                    <span>Chargement de l'espace de travail Bright Stage...</span>
                </div>
            ) : (
                <>
                    {/* --- Balanced 4-Column KPI Metrics Grid --- */}
                    <div className="kpi-metrics-grid">
                        {/* 1. Finance Tile (For Founder / Manager) */}
                        {isFounderOrManager && (
                            <div className="kpi-card" style={{ '--kpi-accent': '#8b5cf6' }}>
                                <div>
                                    <div className="kpi-header">
                                        <div className="kpi-label-group">
                                            <span className="kpi-title">Revenu Mensuel</span>
                                            <span className="kpi-sub-context">Factures réglées ce mois</span>
                                        </div>
                                        <div className="kpi-icon-badge">
                                            <Banknote size={24} />
                                        </div>
                                    </div>
                                    <div className="kpi-main-metric">
                                        {(stats.totalRevenueMonth || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        <span className="kpi-metric-unit">TND</span>
                                    </div>
                                </div>

                                <div className="kpi-chips-container">
                                    <div 
                                        className="kpi-chip kpi-chip-danger"
                                        onClick={() => navigate('/invoices', { state: { filter: 'Overdue' } })}
                                        title="Voir les factures impayées en retard"
                                    >
                                        <AlertTriangle size={13} /> {stats.overdueCount || 0} Impayées
                                    </div>
                                    <div 
                                        className="kpi-chip kpi-chip-info"
                                        onClick={() => navigate('/invoices', { state: { filter: 'Sent' } })}
                                        title="Factures envoyées à suivre"
                                    >
                                        <Mail size={13} /> {stats.pendingInvoiceCount || 0} À Suivre
                                    </div>
                                    <div 
                                        className="kpi-chip kpi-chip-warning"
                                        onClick={() => navigate('/quotes')}
                                        title="Devis & estimations en attente"
                                    >
                                        <FileText size={13} /> {stats.draftQuotesCount || 0} Devis
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Active Projects Tile */}
                        {(isFounderOrManager || isSiteManager) && (
                            <div className="kpi-card" style={{ '--kpi-accent': '#10b981' }}>
                                <div>
                                    <div className="kpi-header">
                                        <div className="kpi-label-group">
                                            <span className="kpi-title">{t('active_projects') || 'Projets Actifs'}</span>
                                            <span className="kpi-sub-context">En cours & planification</span>
                                        </div>
                                        <div className="kpi-icon-badge">
                                            <FolderKanban size={24} />
                                        </div>
                                    </div>
                                    <div className="kpi-main-metric">
                                        {stats.totalProjects || 0}
                                        <span className="kpi-metric-unit">Projets</span>
                                    </div>
                                </div>

                                <div className="kpi-chips-container">
                                    {[
                                        { label: 'Late', color: '#ef4444', text: 'En Retard' },
                                        { label: 'Draft', color: '#94a3b8', text: 'Brouillon' },
                                        { label: 'Quote', color: '#fbbf24', text: 'Devis' },
                                        { label: 'Confirmed', color: '#3b82f6', text: 'Confirmé' },
                                        { label: 'Pickup', color: '#8b5cf6', text: 'Retrait' },
                                        { label: 'Return', color: '#f43f5e', text: 'Retour' }
                                    ].map(s => (
                                        <div 
                                            key={s.label}
                                            className="kpi-chip"
                                            onClick={() => navigate('/projects', { state: { filter: s.label } })}
                                            style={{ borderColor: `${s.color}50` }}
                                            title={`Filtrer par statut: ${s.text}`}
                                        >
                                            <span style={{ color: s.color, fontWeight: 'bold' }}>{stats.statusCounts?.[s.label] || 0}</span>
                                            <span style={{ color: '#94a3b8' }}>{s.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Maintenance Tile */}
                        {(isFounderOrManager || isStorekeeper) && (
                            <div className="kpi-card" style={{ '--kpi-accent': '#ef4444' }}>
                                <div>
                                    <div className="kpi-header">
                                        <div className="kpi-label-group">
                                            <span className="kpi-title">{t('maint_issues') || 'Incidents & Maintenance'}</span>
                                            <span className="kpi-sub-context">Équipements & anomalies</span>
                                        </div>
                                        <div className="kpi-icon-badge">
                                            <Wrench size={24} />
                                        </div>
                                    </div>
                                    <div className="kpi-main-metric">
                                        {stats.activeTickets || 0}
                                        <span className="kpi-metric-unit">Tickets</span>
                                    </div>
                                </div>

                                <div className="kpi-chips-container">
                                    {[
                                        { label: 'Unreported', color: '#fbbf24', text: 'Non Signalé' },
                                        { label: 'Open', color: '#ef4444', text: 'Ouvert' },
                                        { label: 'Sent to Repair', color: '#f59e0b', text: 'Réparation' },
                                        { label: 'Fixed', color: '#10b981', text: 'Réparé' }
                                    ].map(s => (
                                        <div 
                                            key={s.label}
                                            className="kpi-chip"
                                            onClick={() => navigate('/maintenance', { state: { filter: s.label } })}
                                            style={{ borderColor: `${s.color}50` }}
                                            title={`Filtrer les incidents: ${s.text}`}
                                        >
                                            <span style={{ color: s.color, fontWeight: 'bold' }}>{stats.maintCounts?.[s.label] || 0}</span>
                                            <span style={{ color: '#94a3b8' }}>{s.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 4. Score & Pertes Tile */}
                        <div className="kpi-card" style={{ '--kpi-accent': '#f59e0b' }}>
                            <div>
                                <div className="kpi-header">
                                    <div className="kpi-label-group">
                                        <span className="kpi-title">Score & Performance</span>
                                        <span className="kpi-sub-context">Indicateur d'excellence</span>
                                    </div>
                                    <div className="kpi-icon-badge">
                                        <Star size={24} fill="#f59e0b33" />
                                    </div>
                                </div>
                                <div className="kpi-main-metric">
                                    {user?.points || 1000}
                                    <span className="kpi-metric-unit">Points</span>
                                </div>
                            </div>

                            <div className="kpi-chips-container">
                                {isFounderOrManager ? (
                                    <div 
                                        className="kpi-chip kpi-chip-warning" 
                                        onClick={() => navigate('/hr')}
                                        title="Consulter le registre RH & valorisation des pertes"
                                    >
                                        <TrendingDown size={13} /> Pertes: €{stats.totalLoss || 0}
                                    </div>
                                ) : (
                                    <div className="kpi-chip kpi-chip-success">
                                        <Sparkles size={13} /> Niveau Excellence
                                    </div>
                                )}
                                <div className="kpi-chip kpi-chip-info">
                                    <ShieldCheck size={13} /> Fiabilité 100%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Today's Schedule Board --- */}
                    {(isFounderOrManager || isStorekeeper || isSiteManager) && (
                        <div className="schedule-section-card">
                            <div className="schedule-header">
                                <h3 className="schedule-title">
                                    <Calendar size={20} color="#60a5fa" /> 
                                    {t('todays_schedule') && t('todays_schedule') !== 'todays_schedule' ? t('todays_schedule') : "Planning du Jour & Opérations"}
                                </h3>
                                <span className="schedule-count-pill">
                                    {todayProjects.length} {todayProjects.length <= 1 ? 'Opération' : 'Opérations'}
                                </span>
                            </div>

                            {todayProjects.length > 0 ? (
                                <div className="schedule-items-list">
                                    {todayProjects.map(project => {
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        const pickupDate = project.pickupDate ? new Date(project.pickupDate).toISOString().split('T')[0] : null;
                                        const isPickupToday = pickupDate === todayStr;

                                        return (
                                            <div
                                                key={project._id}
                                                className={`schedule-item-row ${isPickupToday ? 'schedule-pickup' : 'schedule-return'}`}
                                                onClick={() => navigate(`/project/${project._id}`)}
                                            >
                                                <div className="schedule-badge-icon">
                                                    {isPickupToday ? <Package size={22} /> : <RotateCcw size={22} />}
                                                </div>

                                                <div>
                                                    <div className="schedule-info-client">
                                                        {project.client?.name || 'Client Non Spécifié'}
                                                    </div>
                                                    <div className="schedule-info-project">
                                                        {project.name || 'Projet sans nom'}
                                                    </div>
                                                    <div className="schedule-meta-tags">
                                                        <span 
                                                            className="schedule-status-chip"
                                                            style={{
                                                                background: isPickupToday ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                                color: isPickupToday ? '#34d399' : '#60a5fa',
                                                                border: `1px solid ${isPickupToday ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            {isPickupToday ? (<><ArrowUpRight size={12} /> RETRAIT (PICKUP)</>) : (<><ArrowDownLeft size={12} /> RETOUR (RETURN)</>)}
                                                        </span>
                                                        <span 
                                                            className="schedule-status-chip"
                                                            style={{
                                                                background: 'rgba(255, 255, 255, 0.05)',
                                                                color: '#94a3b8',
                                                                border: '1px solid rgba(255, 255, 255, 0.08)'
                                                            }}
                                                        >
                                                            {project.status || 'Draft'}
                                                        </span>
                                                        {project.siteAddress && (
                                                            <span style={{
                                                                color: '#64748b',
                                                                fontSize: '0.75rem',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                <MapPin size={12} /> {project.siteAddress.substring(0, 35)}{project.siteAddress.length > 35 ? '...' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="action-arrow-circle" style={{ '--btn-accent': isPickupToday ? '#10b981' : '#3b82f6' }}>
                                                    <ChevronRight size={18} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="schedule-empty-state">
                                    <Calendar size={32} color="#64748b" style={{ marginBottom: '8px', opacity: 0.7 }} />
                                    <p style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.92rem', margin: '0 0 4px' }}>
                                        Aucun retrait ou retour prévu pour aujourd'hui
                                    </p>
                                    <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>
                                        Toutes les opérations logistiques du jour sont à jour et conformes au planning.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- Quick Actions Section --- */}
                    <div style={{ marginTop: '10px' }}>
                        <div className="section-header-modern">
                            <div className="section-title-group">
                                <div className="section-icon-badge">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h2 className="section-title-modern">{t('quick_actions') || 'Actions Rapides'}</h2>
                                    <p className="section-subtext">Raccourcis rapides vers vos opérations et workflows clés</p>
                                </div>
                            </div>
                        </div>

                        <div className="quick-actions-modern-grid">
                            {/* Créer Réquisition */}
                            {(isFounderOrManager || isSiteManager) && (
                                <div 
                                    className="action-card-modern"
                                    style={{ '--btn-accent': '#10b981' }}
                                    onClick={() => navigate('/projects')}
                                    title="Créer une nouvelle réquisition ou un devis"
                                >
                                    <div className="action-icon-wrapper">
                                        <PlusCircle size={20} />
                                    </div>
                                    <div className="action-body-wrapper">
                                        <span className="action-label-title">Créer Réquisition</span>
                                        <span className="action-label-subtext">Nouveau projet ou devis</span>
                                    </div>
                                    <div className="action-arrow-circle">
                                        <ChevronRight size={15} />
                                    </div>
                                </div>
                            )}

                            {/* Mes Commandes */}
                            {(isFounderOrManager || isSiteManager || isWorker) && (
                                <div 
                                    className="action-card-modern"
                                    style={{ '--btn-accent': '#3b82f6' }}
                                    onClick={() => navigate('/projects', { state: { filter: 'My Projects' } })}
                                    title="Consulter mes commandes"
                                >
                                    <div className="action-icon-wrapper">
                                        <Package size={20} />
                                    </div>
                                    <div className="action-body-wrapper">
                                        <span className="action-label-title">{t('my_orders') || 'Mes Commandes'}</span>
                                        <span className="action-label-subtext">Suivi de vos commandes</span>
                                    </div>
                                    <div className="action-arrow-circle">
                                        <ChevronRight size={15} />
                                    </div>
                                </div>
                            )}

                            {/* Valider Commandes */}
                            {(isFounderOrManager || isStorekeeper) && (
                                <div 
                                    className="action-card-modern"
                                    style={{ '--btn-accent': '#8b5cf6' }}
                                    onClick={() => navigate('/projects', { state: { filter: 'ValidationPending' } })}
                                    title="Valider les commandes en attente"
                                >
                                    <div className="action-icon-wrapper">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div className="action-body-wrapper">
                                        <span className="action-label-title">
                                            {t('validate_orders') || 'Valider Commandes'} ({stats.unvalidatedCount || 0})
                                        </span>
                                        <span className="action-label-subtext">Validation par le magasin</span>
                                    </div>
                                    <div className="action-arrow-circle">
                                        <ChevronRight size={15} />
                                    </div>
                                </div>
                            )}

                            {/* Bons de Sortie */}
                            {isFounderOrManager && (
                                <div 
                                    className="action-card-modern"
                                    style={{ '--btn-accent': '#f59e0b' }}
                                    onClick={() => navigate('/projects')}
                                    title="Gérer les bons de sortie matériel"
                                >
                                    <div className="action-icon-wrapper">
                                        <FileText size={20} />
                                    </div>
                                    <div className="action-body-wrapper">
                                        <span className="action-label-title">{t('exit_slips') || 'Bons de Sortie'}</span>
                                        <span className="action-label-subtext">Bordereaux de matériel</span>
                                    </div>
                                    <div className="action-arrow-circle">
                                        <ChevronRight size={15} />
                                    </div>
                                </div>
                            )}

                            {/* Scanner */}
                            {(isStorekeeper || isWorker) && (
                                <div 
                                    className="action-card-modern"
                                    style={{ '--btn-accent': '#ef4444' }}
                                    onClick={() => showAlert({
                                        title: "Application Mobile Requise",
                                        message: "Veuillez utiliser l'application mobile Bright Stage pour effectuer les scans de matériel.",
                                        type: "info"
                                    })}
                                    title="Scanner le matériel"
                                >
                                    <div className="action-icon-wrapper">
                                        <QrCode size={20} />
                                    </div>
                                    <div className="action-body-wrapper">
                                        <span className="action-label-title">
                                            {isStorekeeper ? "Scanner (Check-In/Out)" : "Scanner (Check-In)"}
                                        </span>
                                        <span className="action-label-subtext">Scan mobile code-barres</span>
                                    </div>
                                    <div className="action-arrow-circle">
                                        <ChevronRight size={15} />
                                    </div>
                                </div>
                            )}

                            {/* Tableau de Bord Maintenance */}
                            <div 
                                className="action-card-modern"
                                style={{ '--btn-accent': '#06b6d4' }}
                                onClick={() => navigate('/maintenance')}
                                title="Accéder à la maintenance et SAV"
                            >
                                <div className="action-icon-wrapper">
                                    <Wrench size={20} />
                                </div>
                                <div className="action-body-wrapper">
                                    <span className="action-label-title">{t('maint_dash') || 'Maintenance SAV'}</span>
                                    <span className="action-label-subtext">Gestion des pannes & SAV</span>
                                </div>
                                <div className="action-arrow-circle">
                                    <ChevronRight size={15} />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardView;

