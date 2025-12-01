import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { Flame, Eye, EyeOff, Shield } from 'lucide-react';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const { login, users } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const attemptLogin = (emailToUse: string, passwordToUse: string) => {
    // In a real app with Supabase Auth, we would validate password here against DB
    // For this hybrid setup, we check if user exists in the fetched list
    const user = users.find(u => u.email === emailToUse);

    if (user) {
      if (user.password && user.password !== passwordToUse) {
        setError("Senha incorreta.");
        return;
      }
      login(emailToUse);
    } else {
      setError(`Usuário não encontrado.`);
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100 via-gray-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Futuristic Floating Particles */}
      {/* Fire Sparks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        <div className="bg-white p-4 rounded-full shadow-lg mb-6 ring-4 ring-orange-100 animate-pulse-slow">
          <Flame size={48} className="text-orange-600 fill-orange-500" />
        </div>
        <h2 className="text-center text-4xl font-extrabold text-gray-900 tracking-tight">
          OE-SESCINC <span className="text-primary-600">Med+ Group</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Sistema de Gestão de Ensino
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-scale-in">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 sm:px-10 rounded-2xl shadow-2xl border border-white/50 relative overflow-hidden">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-orange-400 to-primary-600"></div>

          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Endereço de E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 sm:text-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              </div>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 sm:text-sm pr-10 no-uppercase"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-600 cursor-pointer transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-slide-down flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">
                <Shield size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-500/30 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-orange-500 hover:from-primary-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Entrar no Sistema
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-medium">
              Versão 2.0 • Desenvolvido por <span className="text-primary-600 font-bold">Manifold IA</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};