import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { Flame, Eye, EyeOff, Shield } from 'lucide-react';
import '../login-effects.css'; // Import the new effects
import '../button-standards.css';

export const Login: React.FC = () => {
  const { login, seedDatabase } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const attemptLogin = (emailToUse: string, passwordToUse: string) => {
    // Validation logic would go here
    try {
      login(emailToUse);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    attemptLogin(email, password);
  };

  const handleForgotPassword = () => {
    alert("Instruções de recuperação de senha foram enviadas para o seu e-mail.");
  };

  return (
    <div className="min-h-screen login-page-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fire Sparks Animation */}
      <div className="particles-container">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="floating-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `-${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      {/* Fire Bottom Glow */}
      <div className="fire-bottom-glow"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-slide-down flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center gap-1 mb-2">
            <h1 className="text-6xl font-black tracking-tighter text-gray-900 drop-shadow-sm uppercase">
              OE-SESCINC
            </h1>
          </div>
          <p className="text-2xl font-bold text-orange-500 uppercase tracking-widest" style={{ color: '#FF6B35' }}>
            Med+ Group
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-20 animate-scale-in">
        <div className="login-card py-8 px-4 sm:px-10 rounded-2xl shadow-2xl relative overflow-hidden">
          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase mb-1">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input appearance-none block w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 sm:text-sm"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input appearance-none block w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 sm:text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-slide-down flex items-center gap-2 text-sm p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
                <Shield size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="btn-base btn-premium w-full flex justify-center py-3.5 rounded-xl text-sm shadow-xl"
              >
                Acessar Sistema
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={() => {
                if (confirm('Isso irá restaurar os dados iniciais do sistema. Continuar?')) {
                  seedDatabase();
                  alert('Banco de dados restaurado! Tente fazer login novamente.');
                }
              }}
              className="text-[10px] text-gray-400 hover:text-orange-500 transition-colors uppercase tracking-wider"
            >
              Reset Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};