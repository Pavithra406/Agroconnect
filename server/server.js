import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import fs from "fs";
import profileRouter from "./routes/profile.js";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/orderRoutes.js"; 
import cron from "node-cron";
import axios from "axios";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads/profiles", express.static(path.join(__dirname, "uploads/profiles")));
app.use("/api", authRoutes);
app.use("/api/profile", profileRouter);
app.use("/api/orders", orderRoutes);  



const PORT = 5000;

// ------------------- DATABASE -------------------
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "pavi",
  database: "agroconnect",
  waitForConnections: true,
  connectionLimit: 100,
});
console.log("✅ MySQL connected");

// ✅ Example query usage everywhere
const [rows] = await db.query("SELECT * FROM commodity_prices");

// ------------------- MULTER -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ------------------- HELPER FUNCTIONS -------------------
const formatImageURL = (imagePath) =>
  imagePath ? `http://127.0.0.1:${PORT}${imagePath}` : null;

const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log("🧹 Deleted file:", fullPath);
    } catch (err) {
      console.warn("⚠️ Error deleting file:", err.message);
    }
  }
};

// ------------------- VEGETABLE ROUTES -------------------
app.post("/api/vegetables", upload.single("image"), async (req, res) => {
  try {
    const { name, type, price, quantity, quality, seller_address, seller_phone, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !type || !price || !quantity || !quality || !seller_address || !seller_phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO vegetables 
       (name, type, price, quantity, quality, seller_address, seller_phone, description, image, date_added)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, type, price, quantity, quality, seller_address, seller_phone, description, imagePath]
    );

    res.json({
      message: "✅ Vegetable added successfully",
      data: { id: result.insertId, name, type, price, quantity, quality, seller_address, seller_phone, description, image: formatImageURL(imagePath) },
    });
  } catch (err) {
    console.error("❌ Error adding vegetable:", err);
    res.status(500).json({ message: "Error adding vegetable" });
  }
});

app.get("/api/vegetables", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM vegetables ORDER BY id DESC");
    const data = rows.map((v) => ({ ...v, image: formatImageURL(v.image) }));
    res.json({ data });
  } catch (err) {
    console.error("❌ Error fetching vegetables:", err);
    res.status(500).json({ message: "Error fetching vegetables" });
  }
});

app.delete("/api/vegetables/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT image FROM vegetables WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Vegetable not found" });

    deleteFile(rows[0].image);
    await db.query("DELETE FROM vegetables WHERE id=?", [id]);
    res.json({ message: "✅ Vegetable deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting vegetable:", err);
    res.status(500).json({ message: "Error deleting vegetable" });
  }
});

// ------------------- FRUIT ROUTES -------------------
const fruitRouter = express.Router();
fruitRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, type, price, quantity, quality, description, address, phone } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !type || !price || !quantity || !quality) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO fruits (name, type, price, quantity, quality, description, address, phone, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type, price, quantity, quality, description, address, phone, imagePath]
    );

    res.status(201).json({ message: "✅ Fruit added successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Error adding fruit:", err);
    res.status(500).json({ message: "Database insert error" });
  }
});

fruitRouter.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM fruits ORDER BY id DESC");
    const fruits = results.map((f) => ({ ...f, image: formatImageURL(f.image) }));
    res.json(fruits);
  } catch (err) {
    console.error("❌ Error fetching fruits:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});

fruitRouter.delete("/:id", async (req, res) => {
  try {
    const fruitId = req.params.id;
    const [rows] = await db.query("SELECT image FROM fruits WHERE id=?", [fruitId]);
    if (!rows.length) return res.status(404).json({ message: "Fruit not found" });

    deleteFile(rows[0].image);
    await db.query("DELETE FROM fruits WHERE id=?", [fruitId]);
    res.json({ message: "🗑️ Fruit deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting fruit:", err);
    res.status(500).json({ message: "Database delete error" });
  }
});
app.use("/api/fruits", fruitRouter);

// ------------------- SEEDS ROUTES -------------------
const seedRouter = express.Router();

seedRouter.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM seeds ORDER BY id DESC");
    const seeds = rows.map((r) => ({ ...r, image: formatImageURL(r.image) }));
    res.json(seeds);
  } catch (err) {
    console.error("❌ DB Fetch Error (Seeds):", err);
    res.status(500).json({ message: "DB error" });
  }
});

seedRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, type, price, quantity, quality, description, seller_address, seller_number, sellerAddress, phoneNumber } = req.body;
    const finalAddress = sellerAddress || seller_address;
    const finalNumber = phoneNumber || seller_number;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !type || !price || !quantity || !quality || !finalAddress || !finalNumber) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO seeds (name, type, price, quality, quantity, description, seller_address, seller_number, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type, price, quality, quantity, description || "", finalAddress, finalNumber, imagePath]
    );

    res.status(201).json({
      message: "✅ Seed added successfully",
      data: { id: result.insertId, name, type, price, quality, quantity, description, seller_address: finalAddress, seller_number: finalNumber, image: formatImageURL(imagePath) },
    });
  } catch (err) {
    console.error("❌ DB Insert Error (Seeds):", err);
    res.status(500).json({ message: "DB insert error" });
  }
});

seedRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT image FROM seeds WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Seed not found" });

    deleteFile(rows[0].image);
    await db.query("DELETE FROM seeds WHERE id=?", [id]);
    res.json({ message: "🗑️ Seed deleted successfully" });
  } catch (err) {
    console.error("❌ DB Delete Error (Seeds):", err);
    res.status(500).json({ message: "DB delete error" });
  }
});
app.use("/api/seeds", seedRouter);

// ------------------- PLANTS ROUTES -------------------
const plantRouter = express.Router();

plantRouter.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM plants ORDER BY id DESC");
    res.json(rows.map((p) => ({ ...p, image: formatImageURL(p.image) })));
  } catch (err) {
    console.error("❌ Error fetching plants:", err);
    res.status(500).json({ message: "DB error" });
  }
});

plantRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, type, price, quantity, quality, description, seller_address, seller_phone } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !type || !price || !quantity || !quality || !seller_address || !seller_phone) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO plants (name, type, price, quantity, quality, description, seller_address, seller_phone, image, date_added)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, type, price, quantity, quality, description || "", seller_address, seller_phone, imagePath]
    );

    res.status(201).json({ message: "✅ Plant added successfully!", id: result.insertId });
  } catch (err) {
    console.error("❌ Error inserting plant:", err);
    res.status(500).json({ message: "DB insert error" });
  }
});

plantRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT image FROM plants WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Plant not found" });

    deleteFile(rows[0].image);
    await db.query("DELETE FROM plants WHERE id=?", [id]);
    res.json({ message: "🗑️ Plant deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting plant:", err);
    res.status(500).json({ message: "DB delete error" });
  }
});
app.use("/api/plants", plantRouter);

// ------------------- COWS ROUTES -------------------
const cowRouter = express.Router();
cowRouter.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM cows ORDER BY id DESC");
    res.json(rows.map((c) => ({ ...c, image: formatImageURL(c.image) })));
  } catch (err) {
    console.error("❌ Error fetching cows:", err);
    res.status(500).json({ message: "DB error" });
  }
});

cowRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, breed, age, milk_capacity, price, health, description, seller_address, seller_phone } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !breed || !age || !milk_capacity || !price || !health || !seller_address || !seller_phone) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO cows (name, breed, age, milk_capacity, price, health, description, seller_address, seller_phone, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, breed, age, milk_capacity, price, health, description || "", seller_address, seller_phone, imagePath]
    );

    res.status(201).json({ message: "✅ Cow added successfully!", id: result.insertId });
  } catch (err) {
    console.error("❌ Error inserting cow:", err);
    res.status(500).json({ message: "DB insert error" });
  }
});

cowRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT image FROM cows WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Cow not found" });

    deleteFile(rows[0].image);
    await db.query("DELETE FROM cows WHERE id=?", [id]);
    res.json({ message: "🗑️ Cow deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting cow:", err);
    res.status(500).json({ message: "DB delete error" });
  }
});
app.use("/api/cows", cowRouter);

// ------------------- GOATS ROUTES -------------------
const goatRouter = express.Router();
goatRouter.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM goats ORDER BY id DESC");
    res.json(rows.map((g) => ({ ...g, image: formatImageURL(g.image) })));
  } catch (err) {
    console.error("❌ Error fetching goats:", err);
    res.status(500).json({ message: "DB error" });
  }
});

goatRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, breed, age, weight, price, description, seller_address, seller_phone, health } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !breed || !age || !weight || !price || !health || !seller_address || !seller_phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO goats (name, breed, age, weight, price, health, seller_address, seller_phone, description, image, date_added)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, breed, age, weight, price, health, seller_address, seller_phone, description || "", imagePath]
    );

    res.status(201).json({ message: "✅ Goat added successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Error adding goat:", err);
    res.status(500).json({ message: "DB insert error" });
  }
});

goatRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT image FROM goats WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Goat not found" });

    deleteFile(rows[0].image);
    await db.query("DELETE FROM goats WHERE id=?", [id]);
    res.json({ message: "🗑️ Goat deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting goat:", err);
    res.status(500).json({ message: "DB delete error" });
  }
});
app.use("/api/goats", goatRouter);

// ------------------- BIRDS ROUTES -------------------
const birdRouter = express.Router();
birdRouter.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM birds ORDER BY id DESC");
    res.json(rows.map((b) => ({ ...b, image: formatImageURL(b.image) })));
  } catch (err) {
    console.error("❌ Error fetching birds:", err);
    res.status(500).json({ message: "DB error" });
  }
});

birdRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, species, age, weight, price, health, seller_address, seller_phone, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !species || !age || !weight || !price || !health || !seller_address || !seller_phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO birds (name, species, age, weight, price, health, seller_address, seller_phone, description, image, date_added)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, species, age, weight, price, health, seller_address, seller_phone, description || "", imagePath]
    );

    res.status(201).json({ message: "✅ Bird added successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Error adding bird:", err);
    res.status(500).json({ message: "DB insert error" });
  }
});

birdRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT image FROM birds WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Bird not found" });

    deleteFile(rows[0].image);
    await db.query("DELETE FROM birds WHERE id=?", [id]);
    res.json({ message: "🗑️ Bird deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting bird:", err);
    res.status(500).json({ message: "DB delete error" });
  }
});
app.use("/api/birds", birdRouter);

// ------------------- EGGS ROUTES -------------------
const eggRouter = express.Router();

eggRouter.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM eggs ORDER BY id DESC");
    res.json(rows.map((e) => ({
      ...e,
      image: e.image ? formatImageURL(e.image) : null
    })));
  } catch (err) {
    res.status(500).json({ message: "DB error" });
  }
});

eggRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { type, quantity, price, quality, description, seller_address, seller_phone } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!type || !quantity || !price || !quality || !seller_address || !seller_phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO eggs (type, quantity, price, quality, description, seller_address, seller_phone, image, date_added)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [type, quantity, price, quality, description || "", seller_address, seller_phone, imagePath]
    );

    res.status(201).json({ message: "Egg added successfully", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "DB insert error" });
  }
});

eggRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query("SELECT image FROM eggs WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Egg not found" });

    deleteFile(rows[0].image);

    await db.query("DELETE FROM eggs WHERE id=?", [id]);
    res.json({ message: "Egg deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "DB delete error" });
  }
});

app.use("/api/eggs", eggRouter);


// ------------------- FERTILIZERS ROUTES -------------------
const fertilizerRouter = express.Router();
fertilizerRouter.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM fertilizers ORDER BY id DESC");
    res.json(rows.map((f) => ({ ...f, image: formatImageURL(f.image) })));
  } catch (err) {
    console.error("❌ Error fetching fertilizers:", err);
    res.status(500).json({ message: "DB error" });
  }
});

fertilizerRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, type, price, quantity, description, seller_address, seller_phone } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !type || !price || !quantity || !seller_address || !seller_phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO fertilizers (name, type, price, quantity, description, seller_address, seller_phone, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type, price, quantity, description || "", seller_address, seller_phone, imagePath]
    );

    res.status(201).json({ message: "✅ Fertilizer added successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Error adding fertilizer:", err);
    res.status(500).json({ message: "DB insert error" });
  }
});

fertilizerRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT image FROM fertilizers WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Fertilizer not found" });

    deleteFile(rows[0].image);
    await db.query("DELETE FROM fertilizers WHERE id=?", [id]);
    res.json({ message: "🗑️ Fertilizer deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting fertilizer:", err);
    res.status(500).json({ message: "DB delete error" });
  }
});
app.use("/api/fertilizers", fertilizerRouter);

// ------------------- EQUIPMENT ROUTES -------------------
const equipmentRouter = express.Router();
equipmentRouter.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM equipments ORDER BY id DESC");
    res.json(rows.map((e) => ({ ...e, image: formatImageURL(e.image) })));
  } catch (err) {
    console.error("❌ Error fetching equipment:", err);
    res.status(500).json({ message: "DB error" });
  }
});

equipmentRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, brand, condition_type, price, quantity, seller_address, seller_phone, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !brand || !condition_type || !price || !quantity || !seller_address || !seller_phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO equipments (name, brand, condition_type, price, quantity, seller_address, seller_phone, description, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, brand, condition_type, price, quantity, seller_address, seller_phone, description || "", imagePath]
    );

    res.status(201).json({ message: "✅ Equipment added successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Error adding equipment:", err);
    res.status(500).json({ message: "DB insert error" });
  }
});

equipmentRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT image FROM equipments WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Equipment not found" });

    deleteFile(rows[0].image);
    await db.query("DELETE FROM equipments WHERE id=?", [id]);
    res.json({ message: "🗑️ Equipment deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting equipment:", err);
    res.status(500).json({ message: "DB delete error" });
  }
});
app.use("/api/equipments", equipmentRouter);

// ------------------- ENDPOINT: GET TAMIL NADU MARKETS -------------------
app.get("/api/markets/tn", async (req, res) => {
  try {
    const [markets] = await db.query(
      `SELECT * FROM markets WHERE state = 'Tamil Nadu'`
    );

    const results = await Promise.all(
      markets.map(async (mkt) => {
        const [prices] = await db.query(
          `SELECT commodity, variety, min_price, modal_price, max_price, arrival_qty, price_date
           FROM commodity_prices
           WHERE market_id = ? 
           AND price_date = (SELECT MAX(price_date) FROM commodity_prices WHERE market_id = ?)`,
          [mkt.id, mkt.id]
        );
        return { market: mkt, prices };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("❌ Error in /api/markets/tn:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------- FUNCTION: FETCH & STORE DATA -------------------
async function fetchAndStore() {
  try {
    console.log("Fetching Tamil Nadu market data...");

    const apiUrl =
      "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070" +
      "?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b" +
      "&format=json&offset=0&limit=1000&filters%5Bstate.keyword%5D=Tamil%20Nadu";

    const response = await axios.get(apiUrl);
    const data = response.data.records;
    const tnData = data.filter((r) => r.state === "Tamil Nadu");

    for (const rec of tnData) {
      // ✅ Convert "DD/MM/YYYY" → "YYYY-MM-DD"
      let mysqlDate = null;
      if (rec.arrival_date) {
        if (rec.arrival_date.includes("/")) {
          const [day, month, year] = rec.arrival_date.split("/");
          mysqlDate = `${year}-${month}-${day}`;
        } else if (rec.arrival_date.includes("-")) {
          mysqlDate = rec.arrival_date; // already correct format
        }
      }

      // 1️⃣ Check if market exists
      const [rows] = await db.query(
        `SELECT id FROM markets WHERE state = ? AND district = ? AND market_name = ?`,
        [rec.state, rec.district, rec.market]
      );

      let marketId;
      if (rows.length === 0) {
        const [insert] = await db.query(
          `INSERT INTO markets (state, district, market_name, city, contact, timing, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [rec.state, rec.district, rec.market, "", "", ""]
        );
        marketId = insert.insertId;
      } else {
        marketId = rows[0].id;
        await db.query(`UPDATE markets SET last_updated = NOW() WHERE id = ?`, [
          marketId,
        ]);
      }

      // 2️⃣ Insert commodity price record
      await db.query(
        `INSERT INTO commodity_prices 
         (market_id, commodity, variety, min_price, modal_price, max_price, arrival_qty, price_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          marketId,
          rec.commodity,
          rec.variety,
          rec.min_price,
          rec.modal_price,
          rec.max_price,
          rec.arrivals_in_tonnes || 0,
          mysqlDate || null,
        ]
      );
    }

    console.log("✅ Tamil Nadu data updated:", tnData.length, "records");
  } catch (err) {
    console.error("❌ Error fetching/storing data:", err);
  }
}

// ------------------- CRON JOB (RUN DAILY 4 AM) -------------------
cron.schedule("0 4 * * *", () => {
  fetchAndStore();
});

// ✅ Run once on startup
fetchAndStore();


// ------------------- START SERVER -------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});
