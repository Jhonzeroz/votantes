import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';
import logo from '../../src/assets/logo.png';
import { Linkedin } from 'lucide-react';


interface DecodedToken {
  nombre: string;
  tipo_usuario: number;
  exp: number;
  iat: number;
}

const translations = {
  es: {
    secureLogin: '🔐 Inicio de sesión seguro y cifrado',
    headline: <>Bienvenido <span className="text-yellow-400">Administrator</span></>,
    email: 'Correo electrónico',
    password: 'Contraseña',
    loginBtn: 'Iniciar sesión',
    noAccount: '¿No tienes una cuenta?',
    register: 'Regístrate',
    success: 'Inicio de sesión exitoso',
    fail: 'Credenciales inválidas',
    forgotPassword: '¿Olvidaste tu contraseña?',
    resetDescription: 'Si el correo existe, recibirás tus credenciales de acceso.',
  },
  en: {
    secureLogin: '🔐 Secure and encrypted login',
    headline: <>Welcome <span className="text-yellow-400">Administrator</span></>,
    email: 'Email',
    password: 'Password',
    loginBtn: 'Login',
    noAccount: "Don't have an account?",
    register: 'Register',
    success: 'Login successful',
    fail: 'Invalid credentials',
    forgotPassword: 'Forgot your password?',
    resetDescription: 'If the email exists, you will receive your login credentials.',
  },
};

const AdminGold: React.FC = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [lang] = useState<'es' | 'en'>('es');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const t = translations[lang];
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 800 });

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const now = Date.now() / 1000;

        if (decoded.exp > now && decoded.tipo_usuario === 1) {
          navigate('/dashboard');
        }
      } catch (err) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('https://datainsightscloud.com/Apis/login_admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data && data.success && data.token) {
        localStorage.setItem('token', data.token);
        const decoded = jwtDecode<DecodedToken>(data.token);
        localStorage.setItem('usuarioNombre', decoded.nombre);
        toast.success(t.success);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast.error(data?.error || t.fail);
      }
    } catch (error) {
      toast.error('Error de conexión. Intenta nuevamente.');
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error('Por favor ingresa tu correo');
      return;
    }



    setIsSending(true);
    try {
      const res = await fetch('https://odin.datainsightscloud.com/reset_password_ad.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Si el correo existe, se enviaron las instrucciones.');
        setShowResetModal(false);
        setResetEmail('');
      } else {
        toast.error(data.error || 'No se pudo enviar el correo.');
      }
    } catch {
      toast.error('Error de red al enviar la solicitud.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white"
      style={{ backgroundImage: "url('https://odin.datainsightscloud.com/bann.png')" }}
    >
      <div className="min-h-screen bg-gradient-to-b from-[#0c0e1b]/90 via-[#0c1a26]/90 to-[#0c1a26]/90 flex flex-col items-center justify-center px-6 py-12">


        <div className="text-center mb-12" data-aos="fade-down">
          <p className="text-sm text-gray-300 mb-1">{t.secureLogin}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">{t.headline}</h1>
        </div>

        <div data-aos="fade-up" className="w-full max-w-md bg-[#1f2937] p-8 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-300 mb-1">{t.email}</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="jramirezcordobaa@gmail.com"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm text-gray-300 mb-1">{t.password}</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="absolute top-9 right-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:opacity-90 transition"
            >
              {t.loginBtn}
            </button>
          </form>

          <p className="text-sm text-center text-gray-400 mt-4">
            <button
              type="button"
              className="text-blue-400 hover:underline"
              onClick={() => setShowResetModal(true)}
            >
            </button>
          </p>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#1f2937] p-6 rounded-lg shadow-lg w-full max-w-sm relative">
            {isSending && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 rounded-lg">
                <img src={logo} alt="Loading" className="w-16 h-16 animate-spin" />
                <p className="text-white mt-2">Enviando correo...</p>
              </div>
            )}
            <h2 className="text-xl font-semibold mb-2 text-white">Recuperar contraseña</h2>
            <p className="text-gray-400 mb-4 text-sm">{t.resetDescription}</p>
            <input
              type="email"
              placeholder="Ingresa tu correo"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full mb-4 px-4 py-2 rounded bg-gray-800 text-white border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <a
        href="https://www.linkedin.com/in/jhonathan-ramirez-cordoba/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 flex items-center gap-2 text-sm text-gray-300 opacity-80 hover:opacity-100 transition hover:text-blue-400"
        title="Visita mi perfil de LinkedIn"
      >
        <span className="font-medium">Jhonathan Ramírez</span>
        <Linkedin size={20} />
      </a>




    </div>
  );
};

export default AdminGold;
