// src/handler/MessageHandler.js

const fs = require("fs");
const path = require("path");
const Memory = require("../utils/memory");
const Products = require("../utils/products");
const Sellers = require("../utils/sellers.json");
const Orders = require("../utils/orders.json");
const NotificationService = require("../services/notificationService");

const greetings = [
  "hi", "hello", "hey", "hwfr", "hw fa", "hw fr", "how far", "wassup", "wagwan", "hyd"
];

module.exports = async function handleMessage(client, message) {
  try {
    const chatId = message.from;
    const body = message.body.trim().toLowerCase();

    // Check if user is approved
    const isApproved = Sellers.includes(chatId);

    // FIRST TIME USER: show business info & wizard
    if (!isApproved) {
      if (!Memory.hasUser(chatId)) {
        await client.sendMessage(
          chatId,
          "*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands."
        );
        Memory.addUser(chatId, { firstTime: true });
      }
      // Don't reply further if not approved
      return;
    }

    // COMMANDS HANDLER
    if (body.startsWith(".")) {
      const args = body.slice(1).split(" ");
      const command = args.shift();

      switch (command) {
        // === MENU ===
        case "menu":
          await client.sendMessage(chatId,
            `*🛠️ BUSINESS ASSISTANT v5.3*\n\n*💰 FINANCE*\n• .pay - Bank info\n• .rate - Currency & Crypto Rates\n\n*🛒 PRODUCTS*\n• .add [name] [type] [file] [price] - Add product (owner only)\n• .get [name] [minPrice] [maxPrice] - Get products\n• .delete [id] - Delete product (owner only)\n• .update [id] [field] [value] - Update product (owner only)\n\n*👤 SELLER DASHBOARD*\n• .analytics - View sales stats\n• .orders - View orders\n• .broadcast - Send messages to buyers\n\nType *help* for guidance.`
          );
          break;

        // === FINANCE ===
        case "pay":
          await client.sendMessage(chatId, Memory.getBankInfo() || "Bank info not set.");
          break;

        case "rate":
          const rates = Memory.getRates(); // auto updated daily with crypto
          let rateText = "*💱 Exchange Rates*\n";
          rates.forEach(r => {
            rateText += `• ${r.currency}: ${r.rate}\n`;
          });
          await client.sendMessage(chatId, rateText);
          break;

        // === PRODUCT HANDLING ===
        case "add":
          if (!Memory.isOwner(chatId)) return;
          const [name, type, file, price] = args;
          Products.addProduct({ name, type, file, price, seller: chatId });
          await client.sendMessage(chatId, `Product "${name}" added successfully.`);
          break;

        case "get":
          const searchName = args[0] || "";
          const minPrice = parseFloat(args[1]) || 0;
          const maxPrice = parseFloat(args[2]) || Infinity;
          const found = Products.getProducts(searchName, minPrice, maxPrice);
          await client.sendMessage(chatId, found.length > 0
            ? found.map(p => `${p.name} - ${p.type} - ₦${p.price}`).join("\n")
            : "No products found."
          );
          break;

        case "delete":
        case "update":
          if (!Memory.isOwner(chatId)) return;
          const productId = args[0];
          if (command === "delete") {
            Products.deleteProduct(productId);
            await client.sendMessage(chatId, `Product ${productId} deleted.`);
          } else {
            const field = args[1];
            const value = args.slice(2).join(" ");
            Products.updateProduct(productId, field, value);
            await client.sendMessage(chatId, `Product ${productId} updated.`);
          }
          break;

        // === SELLER DASHBOARD ===
        case "analytics":
          if (!Memory.isOwner(chatId)) return;
          const stats = Products.getAnalytics(chatId);
          await client.sendMessage(chatId, `*📊 Analytics*\n${JSON.stringify(stats, null, 2)}`);
          break;

        case "orders":
          if (!Memory.isOwner(chatId)) return;
          const orders = Orders.getOrdersBySeller(chatId);
          await client.sendMessage(chatId, orders.length > 0
            ? orders.map(o => `Order ${o.id}: ${o.productName} -> ${o.buyer}`).join("\n")
            : "No orders yet."
          );
          break;

        case "broadcast":
          if (!Memory.isOwner(chatId)) return;
          const text = args.join(" ");
          Memory.broadcast(text);
          await client.sendMessage(chatId, "Broadcast sent.");
          break;

        default:
          await client.sendMessage(chatId, "Unknown command. Type *.menu* for commands.");
      }

    } else {
      // === GREETINGS ===
      if (greetings.includes(body)) {
        await client.sendMessage(chatId,
          "*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands."
        );
        return;
      }

      // === AUTO ORDER ROUTING / BUYER REQUESTS ===
      const productRequest = Products.findProductByKeyword(body);
      if (productRequest) {
        const sellerId = productRequest.seller;
        await client.sendMessage(chatId, `Yes, we have "${productRequest.name}". Routing your request to the seller.`);
        await client.sendMessage(sellerId, `New buyer request from ${chatId}: "${productRequest.name}"`);
        Orders.createOrder({ product: productRequest.name, buyer: chatId, seller: sellerId });
      }
    }

  } catch (err) {
    console.error("MessageHandler error:", err);
  }
};