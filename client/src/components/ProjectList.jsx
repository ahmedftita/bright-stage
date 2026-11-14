import React, { useEffect, useState, useMemo } from 'react';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Plus,
    Search,
    Grid,
    List,
    Calendar,
    MapPin,
    Building,
    Users,
    Box,
    Truck,
    FileText,
    Settings,
    Edit3,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Layers,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    ShieldAlert,
    ExternalLink,
    Download
} from 'lucide-react';
import ProjectEditor from './ProjectEditor';
import LogisticsManifestView from './LogisticsManifestView';
import './ProjectList.css';

const ProjectList = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showLogistics, setShowLogistics] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [initialDate, setInitialDate] = useState(null);
    const [filterStatus, setFilterStatus] = useState(location.state?.filter || 'All');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (location.state?.filter) {
            setFilterStatus(location.state.filter);
        }
        if (location.state?.openNewProject) {
            setSelectedProject(null);
            if (location.state?.initialDate) {
                setInitialDate(location.state.initialDate);
            }
            setShowEditor(true);
            window.history.replaceState({}, document.title);
        }
        loadProjects();
    }, [location.state]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const data = await projectService.getAll();
            setProjects(data || []);
        } catch (err) {
            console.error('Failed to load projects', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (project) => {
        setSelectedProject(project);
        setShowEditor(true);
    };

    const handleEditorClose = () => {
        setShowEditor(false);
        setSelectedProject(null);
        setInitialDate(null);
        loadProjects();
    };

    // Calculate dynamic stats for KPI cockpit
    const stats = useMemo(() => {
        const total = projects.filter(p => p.status !== 'Done').length;
        const inField = projects.filter(p => p.status === 'Pickup').length;
        const drafts = projects.filter(p => ['Draft', 'Quote'].includes(p.status)).length;
        const returns = projects.filter(p => p.status === 'Return').length;
        const completed = projects.filter(p => p.status === 'Done').length;
        const pendingValidation = projects.filter(p => p.isValidated === false && !['Done', 'Draft', 'Quote'].includes(p.status)).length;

        return { total, inField, drafts, returns, completed, pendingValidation };
    }, [projects]);

    // Status metadata helper
    const getStatusMeta = (status) => {
        switch (status) {
            case 'Draft':
                return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', label: 'Draft' };
            case 'Quote':
                return { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.3)', label: 'Quote' };
            case 'Confirmed':
                return { color: '#818cf8', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', label: 'Confirmed' };
            case 'Pickup':
                return { color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', label: 'Pickup / In Field' };
            case 'Return':
                return { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.3)', label: 'Return' };
            case 'Done':
                return { color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', label: 'Done' };
            default:
                return { color: '#cbd5e1', bg: 'rgba(203, 213, 225, 0.1)', border: 'rgba(203, 213, 225, 0.2)', label: status };
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const getDurationDays = (start, end) => {
        if (!start || !end) return null;
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : null;
    };

    // Filter projects logic
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            // Status Tab Filtering
            if (filterStatus === 'All') {
                if (p.status === 'Done') return false;
            } else if (filterStatus === 'My Projects') {
                const creatorId = p.createdBy?._id || p.createdBy;
                const matchesUser = (creatorId === user?._id || p.createdByName === user?.username);
                if (!matchesUser || p.status === 'Done') return false;
            } else if (filterStatus === 'ValidationPending') {
                if (!(p.isValidated === false && p.status !== 'Done' && p.status !== 'Draft' && p.status !== 'Quote')) return false;
            } else if (filterStatus === 'Late') {
                if (p.status !== 'Pickup' || !p.dates?.end) return false;
                if (new Date() <= new Date(p.dates.end)) return false;
            } else if (filterStatus !== p.status) {
                return false;
            }

            // Search Term Filtering
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const name = (p.eventName || '').toLowerCase();
                const client = (p.client?.name || '').toLowerCase();
                const site = (p.siteName || '').toLowerCase();
                const creator = (p.createdByName || p.createdBy?.username || '').toLowerCase();
                const customId = (p.customId || '').toLowerCase();

                return name.includes(term) || client.includes(term) || site.includes(term) || creator.includes(term) || customId.includes(term);
            }

            return true;
        });
    }, [projects, filterStatus, searchTerm, user]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
    const displayedProjects = filteredProjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Filter items definition
    const filterTabs = [
        { id: 'All', label: 'All Active', count: stats.total },
        { id: 'My Projects', label: 'My Projects', count: projects.filter(p => (p.createdBy?._id === user?._id || p.createdBy === user?._id || p.createdByName === user?.username) && p.status !== 'Done').length },
        { id: 'Pickup', label: 'In Field / Logistics', count: stats.inField },
        { id: 'Draft', label: 'Drafts', count: projects.filter(p => p.status === 'Draft').length },
        { id: 'Quote', label: 'Quotes', count: projects.filter(p => p.status === 'Quote').length },
        { id: 'ValidationPending', label: 'Pending Review', count: stats.pendingValidation },
        { id: 'Return', label: 'Returns', count: stats.returns },
        { id: 'Done', label: 'Completed', count: stats.completed }
    ];

    return (
        <div className="pl-page-container">

            {/* Header with Title & Action Buttons */}
            <div className="pl-header-section">
                <div className="pl-header-left">
                    <div className="pl-header-title-row">
                        <h1 className="pl-header-title">
                            Projects & Operations
                        </h1>
                        <span className="pl-header-count-badge">
                            {filteredProjects.length} {filteredProjects.length === 1 ? 'Event' : 'Events'}
                        </span>
                    </div>
                    <p className="pl-header-subtitle">
                        Real-time tracking of stage productions, equipment manifests, and operational workflows.
                    </p>
                </div>

                {['Founder', 'Manager', 'Site Manager'].includes(user?.role) && (
                    <div className="project-header-actions">
                        {['Founder', 'Manager'].includes(user?.role) && (
                            <button
                                className="btn-creative-smart-quote"
                                onClick={() => navigate('/quote-builder')}
                                title="Generate fast estimate quote"
                            >
                                <Sparkles size={16} className="btn-icon-sparkle" />
                                <span>Smart Quote</span>
                                <span className="btn-tag-ai">AI Fast</span>
                            </button>
                        )}
                        <button
                            className="btn-creative-new-project"
                            onClick={() => { setSelectedProject(null); setShowEditor(true); }}
                            title="Create a new event project"
                        >
                            <span className="btn-icon-plus-wrapper">
                                <Plus size={14} strokeWidth={2.8} />
                            </span>
                            <span>New Project</span>
                            <span className="btn-tag-classic">Classic</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Executive KPI Metrics Bar */}
            <div className="pl-metrics-row">
                <div
                    className={`pl-metric-card ${filterStatus === 'All' ? 'active' : ''}`}
                    onClick={() => { setFilterStatus('All'); setCurrentPage(1); }}
                >
                    <div className="pl-metric-icon-wrap indigo">
                        <Layers size={22} />
                    </div>
                    <div className="pl-metric-data">
                        <span className="pl-metric-value">{stats.total}</span>
                        <span className="pl-metric-label">Active Projects</span>
                    </div>
                </div>

                <div
                    className={`pl-metric-card ${filterStatus === 'Pickup' ? 'active' : ''}`}
                    onClick={() => { setFilterStatus('Pickup'); setCurrentPage(1); }}
                >
                    <div className="pl-metric-icon-wrap blue">
                        <Truck size={22} />
                    </div>
                    <div className="pl-metric-data">
                        <span className="pl-metric-value">{stats.inField}</span>
                        <span className="pl-metric-label">In Field / On Site</span>
                    </div>
                </div>

                <div
                    className={`pl-metric-card ${['Draft', 'Quote'].includes(filterStatus) ? 'active' : ''}`}
                    onClick={() => { setFilterStatus('Draft'); setCurrentPage(1); }}
                >
                    <div className="pl-metric-icon-wrap amber">
                        <FileText size={22} />
                    </div>
                    <div className="pl-metric-data">
                        <span className="pl-metric-value">{stats.drafts}</span>
                        <span className="pl-metric-label">Quotes & Drafts</span>
                    </div>
                </div>

                <div
                    className={`pl-metric-card ${filterStatus === 'Done' ? 'active' : ''}`}
                    onClick={() => { setFilterStatus('Done'); setCurrentPage(1); }}
                >
                    <div className="pl-metric-icon-wrap emerald">
                        <CheckCircle2 size={22} />
                    </div>
                    <div className="pl-metric-data">
                        <span className="pl-metric-value">{stats.completed}</span>
                        <span className="pl-metric-label">Completed</span>
                    </div>
                </div>
            </div>

            {/* Creative Toolbar: Search, Filters & View Switcher */}
            <div className="pl-toolbar">
                <div className="pl-search-wrap">
                    <Search size={16} className="pl-search-icon" />
                    <input
                        type="text"
                        className="pl-search-input"
                        placeholder="Search event, client, venue, or creator..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                <div className="pl-filter-pills">
                    {filterTabs.map(tab => {
                        const isSelected = filterStatus === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                className={`pl-filter-pill ${isSelected ? 'active' : ''}`}
                                onClick={() => { setFilterStatus(tab.id); setCurrentPage(1); }}
                            >
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className="pl-pill-count">{tab.count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="pl-view-switch">
                    <button
                        type="button"
                        className={`pl-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <List size={16} />
                    </button>
                    <button
                        type="button"
                        className={`pl-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <Grid size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content: Projects Display */}
            {loading ? (
                <div className="pl-empty-card">
                    <div className="pe-pulse-dot" style={{ width: '12px', height: '12px', background: '#6366f1' }} />
                    <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                        Loading production workspaces...
                    </div>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="pl-empty-card">
                    <div className="pl-empty-icon">
                        <Box size={28} />
                    </div>
                    <h3 className="pl-empty-title">No projects found</h3>
                    <p className="pl-empty-subtitle">
                        {searchTerm
                            ? `No projects matching "${searchTerm}". Try resetting your search query.`
                            : `There are currently no projects under the "${filterStatus}" status filter.`}
                    </p>
                    {['Founder', 'Manager'].includes(user?.role) && (
                        <button
                            className="btn-creative-new-project"
                            style={{ marginTop: '10px' }}
                            onClick={() => { setSelectedProject(null); setShowEditor(true); }}
                        >
                            <Plus size={14} /> Create New Project
                        </button>
                    )}
                </div>
            ) : viewMode === 'list' ? (
                /* LIST VIEW MODE */
                <div className="pl-list-container">
                    {displayedProjects.map(p => {
                        const statusMeta = getStatusMeta(p.status);
                        const durationDays = getDurationDays(p.dates?.start, p.dates?.end);
                        const itemCount = p.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || (p.items?.length || 0);
                        const crewCount = (p.assignedUsers?.length || 0) + (p.team?.chefChantier ? 1 : 0);

                        return (
                            <div
                                key={p._id}
                                className="pl-project-row"
                                style={{ '--status-color': statusMeta.color }}
                                onClick={() => handleEdit(p)}
                            >
                                {/* Column 1: Project Identity */}
                                <div className="pl-col-identity">
                                    <div className="pl-project-avatar">
                                        {(p.eventName || 'P').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="pl-identity-text">
                                        <div className="pl-project-title-row">
                                            <span className="pl-project-name" title={p.eventName}>
                                                {p.eventName}
                                            </span>
                                            {p.customId && (
                                                <span className="pl-custom-id-tag">
                                                    {p.customId}
                                                </span>
                                            )}
                                        </div>

                                        <div className="pl-meta-byline">
                                            <span>by <strong className="pl-creator-name">{p.createdByName || p.createdBy?.username || 'Team'}</strong></span>
                                            {p.isValidated === false && (
                                                <span className="pl-validation-badge">
                                                    <AlertTriangle size={11} /> Pending Review
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Client & Venue */}
                                <div className="pl-col-client-venue">
                                    <div className="pl-client-line" title={p.client?.name || 'Unassigned'}>
                                        <Building size={14} className="pl-client-icon" />
                                        <span>{p.client?.name || 'No Client Assigned'}</span>
                                    </div>
                                    <div className="pl-venue-line" title={p.siteName || p.siteAddress || 'No venue specified'}>
                                        <MapPin size={13} className="pl-venue-icon" />
                                        <span>{p.siteName || p.siteAddress || 'Venue TBD'}</span>
                                    </div>
                                </div>

                                {/* Column 3: Dates & Duration */}
                                <div className="pl-col-schedule">
                                    <div className="pl-dates-line">
                                        <Calendar size={13} className="pl-dates-icon" />
                                        <span>
                                            {formatDate(p.dates?.start)}
                                            {p.dates?.end && ` → ${formatDate(p.dates?.end)}`}
                                        </span>
                                    </div>
                                    <div className="pl-duration-line">
                                        {durationDays && (
                                            <span className="pl-duration-chip">
                                                <Clock size={11} /> {durationDays} Days
                                            </span>
                                        )}
                                        {itemCount > 0 && (
                                            <span className="pl-duration-chip" style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', borderColor: 'rgba(255,255,255,0.08)' }}>
                                                <Box size={11} /> {itemCount} items
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Column 4: Status & Deposit */}
                                <div className="pl-col-status">
                                    <span
                                        className="pl-status-pill"
                                        style={{
                                            background: statusMeta.bg,
                                            borderColor: statusMeta.border,
                                            color: statusMeta.color
                                        }}
                                    >
                                        <span className="pl-status-dot" />
                                        {statusMeta.label}
                                    </span>

                                    {p.status === 'Confirmed' && (!p.paymentStatus || p.paymentStatus === 'Unpaid') && (
                                        <span className="pl-deposit-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={11} /> Deposit Pending
                                        </span>
                                    )}
                                </div>

                                {/* Column 5: Action Hub */}
                                <div className="pl-col-actions" onClick={e => e.stopPropagation()}>
                                    {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                        <button
                                            type="button"
                                            className="pl-btn-prep-pdf"
                                            onClick={(e) => { e.stopPropagation(); projectService.downloadPrepList(p._id); }}
                                            title="Open PDF Prep List in a new window"
                                        >
                                            <span className="pl-prep-icon-wrap"><Download size={13} /></span>
                                            <span className="pl-btn-text-full">Download PDF Prep List</span>
                                            <span className="pl-btn-text-short">PDF Prep List</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="pl-btn-action manage"
                                        onClick={() => handleEdit(p)}
                                        title="Edit project"
                                    >
                                        <Edit3 size={14} />
                                        <span>Edit</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="pl-btn-action doc"
                                        onClick={(e) => { e.stopPropagation(); projectService.downloadQuote(p._id); }}
                                        title="View / Download Quote PDF"
                                    >
                                        <FileText size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* GRID VIEW MODE */
                <div className="pl-grid-container">
                    {displayedProjects.map(p => {
                        const statusMeta = getStatusMeta(p.status);
                        const durationDays = getDurationDays(p.dates?.start, p.dates?.end);
                        const itemCount = p.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || (p.items?.length || 0);
                        const crewCount = (p.assignedUsers?.length || 0) + (p.team?.chefChantier ? 1 : 0);

                        return (
                            <div
                                key={p._id}
                                className="pl-grid-card"
                                style={{ '--status-color': statusMeta.color }}
                                onClick={() => handleEdit(p)}
                            >
                                <div className="pl-grid-header">
                                    <div className="pl-grid-title-wrap">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {p.customId && (
                                                <span className="pl-custom-id-tag">{p.customId}</span>
                                            )}
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                by {p.createdByName || p.createdBy?.username || 'Team'}
                                            </span>
                                        </div>
                                        <h3 className="pl-grid-title" title={p.eventName}>{p.eventName}</h3>
                                    </div>

                                    <span
                                        className="pl-status-pill"
                                        style={{
                                            background: statusMeta.bg,
                                            borderColor: statusMeta.border,
                                            color: statusMeta.color
                                        }}
                                    >
                                        <span className="pl-status-dot" />
                                        {statusMeta.label}
                                    </span>
                                </div>

                                <div className="pl-grid-details-box">
                                    <div className="pl-grid-row-detail">
                                        <span className="pl-grid-detail-label">
                                            <Building size={13} color="#818cf8" /> Client
                                        </span>
                                        <span className="pl-grid-detail-value" title={p.client?.name || 'Unassigned'}>
                                            {p.client?.name || 'No Client'}
                                        </span>
                                    </div>

                                    <div className="pl-grid-row-detail">
                                        <span className="pl-grid-detail-label">
                                            <MapPin size={13} color="#fbbf24" /> Venue
                                        </span>
                                        <span className="pl-grid-detail-value" title={p.siteName || 'TBD'}>
                                            {p.siteName || 'Venue TBD'}
                                        </span>
                                    </div>

                                    <div className="pl-grid-row-detail">
                                        <span className="pl-grid-detail-label">
                                            <Calendar size={13} color="#34d399" /> Dates
                                        </span>
                                        <span className="pl-grid-detail-value">
                                            {formatDate(p.dates?.start)}
                                        </span>
                                    </div>
                                </div>

                                <div className="pl-grid-resources">
                                    {durationDays && (
                                        <span className="pl-resource-tag">
                                            <Clock size={12} color="#a5b4fc" /> {durationDays} Days
                                        </span>
                                    )}
                                    <span className="pl-resource-tag">
                                        <Box size={12} color="#38bdf8" /> {itemCount} Equipment
                                    </span>
                                    <span className="pl-resource-tag">
                                        <Users size={12} color="#c084fc" /> {crewCount} Crew
                                    </span>
                                </div>

                                <div className="pl-grid-footer" onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                            <button
                                                type="button"
                                                className="pl-btn-prep-pdf"
                                                onClick={(e) => { e.stopPropagation(); projectService.downloadPrepList(p._id); }}
                                                title="Open PDF Prep List in a new window"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <span className="pl-prep-icon-wrap" style={{ display: 'flex', alignItems: 'center' }}><Download size={13} /></span>
                                                <span>PDF Prep List</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="pl-btn-action doc"
                                            onClick={(e) => { e.stopPropagation(); projectService.downloadQuote(p._id); }}
                                            title="View / Download Quote PDF"
                                        >
                                            <FileText size={14} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        className="pl-btn-action manage"
                                        onClick={() => handleEdit(p)}
                                        title="Edit project"
                                    >
                                        <Edit3 size={13} /> Edit
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && filteredProjects.length > 0 && (
                <div className="pl-pagination-bar">
                    <span className="pl-pagination-info">
                        Showing <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, filteredProjects.length)}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredProjects.length)}</strong> of <strong>{filteredProjects.length}</strong> projects
                    </span>

                    <div className="pl-pagination-controls">
                        <button
                            type="button"
                            className="pl-page-nav-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={14} /> <span>Prev</span>
                        </button>

                        <div className="pl-page-indicator">
                            {currentPage} / {totalPages}
                        </div>

                        <button
                            type="button"
                            className="pl-page-nav-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <span>Next</span> <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Project Full Editor Modal */}
            {showEditor && (
                <ProjectEditor
                    project={selectedProject}
                    onClose={handleEditorClose}
                    onSave={loadProjects}
                    initialDate={initialDate}
                />
            )}

            {/* Logistics Manifest View */}
            {showLogistics && (
                <LogisticsManifestView
                    project={selectedProject}
                    onClose={() => { setShowLogistics(false); setSelectedProject(null); }}
                    onValidated={loadProjects}
                />
            )}
        </div>
    );
};

export default ProjectList;
