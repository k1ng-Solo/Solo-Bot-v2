let products = []

module.exports = {
    add(product){
        products.push(product)
    },
    get(){
        return products
    }
}