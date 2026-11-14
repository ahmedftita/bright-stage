import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Search, ChevronDown, Check, X, Building2, Navigation } from 'lucide-react';
import tunisiaRegions from '../data/tunisia_regions.json';
import './TunisiaLocationSelector.css';

// Text normalizer to match both Arabic (with/without hamza) and Latin
const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '');
};

const TunisiaLocationSelector = ({ value = '', onChange }) => {
    const [selectedState, setSelectedState] = useState(null);
    const [selectedDelegation, setSelectedDelegation] = useState(null);
    const [extraDetails, setExtraDetails] = useState('');

    const [isStateOpen, setIsStateOpen] = useState(false);
    const [isDelegationOpen, setIsDelegationOpen] = useState(false);

    const [stateSearch, setStateSearch] = useState('');
    const [delegationSearch, setDelegationSearch] = useState('');

    const stateDropdownRef = useRef(null);
    const delegationDropdownRef = useRef(null);
    const stateSearchInputRef = useRef(null);
    const delegationSearchInputRef = useRef(null);
    const isInitialMount = useRef(true);

    // Parse and synchronize value when passed or updated (e.g. loading existing note on edit)
    useEffect(() => {
        if (!value) {
            setSelectedState(null);
            setSelectedDelegation(null);
            setExtraDetails('');
            return;
        }

        // Avoid re-parsing if value matches current combined state
        let currentCombined = '';
        if (selectedState && selectedDelegation) {
            currentCombined = `${selectedState.name} - ${selectedDelegation.name}`;
            if (extraDetails.trim()) currentCombined += ` (${extraDetails.trim()})`;
        } else if (selectedState) {
            currentCombined = `${selectedState.name}`;
            if (extraDetails.trim()) currentCombined += ` (${extraDetails.trim()})`;
        } else if (extraDetails.trim()) {
            currentCombined = extraDetails.trim();
        }

        if (currentCombined && normalizeText(value) === normalizeText(currentCombined)) {
            return;
        }

        const normalizedVal = normalizeText(value);
        let foundState = null;
        let foundDelegation = null;

        // Search for state first
        for (const s of tunisiaRegions) {
            const sName = normalizeText(s.name);
            const sNameAr = normalizeText(s.nameAr);
            const sVal = normalizeText(s.value);
            if (
                (sName && normalizedVal.includes(sName)) || 
                (sNameAr && normalizedVal.includes(sNameAr)) ||
                (sVal && normalizedVal.includes(sVal))
            ) {
                foundState = s;
                // Search for delegation within this state
                for (const d of s.delegations) {
                    const dName = normalizeText(d.name);
                    const dNameAr = normalizeText(d.nameAr);
                    const dVal = normalizeText(d.value);
                    if (
                        (dName && normalizedVal.includes(dName)) || 
                        (dNameAr && normalizedVal.includes(dNameAr)) ||
                        (dVal && normalizedVal.includes(dVal))
                    ) {
                        foundDelegation = d;
                        break;
                    }
                }
                break;
            }
        }

        // If state was not detected directly, search by delegation across all states
        if (!foundState) {
            for (const s of tunisiaRegions) {
                for (const d of s.delegations) {
                    const dName = normalizeText(d.name);
                    const dNameAr = normalizeText(d.nameAr);
                    if (
                        (dName && normalizedVal.includes(dName)) || 
                        (dNameAr && normalizedVal.includes(dNameAr))
                    ) {
                        foundState = s;
                        foundDelegation = d;
                        break;
                    }
                }
                if (foundState) break;
            }
        }

        if (foundState) {
            setSelectedState(foundState);
            setSelectedDelegation(foundDelegation || null);

            // Extract any extra details in parentheses if any
            const matchDetails = value.match(/\((.*?)\)/);
            if (matchDetails && matchDetails[1]) {
                const inner = matchDetails[1].trim();
                const innerNorm = normalizeText(inner);
                if (
                    normalizeText(foundState.nameAr) !== innerNorm &&
                    (!foundDelegation || normalizeText(foundDelegation.nameAr) !== innerNorm)
                ) {
                    setExtraDetails(inner);
                }
            }
        } else if (value.trim()) {
            setExtraDetails(value.trim());
        }
    }, [value]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target)) {
                setIsStateOpen(false);
            }
            if (delegationDropdownRef.current && !delegationDropdownRef.current.contains(e.target)) {
                setIsDelegationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isStateOpen && stateSearchInputRef.current) {
            stateSearchInputRef.current.focus();
        }
    }, [isStateOpen]);

    useEffect(() => {
        if (isDelegationOpen && delegationSearchInputRef.current) {
            delegationSearchInputRef.current.focus();
        }
    }, [isDelegationOpen]);

    // Sync address string with parent whenever selection changes
    const updateAddress = (state, delegation, details) => {
        let formatted = '';
        if (state && delegation) {
            formatted = `${state.name} - ${delegation.name}`;
            if (details.trim()) {
                formatted += ` (${details.trim()})`;
            }
        } else if (state) {
            formatted = `${state.name}`;
            if (details.trim()) {
                formatted += ` (${details.trim()})`;
            }
        } else if (details.trim()) {
            formatted = details.trim();
        }

        if (onChange) {
            onChange(formatted);
        }
    };

    // Filter states list
    const filteredStates = useMemo(() => {
        if (!stateSearch.trim()) return tunisiaRegions;
        const q = normalizeText(stateSearch);
        return tunisiaRegions.filter(s => 
            normalizeText(s.name).includes(q) || 
            normalizeText(s.nameAr).includes(q) ||
            normalizeText(s.value).includes(q)
        );
    }, [stateSearch]);

    // Filter delegations list
    const filteredDelegations = useMemo(() => {
        if (!selectedState) return [];
        if (!delegationSearch.trim()) return selectedState.delegations;
        const q = normalizeText(delegationSearch);
        return selectedState.delegations.filter(d => 
            normalizeText(d.name).includes(q) || 
            normalizeText(d.nameAr).includes(q) ||
            normalizeText(d.value).includes(q)
        );
    }, [selectedState, delegationSearch]);

    const handleSelectState = (state) => {
        setSelectedState(state);
        setSelectedDelegation(null); // Reset delegation when state changes
        setIsStateOpen(false);
        setStateSearch('');
        updateAddress(state, null, extraDetails);

        // Auto-open delegation dropdown for seamless user experience
        setTimeout(() => {
            setIsDelegationOpen(true);
        }, 150);
    };

    const handleClearState = (e) => {
        e.stopPropagation();
        setSelectedState(null);
        setSelectedDelegation(null);
        setIsStateOpen(false);
        setIsDelegationOpen(false);
        updateAddress(null, null, extraDetails);
    };

    const handleSelectDelegation = (delegation) => {
        setSelectedDelegation(delegation);
        setIsDelegationOpen(false);
        setDelegationSearch('');
        updateAddress(selectedState, delegation, extraDetails);
    };

    const handleClearDelegation = (e) => {
        e.stopPropagation();
        setSelectedDelegation(null);
        setIsDelegationOpen(false);
        updateAddress(selectedState, null, extraDetails);
    };

    const handleExtraDetailsChange = (e) => {
        const val = e.target.value;
        setExtraDetails(val);
        updateAddress(selectedState, selectedDelegation, val);
    };

    return (
        <div className="tn-location-container">
            {/* Header */}
            <div className="tn-location-header">
                <div className="tn-header-title-group">
                    <div className="tn-icon-badge">
                        <MapPin size={17} />
                    </div>
                    <div>
                        <h4 className="tn-section-title">Destination Address / Lieu de Livraison</h4>
                    </div>
                </div>
                <div className="tn-flag-pill">
                    <span>🇹🇳</span>
                    <span>24 Gouvernorats</span>
                </div>
            </div>

            {/* Selectors Grid: 1 col initially, 2 cols when state is selected */}
            <div className={`tn-selectors-grid ${selectedState ? 'two-cols' : ''}`}>
                {/* 1. STATE SELECTOR (الولاية) */}
                <div className="tn-select-wrapper" ref={stateDropdownRef}>
                    <div className="tn-field-label">
                        <span>الولاية / Gouvernorat *</span>
                        <span className="tn-field-count">{tunisiaRegions.length} ولايات</span>
                    </div>

                    <div 
                        className={`tn-select-trigger ${isStateOpen ? 'active' : ''}`}
                        onClick={() => {
                            setIsStateOpen(!isStateOpen);
                            setIsDelegationOpen(false);
                        }}
                    >
                        <div className="tn-trigger-content">
                            <Navigation size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
                            {selectedState ? (
                                <div className="tn-selected-value-display">
                                    <span className="tn-value-name">{selectedState.name}</span>
                                    <span className="tn-arabic-pill">{selectedState.nameAr}</span>
                                </div>
                            ) : (
                                <span className="tn-trigger-placeholder">
                                    Sélectionner une gouvernorat (اختر الولاية)...
                                </span>
                            )}
                        </div>

                        <div className="tn-trigger-actions">
                            {selectedState && (
                                <button 
                                    type="button" 
                                    className="tn-clear-btn" 
                                    onClick={handleClearState}
                                    title="Effacer la sélection"
                                >
                                    <X size={13} />
                                </button>
                            )}
                            <ChevronDown size={17} className={`tn-chevron-icon ${isStateOpen ? 'open' : ''}`} />
                        </div>
                    </div>

                    {/* Floating Dropdown */}
                    {isStateOpen && (
                        <div className="tn-dropdown-menu">
                            <div className="tn-search-bar">
                                <Search size={15} style={{ color: '#818cf8' }} />
                                <input
                                    ref={stateSearchInputRef}
                                    type="text"
                                    className="tn-search-input"
                                    placeholder="Rechercher par nom ou بالعربية (ex: Tunis, نابل)..."
                                    value={stateSearch}
                                    onChange={(e) => setStateSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {stateSearch && (
                                    <button 
                                        type="button" 
                                        className="tn-clear-btn" 
                                        onClick={() => setStateSearch('')}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            <div className="tn-options-list">
                                {filteredStates.map((state) => {
                                    const isSelected = selectedState?.value === state.value;
                                    return (
                                        <div
                                            key={state.value}
                                            className={`tn-option-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleSelectState(state)}
                                        >
                                            <div className="tn-option-left">
                                                {isSelected && <Check size={14} className="tn-check-icon" />}
                                                <span className="tn-option-name">{state.name}</span>
                                            </div>
                                            <div className="tn-option-right">
                                                <span className="tn-option-arabic">{state.nameAr}</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredStates.length === 0 && (
                                    <div className="tn-empty-options">
                                        Aucune gouvernorat trouvée pour "{stateSearch}"
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. DELEGATION SELECTOR (المعتمدية) - Displays when State is selected */}
                {selectedState && (
                    <div className="tn-select-wrapper" ref={delegationDropdownRef}>
                        <div className="tn-field-label">
                            <span>المعتمدية / Délégation *</span>
                            <span className="tn-field-count">
                                {selectedState.delegations.length} معتمديات
                            </span>
                        </div>

                        <div 
                            className={`tn-select-trigger ${isDelegationOpen ? 'active' : ''}`}
                            onClick={() => {
                                setIsDelegationOpen(!isDelegationOpen);
                                setIsStateOpen(false);
                            }}
                        >
                            <div className="tn-trigger-content">
                                <Building2 size={16} style={{ color: '#c084fc', flexShrink: 0 }} />
                                {selectedDelegation ? (
                                    <div className="tn-selected-value-display">
                                        <span className="tn-value-name">{selectedDelegation.name}</span>
                                        <span className="tn-arabic-pill">{selectedDelegation.nameAr}</span>
                                    </div>
                                ) : (
                                    <span className="tn-trigger-placeholder">
                                        Sélectionner une délégation (اختر المعتمدية)...
                                    </span>
                                )}
                            </div>

                            <div className="tn-trigger-actions">
                                {selectedDelegation && (
                                    <button 
                                        type="button" 
                                        className="tn-clear-btn" 
                                        onClick={handleClearDelegation}
                                        title="Effacer la délégation"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                                <ChevronDown size={17} className={`tn-chevron-icon ${isDelegationOpen ? 'open' : ''}`} />
                            </div>
                        </div>

                        {/* Floating Dropdown for Delegations */}
                        {isDelegationOpen && (
                            <div className="tn-dropdown-menu">
                                <div className="tn-search-bar">
                                    <Search size={15} style={{ color: '#c084fc' }} />
                                    <input
                                        ref={delegationSearchInputRef}
                                        type="text"
                                        className="tn-search-input"
                                        placeholder="Filtrer les معتمديات (ex: Marsa, سيدي ثابت)..."
                                        value={delegationSearch}
                                        onChange={(e) => setDelegationSearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {delegationSearch && (
                                        <button 
                                            type="button" 
                                            className="tn-clear-btn" 
                                            onClick={() => setDelegationSearch('')}
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                <div className="tn-options-list">
                                    {filteredDelegations.map((del) => {
                                        const isSelected = selectedDelegation?.value === del.value;
                                        return (
                                            <div
                                                key={del.value}
                                                className={`tn-option-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleSelectDelegation(del)}
                                            >
                                                <div className="tn-option-left">
                                                    {isSelected && <Check size={14} className="tn-check-icon" />}
                                                    <span className="tn-option-name">{del.name}</span>
                                                </div>
                                                <div className="tn-option-right">
                                                    <span className="tn-option-arabic">{del.nameAr}</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {filteredDelegations.length === 0 && (
                                        <div className="tn-empty-options">
                                            Aucune délégation trouvée pour "{delegationSearch}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Extra Venue / Street details row */}
            <div className="tn-extra-details-row">
                <input
                    type="text"
                    className="tn-extra-input"
                    placeholder="Précisions d'adresse / Lieu exact (ex: Salle des Fêtes, Rue Habib Bourguiba, Zone Industrielle...) [Optionnel]"
                    value={extraDetails}
                    onChange={handleExtraDetailsChange}
                />
            </div>

            {/* Address Live Preview Card */}
            {(selectedState || extraDetails) && (
                <div className="tn-address-preview">
                    <div className="tn-preview-text-group">
                        <span className="tn-preview-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} /> Destination :
                        </span>
                        <span className="tn-preview-val">
                            {selectedState ? selectedState.name : ''}
                            {selectedDelegation ? ` - ${selectedDelegation.name}` : ''}
                            {extraDetails.trim() ? ` (${extraDetails.trim()})` : ''}
                        </span>
                    </div>
                    <div className="tn-preview-badges">
                        {selectedState && (
                            <span className="tn-badge-chip">
                                {selectedState.nameAr}
                            </span>
                        )}
                        {selectedDelegation && (
                            <span className="tn-badge-chip">
                                {selectedDelegation.nameAr}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TunisiaLocationSelector;
