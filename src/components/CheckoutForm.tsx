import React, { useState, useEffect } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Props {
  lang: 'es' | 'en';
}

const translations = {
  es: {
    title: <>Regístrate y  <span className="text-yellow-400">potencia</span> tu trading</>,
    description: '🚀 Deja que los mejores traders hagan dinero por ti. Por solo $5 USD copia las ideas más rentables y haz crecer tu capital sin esfuerzo.',
    name: 'Nombre completo',
    email: 'Correo electrónico',
    alias: 'Alias',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    summaryTitle: '💳 Resumen de Membresía',
    summaryDesc: 'Accede a las ideas de los traders más rentables del mes. Sin complicaciones.',
    membership: 'Membresía Pro',
    price: '$5.00 USD',
    taxes: 'Incluye todos los impuestos y comisiones.',
    cardLabel: 'Datos de la Tarjeta',
    payButton: 'Pagar Membresía',
    confirmation: 'Una vez procesado, recibirás un correo con acceso a tu cuenta.',
    errorPassword: 'Las contraseñas no coinciden.',
    errorValidation: 'La contraseña debe tener al menos 6 caracteres, una mayúscula, un número y un símbolo.',
    success: 'Registro y pago exitoso.',
    fail: 'Ocurrió un error al registrar.',
  },
  en: {
    title: <>Register and <span className="text-yellow-400">boost</span> your trading</>,
    description: '🚀 Let the best traders make money for you. For just $5 USD, copy the most profitable ideas and grow your capital effortlessly.',
    name: 'Full name',
    email: 'Email address',
    alias: 'Alias',
    password: 'Password',
    confirmPassword: 'Confirm password',
    summaryTitle: '💳 Membership Summary',
    summaryDesc: 'Access the top-performing traders’ ideas. No hassle.',
    membership: 'Pro Membership',
    price: '$5.00 USD',
    taxes: 'Includes all taxes and fees.',
    cardLabel: 'Card Information',
    payButton: 'Pay Membership',
    confirmation: 'Once processed, you will receive an email with access to your account.',
    errorPassword: 'Passwords do not match.',
    errorValidation: 'Password must have at least 6 characters, one uppercase letter, one number and one symbol.',
    success: 'Registration and payment successful.',
    fail: 'An error occurred during registration.',
  },
};

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontSize: '16px',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      iconColor: '#ffffff',
      '::placeholder': {
        color: '#a0aec0',
      },
    },
    invalid: {
      color: '#e53e3e',
      iconColor: '#e53e3e',
    },
  },
  hidePostalCode: true,
};

const CheckoutForm: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];
  const navigate = useNavigate(); // ✅ CORRECTO: dentro del componente

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    alias: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 640px) {
        .StripeElement iframe {
          min-height: 90px !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { password, confirmPassword } = form;

    if (password !== confirmPassword) {
      toast.error(t.errorPassword);
      return;
    }

    if (
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      toast.error(t.errorValidation);
      return;
    }

    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setLoading(true);

    const { token, error } = await stripe.createToken(card);
    if (error || !token) {
      toast.error(error?.message || 'Error al generar el token de la tarjeta.');
      setLoading(false);
      return;
    }

    const response = await fetch('https://odin.datainsightscloud.com/registro_signal.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.name,
        email: form.email,
        password: form.password,
        alias: form.alias,
        stripeToken: token.id,
      }),
    });

    const result = await response.json();
    setLoading(false);

    if (result.success) {
      toast.success(t.success);
      setTimeout(() => {
        navigate('/login');
      }, 2000); // ✅ redirección después de mostrar el toast
    } else {
      toast.error(result.error || t.fail);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-12"
    >
      {/* Sección Izquierda */}
      <div>
        <h2 className="text-3xl font-bold mb-4 text-white">{t.title}</h2>
        <p className="text-gray-300 mb-6">{t.description}</p>

        <input
          type="text"
          placeholder={t.name}
          className="w-full mb-4 px-4 py-3 bg-gray-800 text-white rounded-lg"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder={t.email}
          className="w-full mb-4 px-4 py-3 bg-gray-800 text-white rounded-lg"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder={t.alias}
          className="w-full mb-4 px-4 py-3 bg-gray-800 text-white rounded-lg"
          onChange={(e) => setForm({ ...form, alias: e.target.value })}
          required
        />

        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t.password}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg pr-10"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative mb-4">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t.confirmPassword}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg pr-10"
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
          <button
            type="button"
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Sección Derecha */}
      <div
        className="p-6 rounded-lg shadow-xl bg-gray-900 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://odin.datainsigdhtscloud.com/bann.png')`,
        }}
      >
        <div className="bg-black/60 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-white">{t.summaryTitle}</h3>
          <p className="text-sm text-gray-300 mb-4">{t.summaryDesc}</p>

          <div className="bg-gray-800 text-white rounded-md p-4 mb-6">
            <div className="flex justify-between text-lg font-semibold">
              <span>{t.membership}</span>
              <span>{t.price}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{t.taxes}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-2">{t.cardLabel}</label>
            <div className="bg-gray-800 text-white rounded-lg px-4 py-3">
              <CardElement options={CARD_ELEMENT_OPTIONS} className="w-full" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:opacity-90 transition"
          >
            {loading ? '...' : t.payButton}
          </button>

          <p className="text-xs text-center text-gray-300 mt-4">{t.confirmation}</p>
        </div>
      </div>
    </form>
  );
};

export default CheckoutForm;
