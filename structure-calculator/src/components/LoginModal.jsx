import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginModal({ isOpen, onLoginSuccess }) {
  const [email, setEmail] = useState('jilani.wahi@gmail.com');
  const [password, setPassword] = useState('brightstage123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authService.login(email.trim(), password);
      if (result.success) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      setError(err.message || 'Identifiants incorrects. Vérifiez votre email et mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="login-modal-backdrop">
      <div className="login-card-container">
        {/* Header Branding */}
        <div className="login-header">
          <div className="login-logo-badge">
            <span className="logo-b">B</span>
            <span className="logo-s">S</span>
          </div>
          <h2 className="login-title">Bright Stage Pro</h2>
          <p className="login-subtitle">Calculateur de Structure Truss & Ponts Aluminium</p>
        </div>

        {/* Info Banner */}
        <div className="login-account-banner">
          <ShieldCheck size={16} className="text-emerald" />
          <span>Accès protégé par compte Bright Stage</span>
        </div>

        {error && (
          <div className="login-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field-group">
            <label className="login-field-label">Adresse Email</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                type="email"
                required
                className="login-input"
                placeholder="nom@brightstage.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field-group">
            <label className="login-field-label">Mot de Passe</label>
            <div className="login-input-wrapper">
              <Key size={16} className="login-input-icon" />
              <input
                type="password"
                required
                className="login-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Vérification du compte...</span>
            ) : (
              <>
                <span>Se Connecter</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Quick-fill */}
        <div className="login-demo-box">
          <span className="demo-box-title">Comptes Bright Stage autorisés :</span>
          <div className="demo-accounts-list">
            <button
              type="button"
              className="demo-account-pill"
              onClick={() => handleUseDemo('jilani.wahi@gmail.com', 'brightstage123')}
            >
              <span className="demo-pill-name">Jilani Wahi</span>
              <span className="demo-pill-role">Founder</span>
            </button>
            <button
              type="button"
              className="demo-account-pill"
              onClick={() => handleUseDemo('admin@brightstage.com', 'admin123')}
            >
              <span className="demo-pill-name">Admin</span>
              <span className="demo-pill-role">Manager</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
