import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import '../components/ConfirmModal.css';

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
};

export const useDialog = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useDialog must be used within a ConfirmProvider');
    }
    return {
        confirm: context.confirm,
        alert: context.showAlert,
        showAlert: context.showAlert
    };
};

export const ConfirmProvider = ({ children }) => {
    const [dialogState, setDialogState] = useState(null);

    // 1. Confirm Dialog (Yes/No - Promise<boolean>)
    const confirm = useCallback((optionsOrMessage) => {
        return new Promise((resolve) => {
            let config = {};
            if (typeof optionsOrMessage === 'string') {
                const isDangerous = /delete|supprimer|decommission|remove|permanently|revert|clear/i.test(optionsOrMessage);
                config = {
                    title: isDangerous ? 'Confirmation de Sécurité' : 'Confirmation Requise',
                    message: optionsOrMessage,
                    type: isDangerous ? 'danger' : 'confirm',
                    confirmText: isDangerous ? 'Confirmer / Supprimer' : 'Confirmer',
                    cancelText: 'Annuler'
                };
            } else {
                config = {
                    title: optionsOrMessage.title || 'Confirmation Requise',
                    message: optionsOrMessage.message || '',
                    type: optionsOrMessage.type || (optionsOrMessage.isDangerous ? 'danger' : 'confirm'),
                    confirmText: optionsOrMessage.confirmText || 'Confirmer',
                    cancelText: optionsOrMessage.cancelText || 'Annuler',
                    ...optionsOrMessage
                };
            }

            setDialogState({
                ...config,
                isConfirm: true,
                isAlert: false,
                resolve
            });
        });
    }, []);

    // 2. Alert / Announcement Dialog (OK only - Promise<void>)
    const showAlert = useCallback((optionsOrMessage) => {
        return new Promise((resolve) => {
            let config = {};
            if (typeof optionsOrMessage === 'string') {
                const isSuccess = /succès|success|enregistré|créé|complete|authorized/i.test(optionsOrMessage);
                const isError = /error|erreur|échoué|failed|invalid/i.test(optionsOrMessage);
                const isWarning = /warning|attention|limit|exceed/i.test(optionsOrMessage);

                config = {
                    title: isSuccess ? 'Opération Réussie' : isError ? 'Erreur Système' : isWarning ? 'Avertissement' : 'Notification',
                    message: optionsOrMessage,
                    type: isSuccess ? 'success' : isError ? 'danger' : isWarning ? 'warning' : 'info',
                    okText: 'Compris'
                };
            } else {
                config = {
                    title: optionsOrMessage.title || 'Notification',
                    message: optionsOrMessage.message || '',
                    type: optionsOrMessage.type || 'info',
                    okText: optionsOrMessage.okText || 'Compris',
                    ...optionsOrMessage
                };
            }

            setDialogState({
                ...config,
                isConfirm: false,
                isAlert: true,
                resolve
            });
        });
    }, []);

    // 3. Global window.alert override so no raw browser popup ever shows
    useEffect(() => {
        const originalAlert = window.alert;
        window.alert = (msg) => {
            showAlert(msg);
        };

        return () => {
            window.alert = originalAlert;
        };
    }, [showAlert]);

    const handleClose = (value) => {
        if (dialogState && dialogState.resolve) {
            dialogState.resolve(value);
        }
        setDialogState(null);
    };

    const renderIcon = () => {
        const type = dialogState?.type;
        switch (type) {
            case 'danger':
                return <XCircle size={34} />;
            case 'warning':
                return <AlertTriangle size={34} />;
            case 'success':
                return <CheckCircle2 size={34} />;
            case 'confirm':
                return <HelpCircle size={34} />;
            case 'info':
            default:
                return <AlertCircle size={34} />;
        }
    };

    return (
        <ConfirmContext.Provider value={{ confirm, showAlert }}>
            {children}

            {dialogState && (
                <div 
                    className="dialog-modal-overlay" 
                    onClick={() => {
                        // Allow clicking backdrop to close info alerts or cancel confirms
                        handleClose(dialogState.isAlert ? true : false);
                    }}
                >
                    <div 
                        className={`dialog-modal-card type-${dialogState.type || 'info'}`} 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Ambient glow */}
                        <div className="dialog-ambient-glow" />

                        {/* Icon */}
                        <div className="dialog-icon-wrapper">
                            {renderIcon()}
                        </div>

                        {/* Title */}
                        <h3 className="dialog-title">
                            {dialogState.title}
                        </h3>

                        {/* Message */}
                        <p className="dialog-message">
                            {dialogState.message}
                        </p>

                        {/* Actions */}
                        {dialogState.isAlert ? (
                            <button
                                type="button"
                                className="dialog-btn-ok"
                                onClick={() => handleClose(true)}
                                autoFocus
                            >
                                {dialogState.okText || 'Compris'}
                            </button>
                        ) : (
                            <div className="dialog-actions-row">
                                <button
                                    type="button"
                                    className="dialog-btn-cancel"
                                    onClick={() => handleClose(false)}
                                >
                                    {dialogState.cancelText || 'Annuler'}
                                </button>
                                <button
                                    type="button"
                                    className="dialog-btn-confirm"
                                    onClick={() => handleClose(true)}
                                    autoFocus
                                >
                                    {dialogState.confirmText || 'Confirmer'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};

export default ConfirmProvider;
