import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';
import Navbar from '../components/Navbar';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface DecodedToken {
    id: number;
    nombre: string;
    tipo_usuario: number;
    iat: number;
    exp: number;
}

const CambiarPassword: React.FC = () => {
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [showActual, setShowActual] = useState(false);
    const [showNueva, setShowNueva] = useState(false);
    const [showConfirmar, setShowConfirmar] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token);
                if (decoded.exp < Date.now() / 1000) {
                    localStorage.clear();
                    toast.error('Sesión expirada');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Token inválido:', error);
                localStorage.clear();
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!actual || !nueva || !confirmar) {
            toast.error('Completa todos los campos');
            return;
        }

        if (nueva !== confirmar) {
            toast.error('Las nuevas contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://odin.datainsightscloud.com/cambiar_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    actual,
                    nueva,
                }),
            });

            const result = await res.json();

            if (res.ok && result.success) {
                toast.success('✅ Contraseña actualizada correctamente');
                setActual('');
                setNueva('');
                setConfirmar('');
            } else {
                toast.error(result.error || '❌ Error al cambiar la contraseña');
            }
        } catch (err) {
            toast.error('❌ Error de red');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />
            <div className="max-w-md mx-auto mt-10 bg-[#1f2937] rounded-lg p-6 shadow-lg relative">
                {/* Botón volver */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="absolute -top-4 -left-4 bg-gray-700 hover:bg-gray-600 p-2 rounded-full shadow transition"
                    title="Volver"
                >
                    <ArrowLeft size={20} />
                </button>

                <h2 className="text-xl font-semibold mb-4">🔒 Cambiar Contraseña</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Contraseña Actual */}
                    <div className="relative">
                        <input
                            type={showActual ? 'text' : 'password'}
                            placeholder="Contraseña Actual"
                            value={actual}
                            onChange={(e) => setActual(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white rounded pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowActual(!showActual)}
                            className="absolute top-2 right-2 text-gray-400"
                        >
                            {showActual ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* Nueva Contraseña */}
                    <div className="relative">
                        <input
                            type={showNueva ? 'text' : 'password'}
                            placeholder="Nueva Contraseña"
                            value={nueva}
                            onChange={(e) => setNueva(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white rounded pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowNueva(!showNueva)}
                            className="absolute top-2 right-2 text-gray-400"
                        >
                            {showNueva ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* Confirmar Nueva Contraseña */}
                    <div className="relative">
                        <input
                            type={showConfirmar ? 'text' : 'password'}
                            placeholder="Confirmar Nueva Contraseña"
                            value={confirmar}
                            onChange={(e) => setConfirmar(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white rounded pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmar(!showConfirmar)}
                            className="absolute top-2 right-2 text-gray-400"
                        >
                            {showConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black px-6 py-2 rounded font-semibold hover:opacity-90 transition"
                    >
                        {loading ? 'Guardando...' : 'Actualizar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CambiarPassword;
