import React from 'react';
import './SplashScreen.css';
import { ShieldCheck, Sparkles } from 'lucide-react';

const SplashScreen = () => {
    return (
        <div className="splash-container">
            {/* Ambient Background Glows */}
            <div className="splash-ambient-glow splash-glow-primary" />
            <div className="splash-ambient-glow splash-glow-accent" />
            <div className="splash-ambient-glow splash-glow-secondary" />

            {/* Geometric Mesh Overlay */}
            <div className="splash-grid-mesh" />

            {/* Central Animated Content Card */}
            <div className="splash-content">
                {/* Logo & Orbiting Halo */}
                <div className="splash-logo-wrapper">
                    <div className="splash-orbit-ring" />
                    <div className="splash-logo-card">
                        <img 
                            src="/logo.png" 
                            alt="Bright Stage" 
                            className="splash-logo-img" 
                        />
                    </div>
                </div>

                {/* Typography Brand Title */}
                <h1 className="splash-brand-title">BRIGHT STAGE</h1>
                <p className="splash-brand-tagline">
                    Système de Gestion & Régie Événementielle
                </p>

                {/* Futuristic Shimmer Progress Track */}
                <div className="splash-progress-track">
                    <div className="splash-progress-bar" />
                </div>

                {/* Active Status Row */}
                <div className="splash-status-row">
                    <div className="splash-status-dot" />
                    <span>Chargement de l'espace de travail...</span>
                </div>

                {/* Security Verification Badge */}
                <div className="splash-security-badge">
                    <ShieldCheck size={14} color="#34d399" />
                    <span>Session Sécurisée & Authentifiée</span>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
