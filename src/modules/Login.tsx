import React, { useState } from 'react';
import type { AppUser } from '../App';

interface IProps {
    users: AppUser[];
    onLogin: (u: AppUser) => void;
}

const Login: React.FC<IProps> = ({ users, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u =>
            u.usuario.toLowerCase() === username.toLowerCase() &&
            (u.password === password || !u.password) // Allow old users without pass for now, or enforce it
        );

        if (user) {
            onLogin(user);
        } else {
            setError('Usuario o contraseña incorrectos.');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card animate-scale-in">
                <div className="login-logo">
                    <span className="logo-emoji">🚀</span>
                    <h1>CRM Appenvios</h1>
                    <p>Gestión de Logística y Ventas</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Usuario</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Ingrese su usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Ingrese su contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="btn-login">
                        Iniciar Sesión
                    </button>
                </form>

                <div className="login-footer">
                    <p>&copy; {new Date().getFullYear()} Help Soluciones Informáticas</p>
                </div>
            </div>

            <style>{`
                .login-wrapper {
                    height: 100vh;
                    width: 100vw;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    font-family: 'Inter', sans-serif;
                }

                .login-card {
                    background: white;
                    padding: 3rem;
                    border-radius: 20px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    width: 100%;
                    max-width: 450px;
                }

                .login-logo {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }

                .logo-emoji {
                    font-size: 3.5rem;
                    display: block;
                    margin-bottom: 1rem;
                }

                .login-logo h1 {
                    color: #1e3a8a;
                    font-size: 1.75rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }

                .login-logo p {
                    color: #64748b;
                    font-size: 0.9rem;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .login-error {
                    background: #fee2e2;
                    color: #991b1b;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    text-align: center;
                    border: 1px solid #fecaca;
                }

                .btn-login {
                    background: #2563eb;
                    color: white;
                    padding: 1rem;
                    border-radius: 12px;
                    border: none;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
                }

                .btn-login:hover {
                    background: #1d4ed8;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
                }

                .btn-login:active {
                    transform: translateY(0);
                }

                .login-footer {
                    margin-top: 2.5rem;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.8rem;
                }

                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Login;
