import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// URL base de tu backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';

const AuthContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('catalog');
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);

  const apiFetch = useCallback(async (endpoint, options = {}, customToken = null) => {
    const activeToken = customToken || token;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      
      // 🚨 RADAR DE RESPUESTA CRUDA: Capturamos el texto antes de intentar parsear como JSON
      const textData = await response.text();
      console.log(`[LOG FRONTEND] Respuesta cruda de ${endpoint} (Status: ${response.status}):`, textData);

      if (!response.ok) {
        let parsedError = {};
        try { parsedError = JSON.parse(textData); } catch(e) {}
        throw new Error(parsedError.error || `Error del servidor: ${response.status}`);
      }

      // Si viene vacío (como un String o HTTP 204), retornamos un objeto vacío para no romper JSON.parse
      return textData ? JSON.parse(textData) : {};
    } catch (e) {
      console.warn(`🚨 Error detectado en la llamada API (${endpoint}):`, e.message);
      throw e;
    }
  }, [token]);

  const cargarRifas = useCallback(async (currentToken) => {
    setLoading(true);
    try {
      const datosRifas = await apiFetch('/rifas', {}, currentToken);
      setRaffles(datosRifas);
      setBackendConnected(true);
    } catch (e) {
      setBackendConnected(false);
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
  }, [apiFetch]);

  useEffect(() => {
    const initializeApp = async () => {
      const savedToken = localStorage.getItem('rifas_jwt');
      const savedUser = localStorage.getItem('rifas_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
      await cargarRifas(savedToken);
    };
    initializeApp();
  }, [cargarRifas]);

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
    } catch (e) {
      throw new Error('Credenciales incorrectas', { cause: e });
    }
  };

  const registrarExpress = async (nombre, email, password) => {
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nombre, email, password })
      });
      return await loginExpress(email, password);
    } catch (e) {
      throw new Error(e.message || 'Error en el registro express', { cause: e });
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
      <div className="min-vh-screen text-light flex flex-column" style={{ backgroundColor: '#0b0f19', minHeight: '100vh' }}>
        
        <header className="navbar navbar-expand border-bottom px-4 py-3" style={{ backgroundColor: '#101626', borderColor: '#1e293b !important' }}>
          <div className="container-fluid d-flex justify-content-between align-items-center">
            <div className="navbar-brand d-flex align-items-center gap-2 m-0 text-white font-weight-bold" style={{ cursor: 'pointer' }} onClick={() => setCurrentScreen('catalog')}>
              <span className="fs-4">🎟️</span>
              <span className="fw-bolder tracking-wider text-primary">RifasMVP</span>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              {backendConnected ? (
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1.5 rounded-pill d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                  Neon Conectado
                </span>
              ) : (
                <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1.5 rounded-pill" style={{ fontSize: '11px' }}>
                  ⚠️ Modo Offline
                </span>
              )}

              {user ? (
                <div className="d-flex align-items-center gap-2">
                  <span className="text-secondary" style={{ fontSize: '13px' }}>Hola, <strong>{user.nombre || user.name || 'Usuario'}</strong></span>
                  <button onClick={logout} className="btn btn-link btn-sm text-danger p-0 text-decoration-underline">Salir</button>
                </div>
              ) : (
                <span className="text-secondary italic" style={{ fontSize: '13px' }}>Modo Invitado</span>
              )}
            </div>
          </div>
        </header>

        <main className="container flex-grow-1 my-4" style={{ maxWidth: '850px' }}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '250px' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
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
    <div className="py-2">
      <div className="mb-4">
        <h1 className="h3 fw-bold text-white">Sorteos Activos</h1>
        <p className="text-secondary small">Selecciona la rifa de tu interés para ver los números disponibles y asegurar tu participación.</p>
      </div>

      <div className="row g-4">
        {raffles.map((raffle) => {
          const progress = ((raffle.totalBoletos - raffle.boletosDisponibles) / raffle.totalBoletos) * 100;
          return (
            <div key={raffle.id} className="col-12 col-md-6">
              <div className="card h-100 text-light border-secondary border-opacity-25 shadow-sm d-flex flex-column justify-content-between p-4" style={{ backgroundColor: '#111827', borderRadius: '1rem' }}>
                <div>
                  <div className="d-flex align-items-center gap-3">
                    <span className="fs-1 p-2 bg-dark rounded-3">{raffle.imagen}</span>
                    <div>
                      <h3 className="h6 fw-bold m-0 text-white">{raffle.titulo}</h3>
                      <span className="text-success fw-bold small d-block mt-1">${raffle.precioBoleto.toFixed(2)} MXN</span>
                    </div>
                  </div>
                  <p className="card-text text-secondary mt-3 small" style={{ lineHeight: '1.5' }}>{raffle.descripcion}</p>
                </div>

                <div className="mt-4">
                  <div className="d-flex justify-content-between text-secondary small mb-1" style={{ fontSize: '12px' }}>
                    <span>Boletos vendidos</span>
                    <span className="text-light fw-bold">{Math.round(progress)}% ({raffle.boletosDisponibles} libres)</span>
                  </div>
                  <div className="progress bg-dark" style={{ height: '9px' }}>
                    <div className="progress-bar bg-primary transition-all" role="progressbar" style={{ width: `${progress}%` }} aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>

                <button onClick={() => onSelectRaffle(raffle)} className="btn btn-primary w-100 mt-4 py-2 fw-bold small" style={{ borderRadius: '0.75rem', fontSize: '13px' }}>
                  Elegir Números 🎰
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RaffleDetail({ raffle, onBack, onSuccess }) {
  const { user, token, apiFetch, backendConnected, loginExpress, registrarExpress } = useContext(AuthContext);
  const [selectedNum, setSelectedNum] = useState(null);
  const [soldTickets, setSoldTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('register');
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadTickets = async () => {
      if (backendConnected) {
        try {
          const boletos = await apiFetch(`/boletos/rifa/${raffle.id}`);
          setSoldTickets(boletos.map(b => b.numeroBoleto));
        } catch (e) {
          setSoldTickets([2, 14, 25, 47, 58, 69, 88]);
        }
      } else {
        setSoldTickets([2, 14, 25, 47, 58, 69, 88]);
      }
    };
    loadTickets();
  }, [raffle.id, backendConnected, apiFetch]);

  const manejarCompraDirecta = async () => {
    if (selectedNum === null) return;
    setLoadingAction(true);
    setErrorMsg('');
    try {
      if (backendConnected) {
        // 🚨 CAMBIO DE PROPIEDAD: Corregido de 'raffleId' a 'rifaId' para hacer match con ejecutarAutenticacionExpress
        await apiFetch('/boletos/comprar', {
          method: 'POST',
          body: JSON.stringify({ rifaId: raffle.id, numeroBoleto: selectedNum })
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

      if (backendConnected) {
        await apiFetch('/boletos/comprar', {
          method: 'POST',
          body: JSON.stringify({ rifaId: raffle.id, numeroBoleto: selectedNum })
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
    <div className="py-2">
      <button onClick={onBack} className="btn btn-link link-secondary p-0 text-white text-decoration-none small fw-bold mb-3">
        ← Volver a Sorteos
      </button>

      <div className="card text-light border-secondary border-opacity-25 p-3 mb-4 shadow-sm" style={{ backgroundColor: '#111827', borderRadius: '1rem' }}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <span className="fs-3 p-2 bg-dark rounded-3">{raffle.imagen}</span>
            <div>
              <h2 className="h6 m-0 fw-bold text-white">{raffle.titulo}</h2>
              <p className="text-secondary small m-0 mt-0.5">{raffle.boletosDisponibles} disponibles</p>
            </div>
          </div>
          <span className="h5 font-weight-black text-success m-0">${raffle.precioBoleto.toFixed(2)} MXN</span>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-primary uppercase fw-bold tracking-wider small m-0" style={{ fontSize: '11px' }}>PASO 1: ELIGE UN BOLETO</h3>
        <p className="text-secondary small mt-1">Selecciona cualquiera de las casillas verdes. Las grises ya pertenecen a otro participante.</p>
      </div>

      <div className="card text-light border-secondary border-opacity-25 p-4 shadow-lg mb-4" style={{ backgroundColor: '#111827', borderRadius: '1rem' }}>
        <div className="row g-2 overflow-auto" style={{ maxHeight: '320px' }}>
          {Array.from({ length: 100 }).map((_, i) => {
            const isSold = soldTickets.includes(i);
            const isSelected = selectedNum === i;
            
            let btnStyle = {
              height: '38px',
              borderRadius: '0.5rem',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid transparent',
              transition: 'all 0.15s ease-in-out'
            };

            let btnClass = "col-2 col-sm-1 d-flex justify-content-center align-items-center btn ";

            if (isSold) {
              btnClass += "btn-dark opacity-20 disabled";
              btnStyle.color = '#4b5563';
              btnStyle.backgroundColor = '#1f2937';
            } else if (isSelected) {
              btnClass += "btn-warning text-dark fw-bold shadow";
            } else {
              btnClass += "btn-outline-success text-success bg-success bg-opacity-10";
              btnStyle.borderColor = 'rgba(16, 185, 129, 0.2)';
            }

            return (
              <button key={i} disabled={isSold} onClick={() => setSelectedNum(isSelected ? null : i)} className={btnClass} style={btnStyle}>
                {i.toString().padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {errorMsg && <p className="text-danger small fw-bold mt-3 text-center">🚨 {errorMsg}</p>}

        <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
          <button
            disabled={selectedNum === null || loadingAction}
            onClick={user ? manejarCompraDirecta : () => setShowModal(true)}
            className={`btn w-100 py-2.5 fw-bold small ${selectedNum !== null ? 'btn-success text-dark' : 'btn-secondary text-muted'}`}
            style={{ borderRadius: '0.75rem' }}
          >
            {loadingAction ? 'Procesando transacción...' : selectedNum !== null ? `Comprar Boleto #${selectedNum.toString().padStart(2, '0')}` : 'Selecciona un número arriba'}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(8, 11, 19, 0.85)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '360px' }}>
            <div className="modal-content text-light border-secondary border-opacity-25 p-3 shadow-2xl" style={{ backgroundColor: '#101626', borderRadius: '1.5rem' }}>
              <div className="modal-header border-0 p-2 d-flex justify-content-between align-items-center">
                <h3 className="modal-title h6 fw-bold text-white">Compra Express en un Clic</h3>
                <button type="button" onClick={() => setShowModal(false)} className="btn-close btn-close-white shadow-none" aria-label="Close" style={{ fontSize: '12px' }}></button>
              </div>
              
              <div className="modal-body p-2">
                <p className="text-secondary small mb-3">Apartarás de forma inmediata el boleto <span className="text-warning fw-bold">#{selectedNum?.toString().padStart(2, '0')}</span> en Neon.</p>

                <div className="row g-0 p-1 bg-dark rounded-3 border border-secondary border-opacity-25 mb-3 text-center" style={{ fontSize: '12px' }}>
                  <div className="col-6">
                    <button onClick={() => setModalMode('register')} className={`btn btn-sm w-100 fw-bold border-0 text-white ${modalMode === 'register' ? 'btn-primary' : 'btn-link text-decoration-none text-secondary'}`} style={{ borderRadius: '0.5rem' }}>Registrarme</button>
                  </div>
                  <div className="col-6">
                    <button onClick={() => setModalMode('login')} className={`btn btn-sm w-100 fw-bold border-0 text-white ${modalMode === 'login' ? 'btn-primary' : 'btn-link text-decoration-none text-secondary'}`} style={{ borderRadius: '0.5rem' }}>Tengo cuenta</button>
                  </div>
                </div>

                <form onSubmit={ejecutarAutenticacionExpress} className="d-flex flex-column gap-3">
                  {modalMode === 'register' && (
                    <div>
                      <label className="text-secondary uppercase tracking-wider d-block mb-1" style={{ fontSize: '9px' }}>Nombre Completo</label>
                      <input name="nombre" required type="text" placeholder="Alonso Ortiz" className="form-control form-control-sm bg-dark border-secondary border-opacity-50 text-white text-xs shadow-none" style={{ borderRadius: '0.5rem', backgroundColor: '#0b0f19 !important' }} />
                    </div>
                  )}
                  <div>
                    <label className="text-secondary uppercase tracking-wider d-block mb-1" style={{ fontSize: '9px' }}>Correo Electrónico</label>
                    <input name="email" required type="email" placeholder="alonso@example.com" className="form-control form-control-sm bg-dark border-secondary border-opacity-50 text-white text-xs shadow-none" style={{ borderRadius: '0.5rem', backgroundColor: '#0b0f19 !important' }} />
                  </div>
                  <div>
                    <label className="text-secondary uppercase tracking-wider d-block mb-1" style={{ fontSize: '9px' }}>Contraseña</label>
                    <input name="password" required type="password" placeholder="••••••••" className="form-control form-control-sm bg-dark border-secondary border-opacity-50 text-white text-xs shadow-none" style={{ borderRadius: '0.5rem', backgroundColor: '#0b0f19 !important' }} />
                  </div>

                  <button type="submit" disabled={loadingAction} className="btn btn-success w-100 py-2 text-dark fw-bold mt-2" style={{ borderRadius: '0.5rem', fontSize: '13px' }}>
                    {loadingAction ? 'Procesando...' : 'Confirmar y Apartar Boleto'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessScreen({ raffle, ticketNumber, onClose }) {
  return (
    <div className="text-center mx-auto py-4 d-flex flex-column align-items-center gap-4" style={{ maxWidth: '400px' }}>
      <div className="d-flex align-items-center justify-content-center bg-success bg-opacity-10 border border-success rounded-circle" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
        🎉
      </div>

      <div>
        <h2 className="h4 fw-black text-white m-0">¡Compra Confirmada!</h2>
        <p className="text-success small fw-semibold mt-1">El boleto ha sido guardado de forma permanente en tu cuenta</p>
      </div>

      <div className="card text-light border-primary border-opacity-25 w-100 shadow-lg position-relative" style={{ backgroundColor: '#111827', borderRadius: '1.25rem', border: '2px solid rgba(13, 110, 253, 0.2)' }}>
        <div className="px-4 py-3 border-bottom border-secondary border-dashed text-start">
          <span className="text-primary uppercase fw-bold tracking-wider d-block" style={{ fontSize: '10px' }}>Sorteo Activo</span>
          <span className="h6 font-weight-bold text-white mt-1 d-block text-truncate">{raffle.titulo}</span>
        </div>

        <div className="py-5 d-flex flex-col flex-column align-items-center justify-content-center bg-dark bg-opacity-20">
          <span className="text-secondary uppercase font-weight-bold tracking-wider" style={{ fontSize: '10px' }}>Tu número asignado</span>
          <span className="h1 font-weight-black text-warning tracking-wider mt-2 bg-black bg-opacity-40 px-4 py-2 border border-secondary border-opacity-25 shadow-inner" style={{ borderRadius: '0.75rem', fontSize: '3rem', fontFamily: 'monospace' }}>
            {ticketNumber?.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="px-4 py-3 text-start text-secondary" style={{ fontSize: '11px' }}>
          <p className="m-0">Un correo de confirmación ha sido enviado con el identificador de transacción único de Neon. Consérvalo para reclamar tu premio.</p>
        </div>
      </div>

      <button onClick={onClose} className="btn btn-primary w-100 py-2.5 fw-bold small" style={{ borderRadius: '0.75rem' }}>
        Volver al Catálogo
      </button>
    </div>
  );
}