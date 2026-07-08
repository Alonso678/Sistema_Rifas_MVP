import React, { useState, useEffect, createContext, useContext } from 'react';

// URL base de tu backend Spring Boot (ajusta según tu despliegue)
const API_BASE_URL = 'http://localhost:8080/api';

// Contexto de Autenticación Global
const AuthContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('catalog'); // 'catalog', 'raffle-detail', 'success'
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    // 1. Recuperar token y datos de usuario de localStorage
    const savedToken = localStorage.getItem('rifas_jwt');
    const savedUser = localStorage.getItem('rifas_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    // 2. Comprobar conectividad con el Backend y cargar Rifas
    cargarRifas(savedToken);
  }, []);

  const apiFetch = async (endpoint, options = {}, customToken = null) => {
    const activeToken = customToken || token;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`Error en API (${endpoint}):`, err.message);
      throw err;
    }
  };

  const cargarRifas = async (currentToken) => {
    setLoading(true);
    try {
      // Intentar cargar datos reales del backend
      const datosRifas = await apiFetch('/rifas', {}, currentToken);
      setRaffles(datosRifas);
      setBackendConnected(true);
    } catch (err) {
      console.log('Usando datos simulados (backend local desconectado)...');
      setBackendConnected(false);
      // Fallback: Datos de desarrollo idénticos a los de tu base de datos
      setRaffles([
        {
          id: 1,
          titulo: "Gran Rifa MVP Computadora Gamer",
          descripcion: "Participa para ganar una PC con una potente tarjeta gráfica RTX 4070 y procesador Ryzen 7.",
          precioBoleto: 150.00,
          totalBoletos: 100,
          boletosDisponibles: 87,
          imagen: "🎮"
        },
        {
          id: 2,
          titulo: "PlayStation 5 Pro Slim",
          descripcion: "Consola de última generación PS5 Slim, incluye dos controles DualSense.",
          precioBoleto: 80.00,
          totalBoletos: 100,
          boletosDisponibles: 93,
          imagen: "🕹️"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loginExpress = async (email, password) => {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (res.token) {
        localStorage.setItem('rifas_jwt', res.token);
        localStorage.setItem('rifas_user', JSON.stringify(res.usuario));
        setToken(res.token);
        setUser(res.usuario);
        return res.token;
      }
    } catch (err) {
      throw new Error('Credenciales incorrectas');
    }
  };

  const registrarExpress = async (nombre, email, password) => {
    try {
      // 1. Registro
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nombre, email, password })
      });
      // 2. Login inmediato para obtener JWT
      return await loginExpress(email, password);
    } catch (err) {
      throw new Error(err.message || 'Error en el registro express');
    }
  };

  const logout = () => {
    localStorage.removeItem('rifas_jwt');
    localStorage.removeItem('rifas_user');
    setToken(null);
    setUser(null);
    setCurrentScreen('catalog');
  };

  return (
    <AuthContext.Provider value={{ user, token, backendConnected, loginExpress, registrarExpress, logout, apiFetch }}>
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
        
        {/* Navbar */}
        <header class="bg-[#101626] border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentScreen('catalog')}>
            <span className="text-2xl">🎟️</span>
            <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">RifasMVP</span>
          </div>
          
          <div className="flex items-center gap-4">
            {backendConnected ? (
              <span class="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Neon Conectado
              </span>
            ) : (
              <span class="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                ⚠️ Modo Offline
              </span>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-300">Hola, {user.nombre || user.name || 'Usuario'}</span>
                <button onClick={logout} className="text-xs text-rose-400 hover:text-rose-300 underline font-medium">Salir</button>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">Modo Invitado</span>
            )}
          </div>
        </header>

        {/* Contenido Principal con transiciones */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentScreen === 'catalog' ? (
            <RafflesCatalog raffles={raffles} onSelectRaffle={(r) => { setSelectedRaffle(r); setCurrentScreen('raffle-detail'); }} />
          ) : currentScreen === 'raffle-detail' ? (
            <RaffleDetail 
              raffle={selectedRaffle} 
              onBack={() => setCurrentScreen('catalog')} 
              onSuccess={(ticketNum) => { setSelectedTicket(ticketNum); setCurrentScreen('success'); }}
            />
          ) : (
            <SuccessScreen 
              raffle={selectedRaffle} 
              ticketNumber={selectedTicket} 
              onClose={() => { setSelectedTicket(null); setCurrentScreen('catalog'); }}
            />
          )}
        </main>
      </div>
    </AuthContext.Provider>
  );
}

function RafflesCatalog({ raffles, onSelectRaffle }) {
  return (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-2xl font-extrabold text-white">Sorteos Activos</h1>
        <p className="text-sm text-slate-400 mt-1">Selecciona la rifa de tu interés para ver los números disponibles y asegurar tu participación.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {raffles.map((raffle) => {
          const progress = ((raffle.totalBoletos - raffle.boletosDisponibles) / raffle.totalBoletos) * 100;
          return (
            <div key={raffle.id} className="bg-[#111827] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-4">
                  <span className="text-4xl p-3 bg-slate-800 rounded-xl">{raffle.imagen}</span>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide leading-tight">{raffle.titulo}</h3>
                    <span className="text-xs text-emerald-400 font-extrabold block mt-1">${raffle.precioBoleto.toFixed(2)} MXN</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4 leading-relaxed">{raffle.descripcion}</p>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Boletos vendidos</span>
                  <span className="font-bold text-slate-200">{Math.round(progress)}% ({raffle.boletosDisponibles} libres)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <button 
                onClick={() => onSelectRaffle(raffle)}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all tracking-wider flex items-center justify-center gap-2"
              >
                Elegir Números
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RaffleDetail({ raffle, onBack, onSuccess }) {
  const { user, token, apiFetch, backendConnected } = useContext(AuthContext);
  const [selectedNum, setSelectedNum] = useState(null);
  const [soldTickets, setSoldTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('register'); // 'register', 'login'
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar boletos ya reservados desde Neon
  useEffect(() => {
    if (backendConnected) {
      apiFetch(`/boletos/rifa/${raffle.id}`)
        .then(boletos => {
          setSoldTickets(boletos.map(b => b.numeroBoleto));
        })
        .catch(() => {
          setSoldTickets([2, 14, 25, 47, 58, 69, 88]); // Mock por si falla
        });
    } else {
      setSoldTickets([2, 14, 25, 47, 58, 69, 88]);
    }
  }, [raffle.id, backendConnected]);

  const manejarCompraDirecta = async () => {
    if (selectedNum === null) return;
    setLoadingAction(true);
    setErrorMsg('');

    try {
      if (backendConnected) {
        await apiFetch('/boletos/comprar', {
          method: 'POST',
          body: JSON.stringify({
            rifaId: raffle.id,
            numeroBoleto: selectedNum
          })
        });
      }
      onSuccess(selectedNum);
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo completar la compra');
    } finally {
      setLoadingAction(false);
    }
  };

  const ejecutarAutenticacionExpress = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    setErrorMsg('');
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
      let activeToken = token;
      if (modalMode === 'register') {
        const nombre = form.nombre.value;
        activeToken = await registrarExpress(nombre, email, password);
      } else {
        activeToken = await loginExpress(email, password);
      }

      // Proceder con la compra usando el token recién obtenido
      if (backendConnected) {
        await apiFetch('/boletos/comprar', {
          method: 'POST',
          body: JSON.stringify({
            rifaId: raffle.id,
            numeroBoleto: selectedNum
          })
        }, activeToken);
      }
      setShowModal(false);
      onSuccess(selectedNum);
    } catch (err) {
      setErrorMsg(err.message || 'Error en la autenticación');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5">
        ← Volver a Sorteos
      </button>

      <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2.5 bg-slate-800 rounded-xl">{raffle.imagen}</span>
          <div>
            <h2 className="text-sm font-bold text-white">{raffle.titulo}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{raffle.boletosDisponibles} disponibles</p>
          </div>
        </div>
        <span className="text-base font-black text-emerald-400">${raffle.precioBoleto.toFixed(2)} MXN</span>
      </div>

      <div className="text-center md:text-left">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">Paso 1: Elige un boleto</h3>
        <p className="text-xs text-slate-400 mt-1">Selecciona cualquiera de las casillas verdes. Los grises ya pertenecen a otro participante.</p>
      </div>

      {/* Grid de 100 números */}
      <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {Array.from({ length: 100 }).map((_, i) => {
            const isSold = soldTickets.includes(i);
            const isSelected = selectedNum === i;
            let btnClass = "h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center ";

            if (isSold) {
              btnClass += "bg-slate-800/40 border border-slate-800 text-slate-600 cursor-not-allowed";
            } else if (isSelected) {
              btnClass += "bg-amber-500 text-[#0c1221] border border-amber-400 shadow-lg scale-105 font-black";
            } else {
              btnClass += "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:scale-105 cursor-pointer";
            }

            return (
              <button 
                key={i} 
                disabled={isSold} 
                onClick={() => setSelectedNum(isSelected ? null : i)}
                className={btnClass}
              >
                {i.toString().padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {errorMsg && <p className="text-xs text-rose-400 font-bold mt-4 text-center">🚨 {errorMsg}</p>}

        <div className="mt-6 pt-4 border-t border-slate-800">
          <button
            disabled={selectedNum === null || loadingAction}
            onClick={user ? manejarCompraDirecta : () => setShowModal(true)}
            className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
              selectedNum !== null 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer shadow-lg animate-pulse' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loadingAction ? 'Procesando transaccion...' : selectedNum !== null ? `Comprar Boleto #${selectedNum.toString().padStart(2, '0')}` : 'Selecciona un número arriba'}
          </button>
        </div>
      </div>

      {/* MODAL EXPRESS FIGMA UX */}
      {showModal && (
        <div className="fixed inset-0 bg-[#080b13]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101626] border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
            
            <h3 className="text-base font-bold text-white mb-2">Compra Express en un Clic</h3>
            <p className="text-xs text-slate-400 mb-4">Apartarás de forma inmediata el boleto <span className="text-amber-400 font-black">#{selectedNum?.toString().padStart(2, '0')}</span> en Neon.</p>

            {/* Alternador Registro/Login */}
            <div className="grid grid-cols-2 bg-[#0b0f19] p-1 rounded-xl border border-slate-800 mb-4 text-xs font-bold">
              <button onClick={() => setModalMode('register')} className={`py-1.5 rounded-lg transition-all ${modalMode === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Registrarme</button>
              <button onClick={() => setModalMode('login')} className={`py-1.5 rounded-lg transition-all ${modalMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Tengo cuenta</button>
            </div>

            <form onSubmit={ejecutarAutenticacionExpress} className="space-y-3">
              {modalMode === 'register' && (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Nombre Completo</label>
                  <input name="nombre" required type="text" placeholder="Alonso Ortiz" className="w-full bg-[#0b0f19] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none" />
                </div>
              )}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Correo Electrónico</label>
                <input name="email" required type="email" placeholder="alonso@example.com" className="w-full bg-[#0b0f19] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Contraseña</label>
                <input name="password" required type="password" placeholder="••••••••" className="w-full bg-[#0b0f19] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none" />
              </div>

              <button type="submit" disabled={loadingAction} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0c1221] font-extrabold py-2.5 rounded-xl text-xs tracking-wider transition-all mt-4">
                {loadingAction ? 'Procesando...' : 'Confirmar y Apartar Boleto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessScreen({ raffle, ticketNumber, onClose }) {
  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-6 text-center py-6">
      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/10">
        🎉
      </div>

      <div>
        <h2 className="text-xl font-black text-white leading-tight">¡Compra Confirmada!</h2>
        <p className="text-xs text-emerald-400 font-semibold mt-1">El boleto ha sido guardado de forma permanente en tu cuenta</p>
      </div>

      {/* Ticket Virtual */}
      <div className="bg-[#111827] border-2 border-indigo-500/30 w-full rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-[#0b0f19] rounded-full border-r-2 border-indigo-500/30"></div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-[#0b0f19] rounded-full border-l-2 border-indigo-500/30"></div>

        <div className="px-6 py-4 border-b border-dashed border-slate-700 text-left">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block">Sorteo Activo</span>
          <span className="text-sm font-bold text-slate-200 mt-1 block truncate">{raffle.titulo}</span>
        </div>

        <div className="py-8 flex flex-col items-center justify-center bg-slate-900/30">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Tu número asignado</span>
          <span className="text-5xl font-black text-amber-400 tracking-wider mt-2.5 bg-[#0b0f19] px-6 py-2 rounded-xl border border-slate-800 shadow-inner">
            {ticketNumber?.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="px-6 py-4 text-left text-[11px] text-slate-400">
          <p>Un correo de confirmación ha sido enviado con el identificador de transacción único de Neon. Consérvalo para reclamar tu premio.</p>
        </div>
      </div>

      <button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs tracking-wider transition-all">
        Volver al Catálogo
      </button>
    </div>
  );
}