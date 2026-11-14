import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { inventoryService } from '../services/inventoryService';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import {
    Printer, QrCode, Search, Eye, X,
    ChevronLeft, ChevronRight, Box, Calendar, Layers
} from 'lucide-react';
import './QRCodeScreen.css';

const QRCodeScreen = () => {
    const { user } = useAuth();
    const isSiteManager = user?.role === 'Site Manager';

    const [activeTab, setActiveTab] = useState(isSiteManager ? 'projects' : 'inventory');
    const [inventory, setInventory] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [search, setSearch] = useState('');

    // Print Preview Modal State
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewPageIndex, setPreviewPageIndex] = useState(0);

    useEffect(() => {
        fetchData();
        if (isSiteManager) setActiveTab('projects');
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const promises = [projectService.getAll()];
            if (!isSiteManager) promises.push(inventoryService.getAll());

            const results = await Promise.all(promises);
            setProjects(results[0] || []);
            if (!isSiteManager) setInventory(results[1] || []);
        } catch (err) {
            console.error("Error fetching QR data:", err);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredList = () => {
        const list = activeTab === 'inventory' ? inventory : projects;
        return list.filter(i => {
            const name = activeTab === 'inventory' ? (i.name || '') : (i.eventName || '');
            const sub = activeTab === 'inventory' ? (i.barcode || '') : (i.clientName || '');
            const cat = activeTab === 'inventory' ? (i.category || '') : '';
            return name.toLowerCase().includes(search.toLowerCase()) ||
                sub.toLowerCase().includes(search.toLowerCase()) ||
                cat.toLowerCase().includes(search.toLowerCase());
        });
    };

    const getQRValue = (item) => {
        if (!item) return '';
        if (activeTab === 'inventory') {
            return `brightstage://inventory/${item.barcode || item._id}`;
        } else {
            return `brightstage://project/${item._id}`;
        }
    };

    // Split items into chunks of 9 for A4 pages (3x3 grid)
    const chunkArray = (array, size = 9) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    };

    const filteredList = getFilteredList();
    const pages = chunkArray(filteredList, 9);

    // Print Single Label
    const handlePrintSingle = () => {
        if (!selectedItem) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.print();
            return;
        }

        const printableSingle = document.getElementById('printable-qr');
        if (!printableSingle) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Print Label - ${activeTab === 'inventory' ? selectedItem.name : selectedItem.eventName}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #ffffff;
                    }
                    .single-label {
                        border: 2px dashed #64748b;
                        border-radius: 12px;
                        padding: 24px;
                        text-align: center;
                        max-width: 320px;
                        box-sizing: border-box;
                    }
                    .brand { font-size: 10px; font-weight: 900; color: #475569; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
                    .name { font-size: 15px; font-weight: 800; color: #0f172a; margin: 10px 0 4px 0; }
                    .code { font-family: monospace; font-size: 12px; font-weight: 700; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; }
                    .meta { font-size: 10px; color: #64748b; margin-top: 6px; }
                </style>
            </head>
            <body>
                <div class="single-label">
                    <div class="brand">BRIGHT STAGE</div>
                    ${printableSingle.querySelector('.qr-box-inner')?.innerHTML || ''}
                    <div class="name">${activeTab === 'inventory' ? selectedItem.name : selectedItem.eventName}</div>
                    <div class="code">${activeTab === 'inventory' ? (selectedItem.barcode || selectedItem._id) : `PROJET: ${selectedItem.status || 'Actif'}`}</div>
                    <div class="meta">${activeTab === 'inventory' ? (selectedItem.brand || 'Standard') : `Client: ${selectedItem.clientName || '-'}`}</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 300);
    };

    // Print All Labels (9 QR Codes Per A4 Page)
    const handlePrintAll = () => {
        const printableContent = document.getElementById('all-labels-printable');
        if (!printableContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.print();
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Bright Stage - Étiquettes QR (9 par page A4)</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 8mm;
                    }
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background: #ffffff;
                        color: #0f172a;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-page-9 {
                        width: 100%;
                        height: 275mm;
                        max-height: 275mm;
                        page-break-after: always;
                        break-after: page;
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        grid-template-rows: repeat(3, 1fr);
                        gap: 5mm;
                        padding: 2mm;
                        box-sizing: border-box;
                    }
                    .print-page-9:last-child {
                        page-break-after: auto;
                        break-after: auto;
                    }
                    .qr-print-card {
                        border: 1.5px dashed #94a3b8;
                        border-radius: 10px;
                        padding: 8px 6px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-between;
                        text-align: center;
                        background: #ffffff;
                        height: 100%;
                        box-sizing: border-box;
                        overflow: hidden;
                    }
                    .qr-print-header {
                        width: 100%;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 8px;
                        font-weight: 800;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 3px;
                        margin-bottom: 3px;
                    }
                    .qr-svg-wrapper {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 2px 0;
                    }
                    .qr-svg-wrapper svg {
                        width: 100px !important;
                        height: 100px !important;
                    }
                    .qr-print-footer {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 2px;
                    }
                    .qr-item-name {
                        font-size: 11px;
                        font-weight: 800;
                        color: #0f172a;
                        line-height: 1.2;
                        max-height: 26px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                    }
                    .qr-item-code {
                        font-family: monospace;
                        font-size: 9px;
                        font-weight: 700;
                        background: #f1f5f9;
                        color: #334155;
                        padding: 2px 6px;
                        border-radius: 4px;
                        border: 1px solid #e2e8f0;
                        max-width: 95%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .qr-item-meta {
                        font-size: 8.5px;
                        color: #64748b;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                ${printableContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 350);
    };

    return (
        <div className="qr-screen-container">
            {/* Header Section */}
            <div className="qr-header">
                <div>
                    <div className="qr-title-group">
                        <div className="qr-icon-badge">
                            <QrCode size={28} />
                        </div>
                        <h1 className="qr-page-title">QR Code Management</h1>
                    </div>
                    <p className="qr-page-subtitle">
                        Génération et impression des étiquettes QR par feuille A4 (9 étiquettes par page)
                    </p>
                </div>

                {/* Top Action Buttons */}
                <div className="qr-header-actions">
                    <button
                        className="qr-btn-preview"
                        onClick={() => {
                            setPreviewPageIndex(0);
                            setShowPreviewModal(true);
                        }}
                        disabled={filteredList.length === 0}
                    >
                        <Eye size={16} />
                        <span>Aperçu (9 / page)</span>
                    </button>

                    <button
                        className="qr-btn-print-all"
                        onClick={handlePrintAll}
                        disabled={filteredList.length === 0}
                        title="Imprimer toutes les étiquettes avec 9 codes QR par feuille A4"
                    >
                        <Printer size={18} />
                        <span> Print all Label ({filteredList.length})</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="qr-tabs-bar">
                {!isSiteManager && (
                    <button
                        onClick={() => { setActiveTab('inventory'); setSelectedItem(null); setPreviewPageIndex(0); }}
                        className={`qr-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                    >
                        <Box size={16} />
                        <span>Inventory ({inventory.length})</span>
                    </button>
                )}
                <button
                    onClick={() => { setActiveTab('projects'); setSelectedItem(null); setPreviewPageIndex(0); }}
                    className={`qr-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
                >
                    <Calendar size={16} />
                    <span>Projects ({projects.length})</span>
                </button>
            </div>

            {/* Main Split Layout */}
            <div className="qr-split-layout">
                {/* Left Panel: Filter & List */}
                <div className="qr-list-panel">
                    <div className="qr-search-box">
                        <Search className="qr-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder={`Rechercher dans ${activeTab}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="qr-search-input"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>
                            {filteredList.length} résultat(s) trouvé(s)
                        </span>
                        <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '700', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                            {pages.length} page(s) A4 (9/page)
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#818cf8' }}>
                            Chargement des données...
                        </div>
                    ) : filteredList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                            Aucun élément trouvé.
                        </div>
                    ) : (
                        <div className="qr-items-scroll">
                            {filteredList.map(item => {
                                const isSelected = selectedItem?._id === item._id;
                                return (
                                    <div
                                        key={item._id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`qr-item-row ${isSelected ? 'selected' : ''}`}
                                    >
                                        <div>
                                            <div className="qr-row-title">
                                                {activeTab === 'inventory' ? item.name : item.eventName}
                                            </div>
                                            <div className="qr-row-sub">
                                                {activeTab === 'inventory' ? (
                                                    <>
                                                        <span>{item.barcode || 'Sans Code'}</span>
                                                        {item.category && <span>• {item.category}</span>}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{item.clientName || 'Client N/A'}</span>
                                                        <span>• {item.status || 'Draft'}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <QrCode size={18} style={{ opacity: isSelected ? 1 : 0.4, color: isSelected ? '#6366f1' : '#fff' }} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Panel: Live Single Preview */}
                <div className="qr-preview-panel">
                    {selectedItem ? (
                        <>
                            <div id="printable-qr" className="qr-preview-card">
                                <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px', color: '#6366f1', textTransform: 'uppercase', marginBottom: '14px' }}>
                                    BRIGHT STAGE • {activeTab === 'inventory' ? (selectedItem.category || 'MATÉRIEL') : 'PROJET'}
                                </div>
                                <div className="qr-box-inner" style={{ padding: '12px', background: '#fff', borderRadius: '12px', display: 'inline-block' }}>
                                    <QRCode value={getQRValue(selectedItem)} size={220} />
                                </div>
                                <h3 style={{ margin: '16px 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                                    {activeTab === 'inventory' ? selectedItem.name : selectedItem.eventName}
                                </h3>
                                <div>
                                    <span className="qr-card-barcode-badge">
                                        {activeTab === 'inventory' ? (selectedItem.barcode || selectedItem._id) : `REF: ${selectedItem._id.slice(-8)}`}
                                    </span>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '12px', margin: '8px 0 0 0', fontWeight: '600' }}>
                                    {activeTab === 'inventory'
                                        ? `${selectedItem.brand || 'Générique'} • ${selectedItem.model || 'Standard'}`
                                        : `Client: ${selectedItem.clientName || 'N/A'}`
                                    }
                                </p>
                            </div>

                            <button
                                onClick={handlePrintSingle}
                                className="qr-single-print-btn"
                            >
                                <Printer size={18} />
                                <span>Imprimer cette étiquette</span>
                            </button>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#64748b' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                                <QrCode size={32} opacity={0.4} />
                            </div>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>
                                Sélectionnez {activeTab === 'inventory' ? 'un matériel' : 'un projet'} pour visualiser son QR Code
                            </p>
                            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#475569' }}>
                                Ou cliquez directement sur <strong>"Print all Label"</strong> en haut pour imprimer toutes les étiquettes (9 par page A4).
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PREVIEW MODAL (A4 Sheets of 9 QR Codes) ── */}
            {showPreviewModal && (
                <div className="qr-modal-backdrop" onClick={() => setShowPreviewModal(false)}>
                    <div className="qr-modal-window" onClick={e => e.stopPropagation()}>
                        <div className="qr-modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                                    Aperçu des feuilles d'impression (9 QR codes / page A4)
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                                    Page {previewPageIndex + 1} sur {pages.length} • {filteredList.length} étiquettes au total
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    className="qr-btn-print-all"
                                    onClick={() => {
                                        setShowPreviewModal(false);
                                        handlePrintAll();
                                    }}
                                    style={{ padding: '8px 18px', fontSize: '13px' }}
                                >
                                    <Printer size={16} />
                                    <span>Lancer l'impression</span>
                                </button>
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Page Selector */}
                        {pages.length > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '12px', background: 'rgba(30, 41, 59, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <button
                                    onClick={() => setPreviewPageIndex(p => Math.max(0, p - 1))}
                                    disabled={previewPageIndex === 0}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>
                                    Feuille A4 {previewPageIndex + 1} / {pages.length} ({pages[previewPageIndex]?.length || 0} étiquettes)
                                </span>
                                <button
                                    onClick={() => setPreviewPageIndex(p => Math.min(pages.length - 1, p + 1))}
                                    disabled={previewPageIndex === pages.length - 1}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                        <div className="qr-modal-body">
                            {pages[previewPageIndex] && (
                                <div className="qr-sheet-preview">
                                    {pages[previewPageIndex].map(item => (
                                        <div key={item._id} className="qr-mini-card">
                                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: '800', color: '#64748b' }}>
                                                <span>BRIGHT STAGE</span>
                                                <span>{activeTab === 'inventory' ? (item.category || 'MAT') : 'PROJ'}</span>
                                            </div>
                                            <div style={{ margin: '4px 0' }}>
                                                <QRCode value={getQRValue(item)} size={90} />
                                            </div>
                                            <div style={{ width: '100%' }}>
                                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {activeTab === 'inventory' ? item.name : item.eventName}
                                                </div>
                                                <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#475569' }}>
                                                    {activeTab === 'inventory' ? (item.barcode || item._id.slice(-8)) : `REF: ${item._id.slice(-8)}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── HIDDEN PRINTABLE CONTAINER FOR 9 LABELS PER A4 SHEET ── */}
            <div id="all-labels-printable" className="print-only-sheet-container">
                {pages.map((chunk, pageIdx) => (
                    <div key={pageIdx} className="print-page-9">
                        {chunk.map(item => (
                            <div key={item._id} className="qr-print-card">
                                <div className="qr-print-header">
                                    <span>BRIGHT STAGE</span>
                                    <span>{activeTab === 'inventory' ? (item.category || 'MATÉRIEL') : 'PROJET'}</span>
                                </div>
                                <div className="qr-svg-wrapper">
                                    <QRCode value={getQRValue(item)} size={100} />
                                </div>
                                <div className="qr-print-footer">
                                    <div className="qr-item-name">
                                        {activeTab === 'inventory' ? item.name : item.eventName}
                                    </div>
                                    <div className="qr-item-code">
                                        {activeTab === 'inventory' ? (item.barcode || item._id) : `REF: ${item._id.slice(-8)}`}
                                    </div>
                                    <div className="qr-item-meta">
                                        {activeTab === 'inventory'
                                            ? `${item.brand || ''} ${item.storageLocation?.zone ? '• ' + item.storageLocation.zone + '/' + (item.storageLocation.shelving || '') : ''}`
                                            : `Client: ${item.clientName || 'N/A'}`
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QRCodeScreen;
