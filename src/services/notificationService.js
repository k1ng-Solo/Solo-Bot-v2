const sellers = require("../utils/sellers.json")

module.exports = {
    broadcastUpdates(sock){
        sellers.forEach(user=>{
            sock.sendMessage(user,{text:"🔔 Bot updated to latest version"})
        })
    }
}