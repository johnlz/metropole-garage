-- Spawna um veículo para o jogador
AddEventHandler('metropole:spawnVehicleLua', function(source, plate, model, color, customizations)
    print('Encaminhando spawn do veículo para o cliente - Source: ' .. source .. ', Placa: ' .. plate .. ', Modelo: ' .. model)
    TriggerClientEvent('metropole:spawnVehicleClient', source, plate, model, color, customizations)
end)

-- Spawna um veículo como admin
AddEventHandler('metropole:adminSpawnVehicleLua', function(source, plate, model, color, customizations)
    print('Encaminhando spawn do veículo (admin) para o cliente - Source: ' .. source .. ', Placa: ' .. plate .. ', Modelo: ' .. model)
    TriggerClientEvent('metropole:spawnVehicleClient', source, plate, model, color, customizations)
end)