const fs = require("fs");
const path = require("path");

const base = __dirname;

const files = {
products: path.join(base,"products.json"),
orders: path.join(base,"orders.json"),
users: path.join(base,"users.json"),
affiliates: path.join(base,"affiliates.json"),
resellers: path.join(base,"resellers.json"),
settings: path.join(base,"settings.json")
};

function ensure(file){
if(!fs.existsSync(file)){
fs.writeFileSync(file,"[]");
}
}

function load(name){
ensure(files[name]);
return JSON.parse(fs.readFileSync(files[name]));
}

function save(name,data){
fs.writeFileSync(files[name],JSON.stringify(data,null,2));
}

module.exports = { load, save };