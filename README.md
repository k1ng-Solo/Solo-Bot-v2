# 🤖 WhatsApp Business Bot

A reusable WhatsApp automation bot for small businesses (laundry, food vendors, shops) built with Node.js and Baileys.

## ✨ Features

- ✅ Auto-reply to greetings with welcome message
- 📋 Numbered menu system (1-Prices, 2-Order, 3-Contact)
- 🛒 Complete order capture system
- 📱 Owner notifications for new orders
- ⚙️ Easy customization via config file
- 📝 Session management for conversations
- 🔄 Automatic reconnection
- 📊 Logging system

## 🚀 Quick Start

### 1. Install Node.js
Download from [nodejs.org](https://nodejs.org/) (version 16+ required)

### 2. Download Project
Extract the project folder to your computer

### 3. Install Dependencies
Open terminal/command prompt in project folder:
\`\`\`bash
npm install
\`\`\`

### 4. Configure Environment
Copy `.env.example` to `.env`:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your details:
- `OWNER_NUMBER`: Your WhatsApp number (with country code, no +)
  - Example: `1234567890` (USA) or `919876543210` (India)

### 5. Customize Business
Edit `src/config/business.js`:
- Change business name
- Update prices/services
- Modify messages
- Add contact details

### 6. Run the Bot
\`\`\`bash
npm start
\`\`\`

### 7. Connect WhatsApp
1. A QR code will appear in terminal
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code
5. Wait for "Bot connected successfully!"

## 📁 Project Structure

\`\`\`
whatsapp-bot-business/
├── src/
│   ├── config/business.js      # ← EDIT THIS FOR EACH CLIENT
│   ├── handlers/               # Message processing logic
│   ├── services/               # Notifications
│   ├── utils/                  # Helpers
│   └── bot.js                  # Main entry
├── auth/                       # WhatsApp session (auto-created)
├── logs/                       # Log files (auto-created)
├── .env                        # Environment variables
└── package.json
\`\`\`

## 🎯 How It Works

### Customer Flow:
1. Customer sends "Hi" → Welcome message with menu
2. Customer types "1" → Shows prices
3. Customer types "2" → Starts order flow (3 questions)
4. Customer types "3" → Shows contact info
5. Order confirmed → Owner gets notification

### Owner Notifications:
- New orders sent instantly to your WhatsApp
- Customer messages forwarded to you
- System status updates

## 🛠️ Customization Guide

### Change Business Name
File: `src/config/business.js`
\`\`\`javascript
name: "Your Business Name",
tagline: "Your catchy tagline",
\`\`\`

### Update Services
File: `src/config/business.js`
\`\`\`javascript
services: [
  {
    id: 1,
    name: "Service Name",
    price: "$10",
    unit: "per item",
    description: "Description here"
  }
]
\`\`\`

### Change Welcome Message
File: `src/config/business.js`
\`\`\`javascript
messages: {
  welcome: "Your custom welcome message"
}
\`\`\`

## 🔧 Troubleshooting

### QR Code not showing
- Make sure terminal window is large enough
- Try: `npm start` again

### "Session expired"
- Delete `auth/` folder
- Run `npm start` again
- Scan new QR code

### Bot not responding
- Check if `OWNER_NUMBER` is set in `.env`
- Check logs in `logs/` folder
- Ensure phone has internet

### Dependencies error
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

## 📦 Deployment Options

### Local Computer
- Run on your laptop/desktop
- Must keep computer on 24/7
- Good for testing

### VPS/Cloud Server (Recommended)
- DigitalOcean, AWS, Linode
- Ubuntu 20.04+ recommended
- PM2 for process management:
  \`\`\`bash
  npm install -g pm2
  pm2 start src/bot.js --name "whatsapp-bot"
  pm2 save
  pm2 startup
  \`\`\`

### Raspberry Pi
- Low power consumption
- Can run 24/7 at home
- Perfect for small businesses

## 🔐 Security Notes

- Never share your `auth/` folder
- Keep `.env` file secret
- Don't commit credentials to git
- Use strong session names

## 📝 License

MIT License - Feel free to use for commercial purposes

## 🆘 Support

For issues or questions:
1. Check logs in `logs/` folder
2. Review this README
3. Check Baileys documentation

---

Built with ❤️ using [Baileys](https://github.com/whiskeysockets/baileys)