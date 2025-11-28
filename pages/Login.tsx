import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { Shield, Eye, EyeOff } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-slide-down">
        <div className="flex justify-center text-primary-600 animate-bounce">
          <div className="p-4 bg-white rounded-full shadow-lg">
            <Shield size={48} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
          OE-SESCINC Med+ Group
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Sistema de Gestão de Ensino
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-scale-in">
        <div className="card-premium py-8 px-4 sm:px-10 backdrop-blur-sm bg-white/95">
          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                  className="input-premium appearance-none block w-full px-3 py-2 rounded-md shadow-sm placeholder-gray-400 sm:text-sm bg-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
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
                  className="input-premium appearance-none block w-full px-3 py-2 rounded-md shadow-sm placeholder-gray-400 sm:text-sm bg-white text-gray-900 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-slide-down text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200 shadow-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="btn-premium w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                Entrar no Sistema
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Versão 2.0 • Desenvolvido com ❤️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};