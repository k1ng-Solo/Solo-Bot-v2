const fs = require("fs")

module.exports = {
    read(file){
        return JSON.parse(fs.readFileSync(file))
    },
    write(file,data){
        fs.writeFileSync(file,JSON.stringify(data,null,2))
    }
}