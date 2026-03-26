// Static messages & templates
module.exports = {
    systemActive: `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands. And *help* for guidance.`,
    
    menu: `
*🛠️ BUSINESS ASSISTANT v5.3*

*💰 FINANCE*
• .pay - Bank info & auto payment
• .rate - Currency & Crypto Rates

*🛒 PRODUCTS*
• .add [name] [type] [file] [price] - Add product (owner only)
• .get [name] [minPrice] [maxPrice] - Get products
• .delete [id] - Delete product (owner only)
• .update [id] [field] [value] - Update product (owner only)

*📦 ORDERS*
• .order [product_name] - Place an order
• .myorders - View your orders

Type *help* for assistance.
`,

    help: `
*🆘 HELP v5.3*
• Type *.menu* to see all commands
• Finance: .pay for bank info & auto-payment, .rate for live currency & crypto
• Products: .add, .get, .delete, .update (owner only)
• Orders: .order, .myorders
• Admin-only: .add, .delete, .update
`
};