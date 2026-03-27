const fs = require("fs")
const path = require("path")

const ordersFile = path.join(__dirname,"../utils/Orders.json")

module.exports = {

create(sender,product){

const orders = JSON.parse(fs.readFileSync(ordersFile))

orders.push({
buyer: sender,
product,
status:"pending",
date: new Date()
})

fs.writeFileSync(ordersFile,JSON.stringify(orders,null,2))

}

}