import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { AppUser } from '../App';
import { logoBase64 } from '../assets/logoBase64';
import { supabase } from '../lib/supabaseClient';

interface IProps {
    users: AppUser[]; // solo se usa en modo demo
    onLogin: (u: AppUser) => void;
}

const MODULOS = ['Cotizaciones', 'Logística', 'Facturación', 'Cartera', 'Informes'];

const Login: React.FC<IProps> = ({ users, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (import.meta.env.VITE_DEMO_MODE === 'true') {
            const demoUser = users.find(u => u.usuario.toLowerCase() === username.trim().toLowerCase());
            if (demoUser) onLogin(demoUser); else setError('Usuario o contraseña incorrectos.');
            return;
        }

        // La contraseña se valida en el servidor (función hs_login); el navegador nunca la recibe
        setLoading(true);
        const { data, error: rpcError } = await supabase.rpc('hs_login', { p_usuario: username.trim(), p_password: password });
        setLoading(false);

        if (rpcError) {
            setError('No se pudo conectar con el servidor. Intente de nuevo.');
            console.error('hs_login:', rpcError);
        } else if (data) {
            onLogin(data as AppUser);
        } else {
            setError('Usuario o contraseña incorrectos.');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-brand">
                <div className="login-brand-top">
                    <div className="login-plate"><img src={logoBase64} alt="Help Soluciones" /></div>
                    <div>
                        <div className="login-brand-name">HelpiCRM</div>
                        <div className="login-brand-sub">Help Soluciones Informáticas</div>
                    </div>
                </div>
                <div>
                    <blockquote>"Cada cotización, despacho y factura en un solo lugar."</blockquote>
                    <div className="login-chips">
                        {MODULOS.map(m => <span key={m}>{m}</span>)}
                    </div>
                </div>
                <p className="login-copy">&copy; {new Date().getFullYear()} Help Soluciones Informáticas HSI SAS</p>
            </div>

            <div className="login-panel">
                <div className="login-card animate-fade-in">
                    <div className="login-mobile-logo"><img src={logoBase64} alt="Help Soluciones" /></div>
                    <h1>Iniciar sesión</h1>
                    <p className="login-lead">Ingresa tus credenciales para continuar</p>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <label className="login-field">
                            <span>Usuario</span>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Tu usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </label>

                        <label className="login-field">
                            <span>Contraseña</span>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="input-field"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    style={{ paddingRight: '2.5rem' }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="login-eye"
                                    onClick={() => setShowPass(!showPass)}
                                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </label>

                        {error && <div className="login-error"><AlertCircle size={15} />{error}</div>}

                        <button type="submit" className="btn-login" disabled={loading}>{loading ? 'Verificando...' : 'Ingresar'}</button>
                        <p className="login-hint">¿No tienes cuenta? Solicítala al administrador.</p>
                    </form>
                </div>
            </div>

            <style>{`
                .login-wrapper { min-height: 100vh; display: flex; background: var(--background-light); }

                .login-brand {
                    width: 50%; padding: 3rem;
                    display: flex; flex-direction: column; justify-content: space-between;
                    background: var(--navy-900); color: white;
                }
                .login-brand-top { display: flex; align-items: center; gap: 0.85rem; }
                .login-plate { width: 52px; height: 52px; background: white; border-radius: 12px; overflow: hidden; display: grid; place-items: center; }
                .login-plate img { width: 50px; height: 50px; object-fit: cover; object-position: top; }
                .login-brand-name { font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; }
                .login-brand-sub { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
                .login-brand blockquote { font-size: 1.6rem; font-weight: 300; line-height: 1.45; color: rgba(255,255,255,0.88); margin-bottom: 1.5rem; max-width: 30rem; }
                .login-chips { display: flex; flex-wrap: wrap; gap: 0.6rem; }
                .login-chips span { padding: 0.35rem 0.8rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.72); }
                .login-copy { font-size: 0.75rem; color: rgba(255,255,255,0.4); }

                .login-panel { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; }
                .login-card { width: 100%; max-width: 360px; }
                .login-card h1 { font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem; }
                .login-lead { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 2rem; }
                .login-mobile-logo { display: none; }

                .login-form { display: flex; flex-direction: column; gap: 1rem; }
                .login-field { display: flex; flex-direction: column; gap: 0.4rem; }
                .login-field > span { font-size: 0.85rem; font-weight: 500; color: var(--text-main); }
                .login-eye { position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%); background: none; color: var(--text-muted); padding: 4px; }
                .login-eye:hover { background: none; color: var(--primary-blue); }

                .login-error { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0.8rem; border-radius: var(--radius-sm); font-size: 0.85rem; background: #FFF5F5; color: #B91C1C; }
                .btn-login { width: 100%; padding: 0.7rem; margin-top: 0.5rem; font-size: 0.9rem; }
                .login-hint { text-align: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.75rem; }

                @media (max-width: 900px) {
                    .login-brand { display: none; }
                    .login-mobile-logo { display: block; margin-bottom: 1.5rem; }
                    .login-mobile-logo img { width: 96px; border-radius: 12px; }
                }
            `}</style>
        </div>
    );
};

export default Login;
