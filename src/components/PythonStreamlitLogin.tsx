import React, { useRef, useState } from 'react';
import {
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import ElPatronLogo from './ElPatronLogo';
import { Usuario } from '../types';
import { INITIAL_USUARIOS } from '../data/initialData';
import { canLogin, getLoginErrorMessage } from '../lib/loginAuth';
import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import {
  findDemoLoginUser,
  getConfiguredDemoCredentials,
  isDemoLoginEnabled,
} from '../lib/demoLogin';
import DiagnosticsTester from './DiagnosticsTester';


interface PythonStreamlitLoginProps {
  onLoginSuccess: (user: Usuario) => void;
  onBackToCover?: () => void;
}

const getRuntimeEnv = (): Record<string, unknown> => (
  ((import.meta as { env?: Record<string, unknown> }).env) ?? {}
);

const getDemoUsers = (): Usuario[] => {
  const configuredCredentials = getConfiguredDemoCredentials(getRuntimeEnv());
  if (!configuredCredentials) return INITIAL_USUARIOS;

  return [
    {
      ...INITIAL_USUARIOS[0],
      nombre: 'Demo',
      apellido: 'Admin',
      username: configuredCredentials.username,
      password: configuredCredentials.password,
    },
  ];
};

export default function PythonStreamlitLogin({ onLoginSuccess, onBackToCover }: PythonStreamlitLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const loginInFlightRef = useRef(false);


  const completeLogin = async (user: Usuario) => {
    const lastLogins = JSON.parse(localStorage.getItem('colores_last_logins') || '{}');
    lastLogins[user.username] = new Date().toISOString();
    localStorage.setItem('colores_last_logins', JSON.stringify(lastLogins));

    await new Promise(resolve => setTimeout(resolve, 300));
    onLoginSuccess(user);
  };

  const handleLogin = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (loginInFlightRef.current) return;

    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Ingresá usuario y contraseña.');
      return;
    }

    loginInFlightRef.current = true;
    setIsLoggingIn(true);

    try {
      const demoEnabled = isDemoLoginEnabled(getRuntimeEnv());
      const demoUser = findDemoLoginUser(getDemoUsers(), email, password, demoEnabled);

      if (demoUser) {
        if (!canLogin(demoUser)) {
          setError('Este usuario está desactivado.');
          return;
        }
        await completeLogin(demoUser);
        return;
      }

      const supabase = tryGetActiveSupabaseClient();
      if (!supabase) {
        setError(demoEnabled ? 'Usuario o contraseña incorrectos.' : 'Acceso demo desactivado. Iniciá con Supabase Auth.');
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        setError('No pudimos validar la sesión. Intentá nuevamente.');
        return;
      }

      let profile = null;
      let profileError = null;

      try {
        const { data: profileById, error: errById } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id_usuario', authData.user.id)
          .maybeSingle();

        if (profileById) {
          profile = profileById;
        } else {
          const { data: profileByEmail, error: errByEmail } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', authData.user.email)
            .maybeSingle();
          profile = profileByEmail;
          profileError = errByEmail;
        }
      } catch (err) {
        console.warn('Profile fetch error, using email fallback:', err);
      }

      if (profileError) throw profileError;

      if (!profile) {
        setError('Tu cuenta no tiene un perfil operativo asignado.');
        return;
      }

      if (!canLogin(profile as Usuario)) {
        setError('Este usuario está desactivado.');
        return;
      }

      await completeLogin(profile as Usuario);
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      loginInFlightRef.current = false;
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-white font-sans flex items-center justify-center p-4 relative overflow-hidden" id="pos-login-container">
      <style>{`
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.35; }
          100% { transform: translateY(0px) rotate(360deg); opacity: 0.15; }
        }
        @keyframes float-fast {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.1; }
          50% { transform: translateY(-15px) rotate(-90deg); opacity: 0.25; }
          100% { transform: translateY(0px) rotate(-180deg); opacity: 0.1; }
        }
        @keyframes drift-right {
          0% { transform: translateX(0px) translateY(0px) rotate(0deg); opacity: 0.1; }
          50% { transform: translateX(30px) translateY(-10px) rotate(45deg); opacity: 0.25; }
          100% { transform: translateX(0px) translateY(0px) rotate(0deg); opacity: 0.1; }
        }
      `}</style>

      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />

      {/* Decorative floating animated background elements */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        {/* Pizza Slice 1 - Top Left */}
        <div className="absolute top-[10%] left-[8%] w-16 h-16" style={{ animation: 'float-slow 22s infinite ease-in-out' }}>
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 19C2 20.66 3.34 22 5 22H19C20.66 22 22 20.66 22 19L12 2Z" fill="#FBD127" fillOpacity="0.12" />
            <circle cx="12" cy="14" r="2" fill="#FC0000" fillOpacity="0.2" />
            <circle cx="8" cy="18" r="1.5" fill="#FC0000" fillOpacity="0.2" />
            <circle cx="16" cy="18" r="1.5" fill="#FC0000" fillOpacity="0.2" />
            <path d="M4 19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19" stroke="#FE850D" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.2" />
          </svg>
        </div>

        {/* Pizza Slice 2 - Bottom Right */}
        <div className="absolute bottom-[12%] right-[10%] w-20 h-20" style={{ animation: 'float-slow 28s infinite ease-in-out', animationDelay: '-4s' }}>
          <svg className="w-full h-full transform rotate-[45deg]" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 19C2 20.66 3.34 22 5 22H19C20.66 22 22 20.66 22 19L12 2Z" fill="#FBD127" fillOpacity="0.15" />
            <circle cx="12" cy="14" r="2" fill="#FC0000" fillOpacity="0.25" />
            <circle cx="8" cy="18" r="1.5" fill="#FC0000" fillOpacity="0.25" />
            <circle cx="16" cy="18" r="1.5" fill="#FC0000" fillOpacity="0.25" />
            <path d="M4 19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19" stroke="#FE850D" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.25" />
          </svg>
        </div>

        {/* Pizza Slice 3 - Top Right */}
        <div className="absolute top-[15%] right-[15%] w-14 h-14" style={{ animation: 'float-fast 18s infinite ease-in-out', animationDelay: '-8s' }}>
          <svg className="w-full h-full transform rotate-[120deg]" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 19C2 20.66 3.34 22 5 22H19C20.66 22 22 20.66 22 19L12 2Z" fill="#FBD127" fillOpacity="0.1" />
            <circle cx="12" cy="14" r="2" fill="#FC0000" fillOpacity="0.18" />
            <circle cx="8" cy="18" r="1.5" fill="#FC0000" fillOpacity="0.18" />
            <circle cx="16" cy="18" r="1.5" fill="#FC0000" fillOpacity="0.18" />
            <path d="M4 19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19" stroke="#FE850D" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.18" />
          </svg>
        </div>

        {/* Pizza Slice 4 - Bottom Left */}
        <div className="absolute bottom-[15%] left-[12%] w-18 h-18" style={{ animation: 'float-slow 25s infinite ease-in-out', animationDelay: '-12s' }}>
          <svg className="w-full h-full transform rotate-[-60deg]" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 19C2 20.66 3.34 22 5 22H19C20.66 22 22 20.66 22 19L12 2Z" fill="#FBD127" fillOpacity="0.13" />
            <circle cx="12" cy="14" r="2" fill="#FC0000" fillOpacity="0.22" />
            <circle cx="8" cy="18" r="1.5" fill="#FC0000" fillOpacity="0.22" />
            <circle cx="16" cy="18" r="1.5" fill="#FC0000" fillOpacity="0.22" />
            <path d="M4 19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19" stroke="#FE850D" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.22" />
          </svg>
        </div>

        {/* Basil Leaves */}
        <div className="absolute top-[40%] left-[5%] w-8 h-8" style={{ animation: 'drift-right 20s infinite ease-in-out' }}>
          <svg className="w-full h-full text-emerald-500/10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8 6 6 10 6 14C6 18 9 21 12 21C15 21 18 18 18 14C18 10 16 6 12 2Z" fillOpacity="0.15" />
          </svg>
        </div>
        <div className="absolute bottom-[40%] right-[5%] w-8 h-8" style={{ animation: 'drift-right 24s infinite ease-in-out', animationDelay: '-6s' }}>
          <svg className="w-full h-full text-emerald-500/10 transform rotate-[90deg]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8 6 6 10 6 14C6 18 9 21 12 21C15 21 18 18 18 14C18 10 16 6 12 2Z" fillOpacity="0.15" />
          </svg>
        </div>

        {/* Mushrooms */}
        <div className="absolute top-[60%] left-[8%] w-10 h-10" style={{ animation: 'float-fast 22s infinite ease-in-out', animationDelay: '-3s' }}>
          <svg className="w-full h-full text-stone-300/10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C7.58 2 4 5.58 4 10C4 11.5 5 13 6.5 13.5C7.5 13.8 8 14.5 8 15.5V20C8 21.1 8.9 22 10 22H14C15.1 22 16 21.1 16 20V15.5C16 14.5 16.5 13.8 17.5 13.5C19 13 20 11.5 20 10C20 5.58 16.42 2 12 2Z" fillOpacity="0.15" />
          </svg>
        </div>
        <div className="absolute top-[30%] right-[8%] w-10 h-10" style={{ animation: 'float-slow 26s infinite ease-in-out', animationDelay: '-10s' }}>
          <svg className="w-full h-full text-stone-300/10 transform rotate-[45deg]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C7.58 2 4 5.58 4 10C4 11.5 5 13 6.5 13.5C7.5 13.8 8 14.5 8 15.5V20C8 21.1 8.9 22 10 22H14C15.1 22 16 21.1 16 20V15.5C16 14.5 16.5 13.8 17.5 13.5C19 13 20 11.5 20 10C20 5.58 16.42 2 12 2Z" fillOpacity="0.15" />
          </svg>
        </div>
      </div>

      <div className="max-w-md w-full bg-zinc-950/85 backdrop-blur-md rounded-3xl border border-zinc-800/80 shadow-2xl p-6 sm:p-8 md:p-10 space-y-8 relative z-10">
        <div className="text-center space-y-4 flex flex-col items-center">
          <ElPatronLogo className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-md" variant="badge" color="#E8B800" />
          <div className="space-y-1">
            <h1 className="text-3xl font-display uppercase tracking-wider text-brand-yellow">Colores Pizza</h1>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
              Sistema Gestor Gastronómico
            </p>
          </div>
          <p className="text-xs text-zinc-400 font-medium max-w-[280px]">
            Control operativo de cocina, salón, caja e inventario.
          </p>
        </div>

        {isLoggingIn ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fadeIn" aria-live="polite">
            <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
            <div className="text-center">
              <h3 className="font-bold text-white text-sm">Iniciando sesión...</h3>
              <p className="text-[11px] text-zinc-500">Preparando el sistema</p>
            </div>
          </div>
        ) : (
          <form className="space-y-4 pt-2" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label htmlFor="login-identifier" className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                Usuario o email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ingresá tu usuario o email"
                  className="w-full py-3 pl-10 pr-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-yellow/20 focus:border-brand-yellow transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  className="w-full py-3 pl-10 pr-10 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-yellow/20 focus:border-brand-yellow transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 py-2 px-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-brand-red font-medium" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 px-4 bg-brand-yellow hover:bg-[#F2C200] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-brand-black font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-yellow/10"
            >
              <span>Iniciar sesión</span>
              <ArrowRight className="w-5 h-5 text-brand-black" />
            </button>
            
            <div className="pt-2 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowDiagnostics(true)}
                className="text-xs font-semibold text-zinc-500 hover:text-brand-yellow hover:underline transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                🔧 ¿Problemas de conexión? Ejecutar diagnóstico
              </button>
              {onBackToCover && (
                <button
                  type="button"
                  onClick={onBackToCover}
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto mt-2"
                >
                  🍕 Volver a la Portada Publicitaria
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {showDiagnostics && (
        <DiagnosticsTester onClose={() => setShowDiagnostics(false)} />
      )}

      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-zinc-600">
        Colores Pizzería • Terminal POS Autorizada
      </div>
    </div>
  );
}
