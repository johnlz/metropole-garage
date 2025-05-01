import { useEffect, useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { onNUIMessage } from './nui/nui';
import { Vehicle } from './types/vehicle';
import Spinner from './components/Spinner';
import './App.css';

const vehicleImages: { [key: string]: string } = {
  adder: 'images/carro.png',
  comet2: 'images/carro.png',
  zentorno: 'images/carro.png',
  jester: 'images/carro.png',
  banshee: 'images/carro.png',
  elegy: 'images/carro.png',
  default: 'images/carro.png'
};

const normalizeModelName = (model: string): string => {
  return model.toLowerCase().replace(/\s+/g, '');
};

const App = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeVehiclePlate, setActiveVehiclePlate] = useState<string | null>(null);
  const [spawnedVehicles, setSpawnedVehicles] = useState<{ [plate: string]: boolean }>({});

  // Função para controlar a visibilidade da UI no elemento root
  const updateRootVisibility = (visible: boolean) => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      if (visible) {
        rootElement.classList.add('visible-ui');
        // Adiciona classe para o fundo escuro apenas quando visível
        document.body.classList.add('garage-background-visible');
      } else {
        rootElement.classList.remove('visible-ui');
        // Remove classe do fundo escuro quando invisível
        document.body.classList.remove('garage-background-visible');
      }
    }
  };

  // Verifica se um veículo está spawnado baseado na sua placa
  const isVehicleSpawned = (plate: string): boolean => {
    return !!spawnedVehicles[plate];
  };

  // Função para spawnar um veículo
  const handleSpawnVehicle = (plate: string) => {
    setLoading(true);
    setError(null);

    fetch(`https://metropole-garage/spawnVehicle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plate }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            try {
              const errorData = JSON.parse(text);
              if (errorData.type === "vehicle_already_out") {
                toast.error('Este veículo já está fora da garagem.', {
                  style: {
                    background: 'rgba(10, 14, 20, 0.95)',
                    color: '#EF4444',
                    border: '1px solid #EF4444',
                  },
                  icon: '🚫',
                });
              } else {
                throw new Error(errorData.message || 'Falha ao spawnar veículo');
              }
            } catch (e) {
              throw new Error(text || 'Falha ao spawnar veículo');
            }
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        toast.error(err.message, {
          style: {
            background: 'rgba(10, 14, 20, 0.95)',
            color: '#EF4444',
            border: '1px solid #EF4444',
          },
          icon: '❌',
        });
      });
  };

  const handleAdminSpawnVehicle = (plate: string) => {
    setLoading(true);
    setError(null);

    fetch(`https://metropole-garage/adminSpawnVehicle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plate }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            try {
              const errorData = JSON.parse(text);
              throw new Error(errorData.message || 'Falha ao spawnar veículo (admin)');
            } catch (e) {
              throw new Error(text || 'Falha ao spawnar veículo (admin)');
            }
          });
        }
        setLoading(false);
        toast.success('Veículo spawnado (admin) com sucesso!', {
          style: {
            background: 'rgba(10, 14, 20, 0.95)',
            color: 'var(--lime-green)',
            border: '1px solid var(--lime-green)',
          },
          icon: '🔑',
        });
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        toast.error(err.message, {
          style: {
            background: 'rgba(10, 14, 20, 0.95)',
            color: '#EF4444',
            border: '1px solid #EF4444',
          },
          icon: '❌',
        });
      });
  };

  // Função para guardar um veículo específico pelo card
  const handleStoreSpecificVehicle = (plate: string) => {
    setLoading(true);
    setError(null);

    fetch(`https://metropole-garage/storeVehicle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plate }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(text || 'Falha ao guardar veículo');
          });
        }
        setLoading(false);
        
        // Atualiza o estado de veículos spawnados
        setSpawnedVehicles(prev => ({
          ...prev,
          [plate]: false
        }));
        
        // Se este era o veículo ativo, limpa
        if (activeVehiclePlate === plate) {
          setActiveVehiclePlate(null);
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        toast.error(err.message, {
          style: {
            background: 'rgba(10, 14, 20, 0.95)',
            color: '#EF4444',
            border: '1px solid #EF4444',
          },
          icon: '❌',
        });
      });
  };

  const handleClose = useCallback(() => {
    fetch(`https://metropole-garage/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setIsVisible(false);
    updateRootVisibility(false);
  }, []);

  useEffect(() => {
    // Event listener para a tecla ESC
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        handleClose();
      }
    };

    // Adiciona o event listener quando o componente é montado
    window.addEventListener('keydown', handleKeyDown);

    onNUIMessage((message) => {
      switch (message.action) {
        case 'openGarage':
          setIsVisible(true);
          updateRootVisibility(true);
          break;
        case 'closeUI':
          setIsVisible(false);
          updateRootVisibility(false);
          setVehicles([]);
          setActiveVehiclePlate(null); // Limpa a placa ativa ao fechar a UI
          setSpawnedVehicles({}); // Limpa o estado de veículos spawnados
          break;
        case 'setVehicles':
          setVehicles(message.vehicles || []);
          // Atualiza o estado dos veículos que estão spawnados
          if (message.spawnedVehicles) {
            setSpawnedVehicles(message.spawnedVehicles);
          }
          break;
        case 'setActiveVehicle':
          if (message.plate) {
            console.log(`Definindo veículo ativo: ${message.plate}`);
            setActiveVehiclePlate(String(message.plate));
            // Também marca o veículo como spawnado
            setSpawnedVehicles(prev => ({
              ...prev,
              [String(message.plate)]: true
            }));
          }
          break;
        case 'spawnError':
          setLoading(false);
          setError(message.error || 'Erro ao spawnar veículo');
          toast.error(message.error || 'Erro ao spawnar veículo', {
            style: {
              background: 'rgba(10, 14, 20, 0.95)',
              color: '#EF4444',
              border: '1px solid #EF4444',
            },
            icon: '❌',
          });
          break;
        case 'spawnSuccess':
          setLoading(false);
          // Marca o veículo como spawnado
          if (message.plate) {
            setActiveVehiclePlate(String(message.plate));
            setSpawnedVehicles(prev => ({
              ...prev,
              [String(message.plate)]: true
            }));
          }
          break;
        case 'storeError':
          try {
            setLoading(false);
            if (message.error) {
              setError(message.error);
              toast.error(message.error, {
                style: {
                  background: 'rgba(10, 14, 20, 0.95)',
                  color: '#EF4444',
                  border: '1px solid #EF4444',
                },
                icon: '❌',
              });
            }
          } catch (e) {
            setError('Erro ao processar mensagem de erro');
            toast.error('Erro ao processar mensagem de erro', {
              style: {
                background: 'rgba(10, 14, 20, 0.95)',
                color: '#EF4444',
                border: '1px solid #EF4444',
              },
              icon: '⚠️',
            });
          }
          break;
        case 'storeSuccess':
          setLoading(false);
          // Se a mensagem incluir uma placa específica
          if (message.plate) {
            // Marca o veículo como não spawnado
            setSpawnedVehicles(prev => ({
              ...prev,
              [String(message.plate)]: false
            }));
            // Se este era o veículo ativo, limpa
            if (activeVehiclePlate === message.plate) {
              setActiveVehiclePlate(null);
            }
          } else {
            // Se não houver placa específica, assume que todos os veículos foram guardados
            setSpawnedVehicles({});
            setActiveVehiclePlate(null);
          }
          
          toast.success(message.message || 'Veículo guardado com sucesso!', {
            style: {
              background: 'rgba(10, 14, 20, 0.95)',
              color: 'var(--lime-green)',
              border: '1px solid var(--lime-green)',
            },
            icon: '🚗',
          });
          break;
        case 'error':
          setLoading(false);
          setError(message.error || 'Ocorreu um erro');
          toast.error(message.error || 'Ocorreu um erro', {
            style: {
              background: 'rgba(10, 14, 20, 0.95)',
              color: '#EF4444',
              border: '1px solid #EF4444',
            },
            icon: '❌',
          });
          break;
        case 'setAdmin':
          setIsAdmin(message.isAdmin || false);
          break;
        default:
          console.log('Ação desconhecida:', message.action);
      }
    });
    
    // Garante que a UI começa invisível
    updateRootVisibility(false);
    
    // Limpa a visibilidade e o event listener quando o componente é desmontado
    return () => {
      updateRootVisibility(false);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleClose]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (searchTerm) {
      return (
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    switch (activeTab) {
      case 'sports':
        return ['adder', 'zentorno', 'jester'].includes(vehicle.model.toLowerCase());
      case 'classic':
        return ['comet2', 'banshee'].includes(vehicle.model.toLowerCase());
      case 'other':
        return !['adder', 'zentorno', 'jester', 'comet2', 'banshee'].includes(vehicle.model.toLowerCase());
      default:
        return true;
    }
  });

  // Se a interface não estiver visível, não renderiza nada
  if (!isVisible) return null;

  // Quando a interface estiver visível, renderiza com o fundo escuro e centralização aprimorada
  return (
    <div className="garage-interface fixed inset-0 w-full h-full flex items-center justify-center">
      <Toaster position="top-right" />
      
      {/* Container principal com tamanho máximo e melhor centralização */}
      <div className="max-w-7xl w-full mx-auto bg-dark-bg rounded-lg shadow-2xl border border-lime-green/20 overflow-hidden flex flex-col">
        {/* Header com logo e botão de fechar */}
        <div className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-dark-bg to-card-bg border-b border-lime-green/30">
          <div className="flex items-center space-x-4">
            <img 
              src="icon.png" 
              alt="Garage Logo" 
              className="w-12 h-12 rounded-lg shadow-lime object-contain flex items-center justify-center"
            />
            <h1 className="text-3xl font-bold text-lime-green font-orbitron tracking-wider drop-shadow-lime neon-glow">METRÓPOLE GARAGE</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-card-bg hover:bg-red-500/20 border border-red-500/50 text-white transition-all duration-300"
              aria-label="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Barra de pesquisa e filtros */}
        <div className="p-6 bg-dark-bg border-b border-lime-green/10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            {/* Barra de pesquisa */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar veículo por modelo ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 rounded-full bg-card-bg border border-lime-green/30 text-white focus:outline-none focus:ring-2 focus:ring-lime-green scan-effect"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-2.5 text-lime-green"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            {/* Abas de filtro */}
            <div className="flex space-x-2">
              {['all', 'sports', 'classic', 'other'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full transition-all duration-300 cyber-border ${
                    activeTab === tab
                      ? 'bg-lime-green text-dark-bg font-medium shadow-lime'
                      : 'bg-card-bg text-white hover:bg-lime-green/20'
                  }`}
                >
                  {tab === 'all' ? 'Todos' : tab === 'sports' ? 'Esportivos' : tab === 'classic' ? 'Clássicos' : 'Outros'}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Conteúdo principal - agora ocupa todo o espaço disponível */}
        <div className="p-6 bg-dark-bg overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-xl mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner />
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="text-gray-400 text-lg">
                {searchTerm ? 'Nenhum veículo encontrado para sua busca.' : 'Nenhum veículo disponível.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVehicles.map((vehicle, index) => (
                <div
                  key={vehicle.id}
                  className="futuristic-card animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={vehicleImages[normalizeModelName(vehicle.model)] || vehicleImages.default}
                      alt={vehicle.model}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    
                    {/* Badge de spawned */}
                    {isVehicleSpawned(vehicle.plate) && (
                      <div className="absolute top-0 right-0 bg-lime-green text-dark-bg font-bold text-xs uppercase py-1 px-3 rounded-bl-md">
                        Em uso
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-xl font-bold text-white font-orbitron">{vehicle.model}</h3>
                      <div className="flex items-center mt-1">
                        <span className="bg-lime-green/20 text-lime-light px-3 py-1 rounded-full text-sm font-medium code-text">
                          {vehicle.plate}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-lime-green mr-2 pulse-glow"></div>
                        <span className="text-text-secondary">Cor: {vehicle.color}</span>
                      </div>
                      
                      <div className="text-text-secondary text-sm code-text">
                        ID: #{vehicle.id}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      {!isVehicleSpawned(vehicle.plate) ? (
                        <button
                          onClick={() => handleSpawnVehicle(vehicle.plate)}
                          disabled={loading}
                          className="vehicle-action-btn w-full py-3 px-4 rounded-lg bg-lime-green hover:bg-lime-dark text-dark-bg font-semibold transition-colors duration-300 flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                          </svg>
                          Retirar Veículo
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStoreSpecificVehicle(vehicle.plate)}
                          disabled={loading}
                          className="vehicle-action-btn w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-dark-bg font-semibold transition-colors duration-300 flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Guardar Veículo
                        </button>
                      )}
                      
                      {isAdmin && (
                        <button
                          onClick={() => handleAdminSpawnVehicle(vehicle.plate)}
                          disabled={loading}
                          className="vehicle-action-btn w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors duration-300 flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          Admin: Spawnar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;