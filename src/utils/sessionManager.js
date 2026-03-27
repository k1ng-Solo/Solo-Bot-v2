const sellers = require("./Sellers.json")

module.exports = {
    isApproved(number){
        return sellers.includes(number)
    }
}