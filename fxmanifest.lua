fx_version 'cerulean'
game 'gta5'

author 'João luiz'
description 'Sistema de Garagem'
version '1.0.0'

client_scripts {
    'client/client.lua'
}

server_scripts {
    'server/dist/src/index.js',
    'server/events.lua'
}

ui_page 'client/html/index.html'

files {
    'client/html/**',
    'server/dist/**'
}

dependency 'oxmysql'