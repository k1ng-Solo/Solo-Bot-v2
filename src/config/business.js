/**
 * BUSINESS CONFIGURATION FILE
 * Edit these settings for each new client
 */

const businessConfig = {
  // ==========================================
  // BASIC BUSINESS INFO
  // ==========================================
  
  name: "Fresh Laundry Express",
  tagline: "We wash, you relax! 🧺✨",
  currency: "$",
  
  // ==========================================
  // CONTACT DETAILS
  // ==========================================
  
  contact: {
    phone: "+1 (555) 123-4567",
    email: "hello@freshlaundry.com",
    address: "123 Main Street, Downtown, City 12345",
    hours: "Mon-Sat: 8AM - 8PM | Sunday: 10AM - 4PM",
    website: "www.freshlaundry.com"
  },

  // ==========================================
  // SERVICES & PRICES
  // Format: { id: number, name: string, price: string, description: string }
  // ==========================================
  
  services: [
    {
      id: 1,
      name: "Wash & Fold",
      price: "$2.50",
      unit: "per lb",
      description: "Regular wash and dry with folding"
    },
    {
      id: 2,
      name: "Dry Cleaning",
      price: "$8.00",
      unit: "per item",
      description: "Professional dry cleaning for delicate items"
    },
    {
      id: 3,
      name: "Ironing Service",
      price: "$3.00",
      unit: "per item",
      description: "Steam ironing with perfect creases"
    },
    {
      id: 4,
      name: "Express Service",
      price: "$5.00",
      unit: "extra",
      description: "Same day delivery (4 hours)"
    },
    {
      id: 5,
      name: "Monthly Plan",
      price: "$49.99",
      unit: "per month",
      description: "Unlimited wash & fold up to 50 lbs"
    }
  ],

  // ==========================================
  // MESSAGES & RESPONSES
  // Customize the tone and content
  // ==========================================
  
  messages: {
    // Greeting messages (bot responds to these keywords)
    greetings: ['hi', 'hello', 'hey', 'start', 'menu', 'help'],
    
    // Welcome message sent when user says hi
    welcome: `👋 *Welcome to {businessName}!* 👋\n\n{businessTagline}\n\nHow can we help you today? Please reply with a number:\n\n*1️⃣* → Prices & Services\n*2️⃣* → Place an Order\n*3️⃣* → Contact Information\n\n_Type a number to continue..._`,
    
    // When user sends unknown message
    unknown: `❓ Sorry, I didn't understand that.\n\nPlease reply with:\n*1* for Prices\n*2* to Order\n*3* for Contact Info\n\nOr type *menu* to see this again.`,
    
    // Goodbye message
    goodbye: `Thank you for choosing {businessName}! 👋\n\nHave a great day! Feel free to message us anytime.`
  },

  // ==========================================
  // ORDER SETTINGS
  // ==========================================
  
  order: {
    // Questions to ask during order flow
    questions: [
      "What items would you like to get cleaned? (e.g., 3 shirts, 2 pants, 1 dress)",
      "When would you like pickup? (e.g., Today 3PM, Tomorrow morning)",
      "Any special instructions? (stains, delicate fabric, etc.)\nType 'none' if no special requests."
    ],
    
    // Confirmation message before sending to owner
    confirmationTemplate: `📋 *Order Summary*\n\n👤 Customer: {customerName}\n📱 Number: {customerNumber}\n\n🧺 Items: {items}\n🕐 Pickup: {pickupTime}\n📝 Notes: {notes}\n\n✅ Please confirm by typing *YES* to place this order, or *NO* to cancel.`
  },

  // ==========================================
  // NOTIFICATIONS TO OWNER
  // ==========================================
  
  ownerNotifications: {
    newOrder: `🚨 *NEW ORDER RECEIVED!* 🚨\n\n📱 From: {customerNumber}\n👤 Name: {customerName}\n\n🧺 Order Details:\n{orderDetails}\n\n⏰ Received at: {timestamp}`,
    
    customerQuery: `💬 *New Message from Customer*\n\nFrom: {customerNumber}\nMessage: {message}\n\n⏰ {timestamp}`
  },

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  
  // Replace placeholders in messages
  formatMessage(template, data = {}) {
    let message = template
      .replace(/{businessName}/g, this.name)
      .replace(/{businessTagline}/g, this.tagline);
    
    // Replace any other placeholders passed in data
    Object.keys(data).forEach(key => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    });
    
    return message;
  },

  // Generate services menu
  getServicesMenu() {
    let menu = `💰 *Our Services & Prices*\n\n${this.name}\n${"=".repeat(20)}\n\n`;
    
    this.services.forEach(service => {
      menu += `*${service.id}️⃣ ${service.name}*\n`;
      menu += `   💵 Price: ${service.price}/${service.unit}\n`;
      menu += `   📝 ${service.description}\n\n`;
    });
    
    menu += `⬅️ Type *0* to go back to main menu`;
    return menu;
  },

  // Generate contact info
  getContactInfo() {
    return `📞 *Contact Information*\n\n*${this.name}*\n\n` +
           `📱 Phone: ${this.contact.phone}\n` +
           `📧 Email: ${this.contact.email}\n` +
           `📍 Address: ${this.contact.address}\n` +
           `🌐 Website: ${this.contact.website}\n\n` +
           `🕐 *Working Hours:*\n${this.contact.hours}\n\n` +
           `⬅️ Type *0* to go back to main menu`;
  }
};

module.exports = businessConfig;