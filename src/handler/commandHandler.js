const fs = require("fs")
const path = require("path")

const sellersFile = path.join(__dirname,"../utils/Sellers.json")

module.exports = {

addSeller(number){
    const sellers = JSON.parse(fs.readFileSync(sellersFile))

    if(!sellers.includes(number)){
        sellers.push(number)
        fs.writeFileSync(sellersFile,JSON.stringify(sellers,null,2))
    }
},

removeSeller(number){
    let sellers = JSON.parse(fs.readFileSync(sellersFile))
    sellers = sellers.filter(n=>n!==number)
    fs.writeFileSync(sellersFile,JSON.stringify(sellers,null,2))
}

}