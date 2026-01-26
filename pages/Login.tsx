import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { Flame, Eye, EyeOff, Shield } from 'lucide-react';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const { login, users, seedDatabase } = useStore();
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
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fire Sparks - Preserved Animation */}
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

      {/* Fire Bottom Glow - Preserved Animation */}
      <div className="fire-bottom-glow"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-slide-down flex flex-col items-center">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-1 login-uppercase" style={{ color: '#1F2937' }}>
            OE-SESCINC
          </h1>
          <div className="flex justify-end">
            <p className="text-2xl font-bold login-uppercase" style={{ color: '#FF6B35' }}>
              Med+ Group
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-scale-in">
        <div className="bg-white/70 backdrop-blur-md py-8 px-4 sm:px-10 rounded-2xl shadow-2xl border border-gray-100 relative overflow-hidden">
          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1 login-uppercase" style={{ color: '#1F2937' }}>
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
                  className="appearance-none block w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 sm:text-sm"
                  style={{
                    border: '2px solid #E5E7EB',
                    color: '#1F2937',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '2px solid #FF6B35';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '2px solid #E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-semibold login-uppercase" style={{ color: '#1F2937' }}>
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium transition-colors login-uppercase"
                  style={{ color: '#FF6B35' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#E55A2B'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FF6B35'}
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
                  className="appearance-none block w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 sm:text-sm pr-10 no-uppercase"
                  style={{
                    border: '2px solid #E5E7EB',
                    color: '#1F2937',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '2px solid #FF6B35';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '2px solid #E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 cursor-pointer transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FF6B35'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-slide-down flex items-center gap-2 text-sm p-4 rounded-xl border" style={{
                color: '#DC2626',
                backgroundColor: '#FEF2F2',
                borderColor: '#FECACA'
              }}>
                <Shield size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="btn-premium-shimmer w-full flex justify-center py-3.5 px-4 border-0 rounded-xl shadow-lg text-sm font-bold text-white transform transition-all duration-200 login-uppercase"
                style={{
                  background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
                  boxShadow: '0 10px 25px -5px rgba(255, 107, 53, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #E55A2B 0%, #E5743D 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(255, 107, 53, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(255, 107, 53, 0.3)';
                }}
              >
                Entrar no Sistema
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: '#F3F4F6' }}>
            <p className="text-xs font-medium login-uppercase" style={{ color: '#9CA3AF' }}>
              Versão 2.0 • Desenvolvido por <span style={{ color: '#FF6B35', fontWeight: 'bold' }}>Manifold IA</span>
            </p>
            <button
              onClick={() => {
                if (confirm('Isso irá restaurar os dados iniciais do sistema. Continuar?')) {
                  seedDatabase();
                  alert('Banco de dados restaurado! Tente fazer login novamente.');
                }
              }}
              className="mt-4 text-[10px] transition-colors login-uppercase"
              style={{ color: '#D1D5DB' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF6B35'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
            >
              Restaurar Banco de Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};