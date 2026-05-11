import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "pavi",
  database: "agroconnect",
});

// Major Tamil Nadu cities with their key markets
const markets = [
  { district: "Chennai",     market_name: "Koyambedu Market" },
  { district: "Coimbatore",  market_name: "Coimbatore Regulated Market" },
  { district: "Madurai",     market_name: "Madurai Mattuthavani Market" },
  { district: "Salem",       market_name: "Salem Regulated Market" },
  { district: "Trichy",      market_name: "Trichy Ariyamangalam Market" },
  { district: "Tirunelveli", market_name: "Tirunelveli Regulated Market" },
  { district: "Vellore",     market_name: "Vellore Regulated Market" },
  { district: "Erode",       market_name: "Erode Regulated Market" },
  { district: "Thanjavur",   market_name: "Thanjavur Regulated Market" },
  { district: "Tiruppur",    market_name: "Tiruppur Regulated Market" },
];

// Commodity prices per market (realistic Tamil Nadu mandi rates in ₹/quintal)
// Format: [commodity, variety, min, modal, max]
const pricesByMarket = {
  "Koyambedu Market": [
    ["Tomato",      "Local",       800,  1200, 1600],
    ["Onion",       "Nasik",      1200,  1500, 1800],
    ["Potato",      "Jyoti",      1400,  1600, 1900],
    ["Brinjal",     "Local",       600,   900, 1200],
    ["Banana",      "Robusta",    1500,  1800, 2200],
    ["Coconut",     "Hybrid",     9000, 10500,12000],
    ["Green Chilli","Local",      2000,  2800, 3500],
    ["Carrot",      "Local",      1200,  1600, 2000],
    ["Beans",       "Local",      1500,  2000, 2500],
    ["Cabbage",     "Local",       400,   600,  900],
  ],
  "Coimbatore Regulated Market": [
    ["Tomato",      "Hybrid",      700,  1100, 1500],
    ["Onion",       "Local",      1100,  1400, 1700],
    ["Turmeric",    "Erode",      6500,  7200, 8000],
    ["Coconut",     "Hybrid",     8500, 10000,11500],
    ["Banana",      "Nendran",    2000,  2500, 3000],
    ["Tapioca",     "Local",       500,   700,  900],
    ["Groundnut",   "TMV-2",      4500,  5000, 5500],
    ["Maize",       "Hybrid",     1600,  1800, 2000],
    ["Sorghum",     "Local",      1800,  2000, 2200],
    ["Ragi",        "Local",      2200,  2500, 2800],
  ],
  "Madurai Mattuthavani Market": [
    ["Tomato",      "Local",       750,  1050, 1400],
    ["Onion",       "Nasik",      1200,  1450, 1750],
    ["Banana",      "Poovan",     1200,  1500, 1900],
    ["Jasmine",     "Local",      8000, 10000,14000],
    ["Coconut",     "Hybrid",     8000,  9500,11000],
    ["Brinjal",     "Local",       500,   800, 1100],
    ["Drumstick",   "Local",      2000,  2800, 3500],
    ["Bitter Gourd","Local",      1500,  2000, 2500],
    ["Ash Gourd",   "Local",       400,   600,  800],
    ["Pumpkin",     "Local",       500,   700,  900],
  ],
  "Salem Regulated Market": [
    ["Mango",       "Alphonso",   3000,  4000, 5500],
    ["Tomato",      "Hybrid",      800,  1100, 1500],
    ["Onion",       "Local",      1000,  1300, 1600],
    ["Tamarind",    "Local",      5000,  6000, 7000],
    ["Coconut",     "Hybrid",     8500,  9800,11200],
    ["Banana",      "Robusta",    1400,  1700, 2100],
    ["Groundnut",   "TMV-2",      4800,  5200, 5800],
    ["Turmeric",    "Salem",      6000,  7000, 8000],
    ["Maize",       "Hybrid",     1500,  1750, 2000],
    ["Paddy",       "ADT-36",     1800,  2000, 2200],
  ],
  "Trichy Ariyamangalam Market": [
    ["Paddy",       "ADT-43",     1900,  2100, 2300],
    ["Banana",      "Poovan",     1100,  1400, 1800],
    ["Coconut",     "Hybrid",     8000,  9500,11000],
    ["Tomato",      "Local",       700,  1000, 1400],
    ["Onion",       "Nasik",      1100,  1400, 1700],
    ["Groundnut",   "TMV-2",      4500,  5000, 5600],
    ["Tamarind",    "Local",      4800,  5800, 6800],
    ["Brinjal",     "Local",       500,   750, 1050],
    ["Drumstick",   "Local",      1800,  2500, 3200],
    ["Green Gram",  "Local",      5500,  6200, 7000],
  ],
  "Tirunelveli Regulated Market": [
    ["Banana",      "Nendran",    2200,  2700, 3200],
    ["Coconut",     "Hybrid",     8200,  9600,11000],
    ["Paddy",       "CO-47",      1850,  2050, 2250],
    ["Tomato",      "Local",       650,   950, 1300],
    ["Tamarind",    "Local",      5200,  6200, 7200],
    ["Groundnut",   "TMV-2",      4600,  5100, 5700],
    ["Onion",       "Local",      1000,  1300, 1600],
    ["Brinjal",     "Local",       450,   700, 1000],
    ["Bitter Gourd","Local",      1400,  1900, 2400],
    ["Cluster Beans","Local",     1200,  1700, 2200],
  ],
  "Vellore Regulated Market": [
    ["Tomato",      "Hybrid",      900,  1250, 1650],
    ["Onion",       "Nasik",      1150,  1450, 1750],
    ["Mango",       "Banganapalli",2500, 3500, 4800],
    ["Coconut",     "Hybrid",     8800, 10200,11800],
    ["Banana",      "Robusta",    1300,  1600, 2000],
    ["Groundnut",   "TMV-2",      4700,  5200, 5800],
    ["Paddy",       "ADT-36",     1800,  2000, 2200],
    ["Tamarind",    "Local",      4900,  5900, 6900],
    ["Brinjal",     "Local",       550,   800, 1100],
    ["Beans",       "Local",      1400,  1900, 2400],
  ],
  "Erode Regulated Market": [
    ["Turmeric",    "Erode",      6800,  7500, 8500],
    ["Coconut",     "Hybrid",     8600,  9900,11400],
    ["Banana",      "Robusta",    1400,  1700, 2100],
    ["Tomato",      "Hybrid",      750,  1050, 1450],
    ["Onion",       "Local",      1050,  1350, 1650],
    ["Groundnut",   "TMV-2",      4600,  5100, 5700],
    ["Maize",       "Hybrid",     1550,  1800, 2050],
    ["Sorghum",     "Local",      1750,  2000, 2250],
    ["Cotton",      "MCU-5",     5500,  6200, 7000],
    ["Tamarind",    "Local",      5000,  6000, 7000],
  ],
  "Thanjavur Regulated Market": [
    ["Paddy",       "ADT-43",     1950,  2150, 2350],
    ["Rice",        "Ponni",      3200,  3600, 4000],
    ["Banana",      "Poovan",     1200,  1500, 1900],
    ["Coconut",     "Hybrid",     8300,  9700,11200],
    ["Tomato",      "Local",       700,  1000, 1350],
    ["Onion",       "Nasik",      1100,  1400, 1700],
    ["Groundnut",   "TMV-2",      4500,  5000, 5600],
    ["Green Gram",  "Local",      5800,  6500, 7300],
    ["Black Gram",  "Local",      5500,  6200, 7000],
    ["Tamarind",    "Local",      4800,  5800, 6800],
  ],
  "Tiruppur Regulated Market": [
    ["Coconut",     "Hybrid",     8700, 10100,11600],
    ["Banana",      "Robusta",    1350,  1650, 2050],
    ["Tomato",      "Hybrid",      780,  1080, 1480],
    ["Onion",       "Nasik",      1100,  1400, 1700],
    ["Turmeric",    "Erode",      6600,  7300, 8200],
    ["Groundnut",   "TMV-2",      4700,  5200, 5800],
    ["Maize",       "Hybrid",     1600,  1850, 2100],
    ["Tamarind",    "Local",      5000,  6000, 7000],
    ["Brinjal",     "Local",       500,   750, 1050],
    ["Beans",       "Local",      1500,  2000, 2500],
  ],
};

const TODAY = new Date().toISOString().split("T")[0];

async function seed() {
  try {
    console.log("🌱 Seeding market data for major Tamil Nadu cities...\n");

    for (const mkt of markets) {
      // Upsert market
      const [existing] = await db.execute(
        `SELECT id FROM markets WHERE state = ? AND district = ? AND market_name = ?`,
        ["Tamil Nadu", mkt.district, mkt.market_name]
      );

      let marketId;
      if (existing.length === 0) {
        const [ins] = await db.execute(
          `INSERT INTO markets (state, district, market_name, city, contact, timing, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          ["Tamil Nadu", mkt.district, mkt.market_name, mkt.district, "", "6:00 AM - 6:00 PM"]
        );
        marketId = ins.insertId;
        console.log(`  ✅ Created market: ${mkt.market_name} (${mkt.district})`);
      } else {
        marketId = existing[0].id;
        await db.execute(`UPDATE markets SET last_updated = NOW() WHERE id = ?`, [marketId]);
        console.log(`  ♻️  Updated market: ${mkt.market_name} (${mkt.district})`);
      }

      // Delete today's existing prices for this market to avoid duplicates
      await db.execute(
        `DELETE FROM commodity_prices WHERE market_id = ? AND price_date = ?`,
        [marketId, TODAY]
      );

      // Insert fresh prices
      const prices = pricesByMarket[mkt.market_name] || [];
      for (const [commodity, variety, min_price, modal_price, max_price] of prices) {
        await db.execute(
          `INSERT INTO commodity_prices
           (market_id, commodity, variety, min_price, modal_price, max_price, arrival_qty, price_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [marketId, commodity, variety, min_price, modal_price, max_price, 0, TODAY]
        );
      }
      console.log(`     → ${prices.length} commodities seeded`);
    }

    console.log("\n✅ Market seed complete.");
    await db.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
