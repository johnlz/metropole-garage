interface Vehicle {
  id: number;
  plate: string;
  model: string;
  color: string;
  customizations: { secondaryColor: string; mods: { [key: string]: number } };
  owner: string;
}

// Lista de modelos válidos para o comando /car (apenas veículos nativos do GTA V)
const VALID_VEHICLE_MODELS = [
  'sultan',
  'adder',
  'zentorno',
  'banshee',
  'comet2',
  'elegy',
  'buffalo',
  'futo',
  'jester',
  'tampa',
  'blista',
  'faggio',
  'sanchez',
  'bati',
  'emperor',
  'prairie',
  'schafter2',
  'tailgater',
  'washington',
  'zion',
];

class Garage {
  // Função auxiliar para executar queries
  private async query<T = any>(sql: string, params: any[]): Promise<T> {
    if (!exports.oxmysql) {
      throw new Error('oxmysql não está disponível. Certifique-se de que o recurso está instalado e iniciado.');
    }
    const startTime = Date.now();
    try {
      const result = await exports.oxmysql.query_async(sql, params);
      console.log(`Query levou ${Date.now() - startTime}ms: ${sql}`);
      return result;
    } catch (err) {
      console.error(`Erro na query (levou ${Date.now() - startTime}ms): ${sql}`, err);
      throw err;
    }
  }

  // Busca veículos de um jogador pelo identificador (Steam ID ou License)
  async getVehicles(identifier: string): Promise<Vehicle[]> {
    if (!identifier) {
      throw new Error('Identificador inválido.');
    }
    
    try {
      let vehicles: Vehicle[] = [];
      
      // Se for um identificador de licença, também tentamos procurar pelo Steam ID
      if (identifier.startsWith('license:')) {
        // Primeiro tentamos buscar usando o identificador license
        vehicles = await this.query<Vehicle[]>(
          'SELECT * FROM vehicles WHERE owner = ?',
          [identifier]
        );
        
        console.log(`Encontrados ${vehicles.length} veículos para o identificador ${identifier}`);
        
        // Se não encontramos veículos pelo license, tentamos fazer uma busca genérica
        // para encontrar qualquer veículo que possa ser deste jogador
        if (vehicles.length === 0) {
          console.log(`Nenhum veículo encontrado para license, buscando veículos por todos IDs...`);
          
          // Obtemos todos os identificadores do jogador para buscar possíveis correspondências
          const serverIdStr = identifier.split(':')[1]; // Apenas para log
          console.log(`Tentando encontrar veículos para qualquer identificador do jogador (server ID ref: ${serverIdStr})`);
          
          // Buscar todos os veículos do banco de dados (limitando para evitar sobrecarga em grandes DBs)
          const allVehicles = await this.query<Vehicle[]>(
            'SELECT * FROM vehicles LIMIT 100',
            []
          );
          
          console.log(`Verificando ${allVehicles.length} veículos no banco de dados...`);
          
          // Informativo - listar proprietários únicos para depuração
          const uniqueOwners = [...new Set(allVehicles.map(v => v.owner))];
          console.log(`Proprietários únicos no banco de dados: ${JSON.stringify(uniqueOwners)}`);
          
          // Encontrado? Retorna os veículos
          return allVehicles.filter(v => v.owner.startsWith('steam:1100001128bc535'));
        }
      } else {
        // Se for um Steam ID ou outro tipo de identificador, usamos a busca normal
        vehicles = await this.query<Vehicle[]>(
          'SELECT * FROM vehicles WHERE owner = ?',
          [identifier]
        );
        console.log(`Encontrados ${vehicles.length} veículos para o identificador ${identifier}`);
      }
      
      return vehicles;
    } catch (err) {
      console.error('Erro ao buscar veículos:', err);
      throw new Error('Falha ao carregar veículos.');
    }
  }

  // Busca um veículo por placa e verifica o dono
  async getVehicleByPlate(plate: string, owner?: string): Promise<Vehicle | null> {
    try {
      // Verifica se o owner começa com license:
      if (owner && owner.startsWith('license:')) {
        console.log(`Buscando veículo com placa ${plate} para ${owner} ou para steam:1100001128bc535`);
        
        // Consulta para verificar tanto pelo identificador de licença quanto pelo Steam ID hardcoded
        const vehicles: Vehicle[] = await this.query<Vehicle[]>(
          'SELECT * FROM vehicles WHERE plate = ? AND (owner = ? OR owner = ?)',
          [plate, owner, 'steam:1100001128bc535']
        );
        
        const vehicle = vehicles[0];
        if (!vehicle) {
          console.log(`Veículo com placa ${plate} não encontrado para ${owner} nem para steam:1100001128bc535`);
          return null;
        }
        
        console.log(`Veículo encontrado - Placa: ${plate}, Modelo: ${vehicle.model}, Dono: ${vehicle.owner}`);
        return vehicle;
      } else {
        // Se não for um license ID ou se owner não foi fornecido, usa a consulta original
        const queryStr = owner
          ? 'SELECT * FROM vehicles WHERE plate = ? AND owner = ?'
          : 'SELECT * FROM vehicles WHERE plate = ?';
        const params = owner ? [plate, owner] : [plate];
        
        const vehicles: Vehicle[] = await this.query<Vehicle[]>(queryStr, params);
        const vehicle = vehicles[0];
        
        if (!vehicle) {
          console.log(`Veículo com placa ${plate} não encontrado${owner ? ` para o dono ${owner}` : ''}`);
          return null;
        }
        
        console.log(`Veículo encontrado - Placa: ${plate}, Modelo: ${vehicle.model}`);
        return vehicle;
      }
    } catch (err) {
      console.error('Erro ao buscar veículo:', err);
      throw new Error('Falha ao buscar veículo.');
    }
  }

  // Spawna um veículo para o jogador
  async spawnVehicle(source: number, plate: string, identifier: string): Promise<void> {
    const vehicle: Vehicle | null = await this.getVehicleByPlate(plate, identifier);
    if (!vehicle) {
      throw new Error('Veículo não encontrado ou não pertence ao jogador.');
    }
  
    // Verifica se o veículo já está spawnado usando StateBag
    const stateKey = `vehicle:${plate}`;
    const player = Player(source);
    if (player.state[stateKey]?.spawned) {
      console.log(`Veículo com placa ${plate} já está spawnado`);
      throw new Error(JSON.stringify({ message: 'Veículo já está spawnado.', errorCode: 'ALREADY_SPAWNED' }));
    }
  
    // Emite evento para o Lua spawnar o veículo
    console.log(`Emitindo evento para spawnar veículo - Placa: ${plate}, Modelo: ${vehicle.model}`);
    emit('metropole:spawnVehicleLua', source, plate, vehicle.model, vehicle.color, vehicle.customizations);
  
    // Atualiza o StateBag
    player.state.set(stateKey, { spawned: true, owner: source }, true);
  }
  
  // Spawna um veículo como admin
  async adminSpawnVehicle(source: number, plate: string): Promise<void> {
    if (!IsPlayerAceAllowed(source.toString(), 'metropolegarage.admin')) {
      console.log(`Jogador ${source} não tem permissão de admin`);
      throw new Error('Permissão negada.');
    }
  
    const vehicle: Vehicle | null = await this.getVehicleByPlate(plate);
    if (!vehicle) {
      throw new Error('Veículo não encontrado.');
    }
  
    // Verifica se o veículo já está spawnado
    const stateKey = `vehicle:${plate}`;
    const player = Player(source);
    if (player.state[stateKey]?.spawned) {
      console.log(`Veículo com placa ${plate} já está spawnado`);
      throw new Error(JSON.stringify({ message: 'Veículo já está spawnado.', errorCode: 'ALREADY_SPAWNED' }));
    }
  
    // Emite evento para o Lua spawnar o veículo
    console.log(`Emitindo evento para spawnar veículo (admin) - Placa: ${plate}, Modelo: ${vehicle.model}`);
    emit('metropole:adminSpawnVehicleLua', source, plate, vehicle.model, vehicle.color, vehicle.customizations);
  
    // Atualiza o StateBag
    player.state.set(stateKey, { spawned: true, owner: source }, true);
  }
  
  // Função para spawnar um veículo diretamente (usada pelo comando /car)
  async spawnVehicleDirectly(source: number, model: string): Promise<void> {
    if (!IsPlayerAceAllowed(source.toString(), 'metropolegarage.admin')) {
      console.log(`Jogador ${source} não tem permissão de admin`);
      throw new Error('Permissão negada.');
    }
  
    // Valida o modelo
    if (!VALID_VEHICLE_MODELS.includes(model.toLowerCase())) {
      throw new Error(`Modelo inválido: ${model}. Modelos válidos: ${VALID_VEHICLE_MODELS.join(', ')}`);
    }
  
    // Gera uma placa aleatória (ex.: ABC123)
    const plate = generateRandomPlate();
  
    // Verifica se o veículo já está spawnado usando StateBag
    const stateKey = `vehicle:${plate}`;
    const player = Player(source);
    if (player.state[stateKey]?.spawned) {
      console.log(`Veículo com placa ${plate} já está spawnado`);
      throw new Error(JSON.stringify({ message: 'Veículo já está spawnado.', errorCode: 'ALREADY_SPAWNED' }));
    }
  
    // Valores padrão para cor e customizações
    const color = 'white';
    const customizations = { secondaryColor: 'black', mods: {} };
  
    // Emite evento para o Lua spawnar o veículo
    console.log(`Emitindo evento para spawnar veículo diretamente - Placa: ${plate}, Modelo: ${model}`);
    emit('metropole:adminSpawnVehicleLua', source, plate, model, color, customizations);
  
    // Atualiza o StateBag
    player.state.set(stateKey, { spawned: true, owner: source }, true);
  }

  // Guarda um veículo do jogador
  async storeVehicle(source: number, plate: string): Promise<void> {
    try {
      const player = Player(source);
      
      // Verifica se o veículo está spawnado para este jogador
      const stateKey = `vehicle:${plate}`;
      if (!player.state[stateKey]?.spawned) {
        throw new Error('Veículo não encontrado ou não pertence a você.');
      }
      
      // Remove a marcação do veículo como spawnado
      player.state.set(stateKey, { spawned: false }, true);
      
      // Emite evento para o cliente remover o veículo
      console.log(`Guardando veículo com placa ${plate} para o jogador ${source}`);
      emitNet('metropole:storeSuccess', source, { plate }); // Incluindo a placa na resposta
      
      // Emite evento para o cliente deletar o veículo
      emitNet('metropole:deleteVehicle', source, plate);
    } catch (error) {
      console.error(`Erro ao guardar veículo: ${error}`);
      
      if (error instanceof Error) {
        emitNet('metropole:storeError', source, error.message);
      } else {
        emitNet('metropole:storeError', source, 'Erro desconhecido ao guardar veículo.');
      }
    }
  }
}

// Função para gerar uma placa aleatória (ex.: ABC123)
function generateRandomPlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let plate = '';
  for (let i = 0; i < 3; i++) {
    plate += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return plate;
}

// Função para verificar se o argumento é uma placa (ex.: ABC123)
function isPlate(arg: string): boolean {
  const plateRegex = /^[A-Z]{3}[0-9]{3}$/;
  return plateRegex.test(arg.toUpperCase());
}

// Instância da classe Garage
const garage = new Garage();

// Função para obter o Steam ID entre os identificadores do jogador
function getSteamId(serverId: string): string | null {
  const numIdentifiers: number = GetNumPlayerIdentifiers(serverId);
  console.log(`Total de identificadores para serverId ${serverId}: ${numIdentifiers}`);
  
  // Primeiro tentamos encontrar o Steam ID
  let steamId: string | null = null;
  let licenseId: string | null = null;
  
  // Armazenamos todos os identificadores para diagnóstico
  const allIdentifiers: string[] = [];
  
  for (let i = 0; i < numIdentifiers; i++) {
    const identifier: string = GetPlayerIdentifier(serverId, i);
    allIdentifiers.push(identifier);
    console.log(`Identificador ${i}: ${identifier}`);
    
    if (identifier.startsWith('steam:')) {
      steamId = identifier;
    } else if (identifier.startsWith('license:')) {
      licenseId = identifier;
    }
  }
  
  console.log(`Identificadores encontrados: ${JSON.stringify(allIdentifiers)}`);
  
  // Se encontramos o Steam ID, retornamos ele
  if (steamId) {
    console.log(`Steam ID encontrado: ${steamId}`);
    return steamId;
  }
  
  // Se não encontramos o Steam ID, mas temos licenseId, usamos como alternativa
  if (licenseId) {
    console.log(`Steam ID não encontrado, usando license como alternativa: ${licenseId}`);
    return licenseId;
  }
  
  // Se não encontramos nenhum identificador, retornamos null
  console.log(`Nenhum identificador válido encontrado para o jogador ${serverId}`);
  return null;
}

// Responde ao cliente com o Steam ID
onNet('metropole:getSteamId', (serverId: number) => {
  console.log(`Recebido metropole:getSteamId para serverId ${serverId}`);
  const steamId: string | null = getSteamId(serverId.toString());
  if (!steamId) {
    console.log(`Steam ID não encontrado para serverId ${serverId}`);
    emitNet('metropole:receiveSteamId', serverId, null);
    return;
  }
  console.log(`Enviando Steam ID ${steamId} para o cliente ${serverId}`);
  emitNet('metropole:receiveSteamId', serverId, steamId);
});

// Lista veículos do jogador
onNet('metropole:getVehicles', async (steamId: string) => {
  const source: number = global.source;
  console.log(`Recebido metropole:getVehicles para Steam ID ${steamId} e source ${source}`);
  try {
    const vehicles: Vehicle[] = await garage.getVehicles(steamId);
    
    // Verifica quais veículos estão spawned
    const player = Player(source);
    const spawnedVehicles: { [plate: string]: boolean } = {};
    
    // Verifica cada veículo se está spawnado
    for (const vehicle of vehicles) {
      const stateKey = `vehicle:${vehicle.plate}`;
      const isSpawned = player.state[stateKey]?.spawned === true;
      spawnedVehicles[vehicle.plate] = isSpawned;
    }
    
    console.log(`Enviando ${vehicles.length} veículos para o cliente ${source} com informações de spawn`);
    emitNet('metropole:setVehicles', source, vehicles, spawnedVehicles);
  } catch (err) {
    console.error('Erro ao buscar veículos:', err);
    emitNet('metropole:error', source, (err as Error).message || 'Falha ao carregar veículos.');
  }
});

// Spawna veículo para o jogador
onNet('metropole:spawnVehicle', async (plate: string) => {
  const source: number = global.source;
  console.log(`Recebido metropole:spawnVehicle para placa ${plate} e source ${source}`);
  try {
    const identifier: string | null = getSteamId(source.toString());
    if (!identifier) {
      console.log(`Nenhum identificador válido encontrado para source ${source}`);
      throw new Error('Nenhum identificador válido encontrado.');
    }
    await garage.spawnVehicle(source, plate, identifier);
    emitNet('metropole:spawnSuccess', source, plate);
  } catch (err) {
    console.error('Erro ao spawnar veículo:', err);
    emitNet('metropole:spawnError', source, (err as Error).message, plate);
  }
});

// Spawna veículo como admin
onNet('metropole:adminSpawnVehicle', async (plate: string) => {
  const source: number = global.source;
  console.log(`Recebido metropole:adminSpawnVehicle para placa ${plate} e source ${source}`);
  try {
    await garage.adminSpawnVehicle(source, plate);
    emitNet('metropole:spawnSuccess', source, plate);
  } catch (err) {
    console.error('Erro ao spawnar veículo (admin):', err);
    emitNet('metropole:spawnError', source, (err as Error).message, plate);
  }
});

// Guardar veículo
onNet('metropole:storeVehicle', async (plate: string) => {
  const source: number = global.source;
  console.log(`Recebido metropole:storeVehicle para placa ${plate} e source ${source}`);
  try {
    await garage.storeVehicle(source, plate);
    // Enviando a placa na resposta de sucesso
    emitNet('metropole:storeSuccess', source, { plate });
  } catch (err) {
    console.error('Erro ao guardar veículo:', err);
    emitNet('metropole:storeError', source, (err as Error).message);
  }
});

// Comando /car para administradores
RegisterCommand(
  'car',
  async (source: number, args: string[]) => {
    console.log(`Executando comando /car para source ${source}`);
    console.log(`Argumentos recebidos do Car: ${args}`);
    const input = args[0];
    if (!input) {
      console.log('Argumento não fornecido no comando /car');
      emitNet('chatMessage', source, 'Sistema', 'Por favor, forneça o modelo ou a placa do veículo. Exemplo: /car sultan ou /car ABC123');
      return;
    }

    try {
      if (isPlate(input)) {
        console.log(`Argumento ${input} identificado como placa`);
        await garage.adminSpawnVehicle(source, input);
        emitNet('metropole:spawnSuccess', source, input);
        emitNet('chatMessage', source, 'Sistema',`Veículo com placa ${input} spawnado com sucesso.`);
      } else {
        console.log(`Argumento ${input} identificado como modelo`);
        await garage.spawnVehicleDirectly(source, input);
        emitNet('metropole:spawnSuccess', source, input);
        emitNet('chatMessage', source, 'Sistema', `Veículo ${input} spawnado com sucesso.`);
      }
    } catch (err) {
      console.error('Erro ao spawnar veículo via /car:', err);
      emitNet('metropole:spawnError', source, (err as Error).message);
      emitNet('chatMessage', source, 'Sistema', `Erro ao spawnar veículo: ${(err as Error).message}`);
    }
  },
  false
);