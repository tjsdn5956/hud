fx_version "cerulean"
games {"gta5"}

dependency "vrp"

ui_page "nui/index.html"
file "nui/**"

client_scripts {
	"@vrp/client/Proxy.lua",
	"@vrp/client/Tunnel.lua",
  	"client.lua"
}

server_scripts {
	"@vrp/lib/utils.lua",
	"@vrp/lib/MySQL.lua",
  	"server.lua"
}