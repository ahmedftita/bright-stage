import React, { useState } from 'react';
import { Layers, Grid, Plus, Minus, Calculator, Box } from 'lucide-react';
import { useDialog } from '../context/ConfirmContext';
import './StageConfigurator.css';

const StageConfigurator = () => {
    const { showAlert } = useDialog();
    // 1. Dimensions (Modules)
    const [length, setLength] = useState(6); // L
    const [width, setWidth] = useState(4);   // W

    const [results, setResults] = useState(null);

    const numL = Math.max(1, parseInt(length) || 1);
    const numW = Math.max(1, parseInt(width) || 1);

    // 2. Calculation Logic
    const handleCalculate = () => {
        const L = parseInt(length) || 0;
        const W = parseInt(width) || 0;

        // Surface totale : L * W * 1.4884
        // Stage plaques : L * W
        const decks = L * W;

        // Stage pieds : (L + 1) * (W + 1)
        const legs = (L + 1) * (W + 1);

        // Stage côtés : L * (W + 1) + W * (L + 1)
        const sides = (L * (W + 1)) + (W * (L + 1));

        setResults([
            {
                name: "Stage plaque (Plateau)",
                spec: "Cadre aluminium + contreplaqué marin antidérapant (épaisseur 18 mm)",
                qty: decks
            },
            {
                name: "Stage pied (Poteau + vérin)",
                spec: "Tube Ø 50 mm × épaisseur 3 mm avec base filetée réglable",
                qty: legs
            },
            {
                name: "Stage côté (Cadre latéral)",
                spec: "Traverses Ø 50 mm × 2 mm + renforts diagonaux Ø 25 mm × 2 mm",
                qty: sides
            }
        ]);
    };

    // 3. Simulation of "Add to List"
    const handleAddToList = () => {
        if (!results) return;
        showAlert({
            title: "Matériel Assigné au Projet",
            message: "Le matériel a été ajouté à la liste d'assignation :\n\n" + results.map(r => `• ${r.qty}x ${r.name}`).join('\n'),
            type: "success"
        });
    };

    return (
        <div className="stage-calc-container">
            {/* Header */}
            <div className="stage-calc-header">
                <div className="stage-header-left">
                    <div className="stage-header-icon">
                        <Layers size={24} />
                    </div>
                    <div className="stage-header-title-group">
                        <h1>Calculateur de Scène</h1>
                        <p className="stage-header-subtext">
                            Calcul automatique des praticables, pieds et profilés de fixation
                        </p>
                    </div>
                </div>
                <div className="stage-standard-badge">
                    <span>Module standard : 1.22 × 1.22 m</span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="stage-main-grid">
                {/* Control Panel: Dimensions */}
                <div className="stage-card">
                    <div className="stage-card-header">
                        <div className="stage-card-title">
                            <span className="stage-accent-bar" />
                            <Grid size={18} style={{ color: '#818cf8' }} />
                            <span>Dimensions</span>
                        </div>
                    </div>

                    {/* Longueur (L) */}
                    <div className="stage-form-group">
                        <label className="stage-field-label">
                            <span>Longueur (L) - en modules</span>
                            <span className="stage-field-conversion">
                                {(numL * 1.22).toFixed(2)} m
                            </span>
                        </label>
                        <div className="stage-stepper-wrapper">
                            <button
                                type="button"
                                className="stage-step-btn"
                                onClick={() => setLength(prev => Math.max(1, (parseInt(prev) || 1) - 1))}
                                disabled={numL <= 1}
                                title="Diminuer"
                            >
                                <Minus size={15} />
                            </button>
                            <input
                                type="number"
                                className="stage-number-input"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                                min="1"
                            />
                            <button
                                type="button"
                                className="stage-step-btn"
                                onClick={() => setLength(prev => (parseInt(prev) || 0) + 1)}
                                title="Augmenter"
                            >
                                <Plus size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Largeur (W) */}
                    <div className="stage-form-group">
                        <label className="stage-field-label">
                            <span>Largeur (W) - en modules</span>
                            <span className="stage-field-conversion">
                                {(numW * 1.22).toFixed(2)} m
                            </span>
                        </label>
                        <div className="stage-stepper-wrapper">
                            <button
                                type="button"
                                className="stage-step-btn"
                                onClick={() => setWidth(prev => Math.max(1, (parseInt(prev) || 1) - 1))}
                                disabled={numW <= 1}
                                title="Diminuer"
                            >
                                <Minus size={15} />
                            </button>
                            <input
                                type="number"
                                className="stage-number-input"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                                min="1"
                            />
                            <button
                                type="button"
                                className="stage-step-btn"
                                onClick={() => setWidth(prev => (parseInt(prev) || 0) + 1)}
                                title="Augmenter"
                            >
                                <Plus size={15} />
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCalculate}
                        className="stage-calc-btn"
                    >
                        <Calculator size={18} />
                        <span>Calculer</span>
                    </button>
                </div>

                {/* Results Panel */}
                <div className="stage-card">
                    <div className="stage-card-header">
                        <div className="stage-card-title">
                            <span className="stage-accent-bar" />
                            <span>Résultats</span>
                        </div>
                        {results && (
                            <span className="stage-summary-pill">
                                {numL * numW} modules • {(numL * numW * 1.4884).toFixed(1)} m²
                            </span>
                        )}
                    </div>

                    {!results ? (
                        <div className="stage-empty-state">
                            <div className="stage-empty-icon">
                                <Calculator size={24} />
                            </div>
                            <p className="stage-empty-title">
                                Entrez les dimensions et cliquez sur "Calculer"
                            </p>
                            <p className="stage-empty-hint">
                                Le détail des éléments requis et l'aperçu du podium apparaîtront ici.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Visual Grid Preview */}
                            <div className="stage-visual-box">
                                <div className="stage-visual-header">
                                    <span>Aperçu d'implantation ({numL} × {numW} modules)</span>
                                    <span>{(numL * 1.22).toFixed(2)} m × {(numW * 1.22).toFixed(2)} m</span>
                                </div>
                                <div className="stage-grid-wrapper">
                                    <div
                                        className="stage-deck-grid"
                                        style={{
                                            gridTemplateColumns: `repeat(${numL}, minmax(18px, 32px))`
                                        }}
                                    >
                                        {Array.from({ length: Math.min(numL * numW, 240) }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="stage-deck-tile"
                                                title={`Module #${i + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Result Items List */}
                            <div className="stage-results-list">
                                {results.map((item, idx) => (
                                    <div key={idx} className="stage-result-row">
                                        <div className="stage-result-info">
                                            <div className="stage-result-icon-box">
                                                {idx === 0 ? <Layers size={18} /> : idx === 1 ? <Box size={18} /> : <Grid size={18} />}
                                            </div>
                                            <div>
                                                <div className="stage-result-name">{item.name}</div>
                                                <div className="stage-result-desc">
                                                    {item.spec}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="stage-result-qty-badge">
                                            <span className="stage-result-qty-number">{item.qty}</span>
                                            <span className="stage-result-qty-unit">unités</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddToList}
                                className="stage-add-btn"
                            >
                                <Plus size={18} />
                                <span>Ajouter à la liste</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StageConfigurator;
