-- Função para converter código hexadecimal (ex.: #1b6770) para RGB
function HexToRGB(hex)
    hex = hex:gsub("#", "") -- Remove o # do início
    local r = tonumber("0x" .. hex:sub(1, 2)) -- Converte os primeiros 2 caracteres para vermelho
    local g = tonumber("0x" .. hex:sub(3, 4)) -- Converte os próximos 2 caracteres para verde
    local b = tonumber("0x" .. hex:sub(5, 6)) -- Converte os últimos 2 caracteres para azul
    return r, g, b
end

-- Variável para controlar o estado da interface
local nuiActive = false

-- Função para abrir a interface da garagem
function ShowUI()
    local playerId = PlayerId() -- Obtém o ID do jogador no cliente
    local serverId = GetPlayerServerId(playerId) -- Obtém o ID do servidor do jogador
    print('ShowUI: Enviando metropole:getSteamId para o servidor com serverId ' .. serverId)
    
    -- Ativa o cursor para interagir com a interface
    SetNuiFocus(true, true)
    nuiActive = true
    
    -- Verifica se o jogador está em um veículo
    local playerPed = PlayerPedId()
    local activeVehiclePlate = nil
    
    if IsPedInAnyVehicle(playerPed, false) then
        local vehicle = GetVehiclePedIsIn(playerPed, false)
        if DoesEntityExist(vehicle) then
            activeVehiclePlate = GetVehicleNumberPlateText(vehicle)
            print('Jogador está em um veículo com placa: ' .. activeVehiclePlate)
        end
    end
    
    -- Solicita o Steam ID ao servidor
    TriggerServerEvent('metropole:getSteamId', serverId)
    
    -- Abre a interface mesmo antes de receber os dados
    SendNUIMessage({
        action = 'openGarage'
    })
    
    -- Se o jogador estiver em um veículo, define-o como veículo ativo na interface
    if activeVehiclePlate then
        Citizen.Wait(500) -- Pequeno atraso para garantir que a interface foi aberta
        SendNUIMessage({
            action = 'setActiveVehicle',
            plate = activeVehiclePlate
        })
    end
end

-- Recebe o Steam ID do servidor e abre a interface
RegisterNetEvent('metropole:receiveSteamId')
AddEventHandler('metropole:receiveSteamId', function(steamId)
    if steamId then
        print('Recebido Steam ID: ' .. steamId)
        -- Envia o evento para o servidor para buscar os veículos
        TriggerServerEvent('metropole:getVehicles', steamId)

        -- Abre a interface (NUI)
        print('Abrindo NUI...')
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'openGarage'
        })
    else
        print('Erro: Não foi possível obter o Steam ID.')
    end
end)

-- Recebe os veículos do servidor e atualiza a interface
RegisterNetEvent('metropole:setVehicles')
AddEventHandler('metropole:setVehicles', function(vehicles, spawnedVehicles)
    print('Recebido veículos: ' .. json.encode(vehicles))
    if spawnedVehicles then
        print('Recebido info de veículos spawnados: ' .. json.encode(spawnedVehicles))
    end
    SendNUIMessage({
        action = 'setVehicles',
        vehicles = vehicles,
        spawnedVehicles = spawnedVehicles
    })
end)

-- Recebe mensagens de erro do servidor
RegisterNetEvent('metropole:error')
AddEventHandler('metropole:error', function(message)
    print('Erro do servidor: ' .. message)
    SendNUIMessage({
        action = 'error',
        message = message
    })
end)

-- Recebe erro ao spawnar veículo
RegisterNetEvent('metropole:spawnError')
AddEventHandler('metropole:spawnError', function(error, plate)
  SendNUIMessage({
    action = 'spawnError',
    error = error,
    plate = plate
  })
end)

-- Recebe sucesso ao spawnar veículo
RegisterNetEvent('metropole:spawnSuccess')
AddEventHandler('metropole:spawnSuccess', function(plate)
    print('Veículo spawnado: ' .. plate)
    SendNUIMessage({
        action = 'spawnSuccess',
        plate = plate
    })
end)

-- Recebe confirmação de veículo guardado
RegisterNetEvent('metropole:storeSuccess')
AddEventHandler('metropole:storeSuccess', function(data)
    local plate = data and data.plate or nil
    local message = 'Veículo guardado com sucesso'
    if plate then
        message = message .. ' (Placa: ' .. plate .. ')'
    end
    print(message)
    
    SendNUIMessage({
        action = 'storeSuccess',
        plate = plate
    })
end)

-- Recebe erro ao guardar veículo
RegisterNetEvent('metropole:storeError')
AddEventHandler('metropole:storeError', function(error)
    print('Erro ao guardar veículo: ' .. error)
    SendNUIMessage({
        action = 'storeError',
        error = error
    })
end)

-- Callback do NUI para fechar a interface
RegisterNUICallback('close', function(data, cb)
    print('Fechando NUI...')
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = 'closeUI'
    })
    nuiActive = false
    cb('ok')
end)

-- Callback do NUI para spawnar veículo
RegisterNUICallback('spawnVehicle', function(data, cb)
    print('Solicitando spawn do veículo com placa: ' .. data.plate)
    TriggerServerEvent('metropole:spawnVehicle', data.plate)
    cb('ok')
end)

-- Callback do NUI para spawnar veículo como admin
RegisterNUICallback('adminSpawnVehicle', function(data, cb)
    print('Solicitando spawn admin do veículo com placa: ' .. data.plate)
    TriggerServerEvent('metropole:adminSpawnVehicle', data.plate)
    cb('ok')
end)

-- Callback do NUI para guardar veículo
RegisterNUICallback('storeVehicle', function(data, cb)
    print('Solicitando guardagem do veículo com placa: ' .. data.plate)
    TriggerServerEvent('metropole:storeVehicle', data.plate)
    cb('ok')
end)

-- Comando /garage para abrir a interface
RegisterCommand('garage', function(source, args, rawCommand)
    print('Executando comando /garage')
    ShowUI()
end, false)

-- Recebe evento para spawnar o veículo no cliente
RegisterNetEvent('metropole:spawnVehicleClient')
AddEventHandler('metropole:spawnVehicleClient', function(plate, model, color, customizations)
    print('Recebido evento para spawnar veículo - Placa: ' .. plate .. ', Modelo: ' .. model)
    
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local heading = GetEntityHeading(playerPed)

    -- Converte o nome do modelo para um hash
    local modelHash = GetHashKey(model)
    print('Convertendo modelo para hash: ' .. model .. ' -> ' .. modelHash)
    
    RequestModel(modelHash)
    while not HasModelLoaded(modelHash) do
        Citizen.Wait(0)
    end

    -- Spawna o veículo
    local vehicle = CreateVehicle(modelHash, coords.x, coords.y, coords.z, heading, true, false)
    SetVehicleNumberPlateText(vehicle, plate)
    SetPedIntoVehicle(playerPed, vehicle, -1)

    -- Decodifica a string JSON de customizations, se necessário
    local decodedCustomizations = customizations
    if type(customizations) == "string" then
        print('Decodificando customizations: ' .. customizations)
        decodedCustomizations = json.decode(customizations)
    end

    -- Converte as cores hexadecimais para RGB
    local primaryR, primaryG, primaryB = HexToRGB(color) -- Cor primária
    -- Se secondaryColor não estiver definido, usa a cor primária
    local secondaryColor = decodedCustomizations.secondaryColor or color
    local secondaryR, secondaryG, secondaryB = HexToRGB(secondaryColor)

    -- Aplica as cores personalizadas
    print('Aplicando cores - Primária: ' .. color .. ' (RGB: ' .. primaryR .. ', ' .. primaryG .. ', ' .. primaryB .. '), Secundária: ' .. secondaryColor .. ' (RGB: ' .. secondaryR .. ', ' .. secondaryG .. ', ' .. secondaryB .. ')')
    SetVehicleCustomPrimaryColour(vehicle, primaryR, primaryG, primaryB)
    SetVehicleCustomSecondaryColour(vehicle, secondaryR, secondaryG, secondaryB)

    -- Aplica os mods, verificando se mods existe
    if decodedCustomizations.mods and type(decodedCustomizations.mods) == "table" then
        for modType, modIndex in pairs(decodedCustomizations.mods) do
            print('Aplicando mod - Tipo: ' .. modType .. ', Índice: ' .. modIndex)
            SetVehicleMod(vehicle, tonumber(modType), modIndex)
        end
    else
        print('Nenhum mod encontrado para aplicar.')
    end

    print('Veículo spawnado: Placa ' .. plate .. ', Modelo ' .. model)
    SetModelAsNoLongerNeeded(modelHash)
end)

-- Evento para deletar um veículo
RegisterNetEvent('metropole:deleteVehicle')
AddEventHandler('metropole:deleteVehicle', function(plate)
    print('Recebido evento para deletar veículo com placa: ' .. plate)
    
    -- Obter todos os veículos no mundo
    local vehicles = GetGamePool('CVehicle')
    
    -- Procurar pelo veículo com a placa especificada
    for _, vehicle in ipairs(vehicles) do
        local vehiclePlate = GetVehicleNumberPlateText(vehicle)
        -- Remover espaços em branco para comparação exata
        vehiclePlate = vehiclePlate:gsub("%s+", "")
        plate = plate:gsub("%s+", "")
        
        if vehiclePlate:upper() == plate:upper() then
            print('Encontrado veículo com placa ' .. plate .. ', deletando...')
            -- Verifica se o jogador está no veículo
            local playerPed = PlayerPedId()
            if GetVehiclePedIsIn(playerPed, false) == vehicle then
                -- Se estiver dentro, tira o jogador do veículo
                print('Jogador está no veículo, removendo...')
                TaskLeaveVehicle(playerPed, vehicle, 0)
                -- Espera um pouco para o jogador sair do veículo
                Citizen.Wait(1500)
            end
            
            -- Deleta o veículo
            SetEntityAsMissionEntity(vehicle, true, true)
            DeleteVehicle(vehicle)
            print('Veículo com placa ' .. plate .. ' deletado')
            break
        end
    end
end)

-- Adiciona um manipulador de teclas para fechar a interface com ESC
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        if IsControlJustReleased(0, 27) or IsControlJustReleased(0, 177) then -- ESC ou BACKSPACE
            -- Verifica se a interface NUI está ativa
            if nuiActive then
                print('Tecla ESC pressionada, fechando interface...')
                SetNuiFocus(false, false)
                SendNUIMessage({
                    action = 'closeUI'
                })
                nuiActive = false
            end
        end
    end
end)