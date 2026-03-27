const sellers = require("./sellers.json")

module.exports = {
    isApproved(number){
        return sellers.includes(number)
    }
}