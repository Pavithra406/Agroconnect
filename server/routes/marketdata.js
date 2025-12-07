// server/routes/marketdata.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// ✅ Helper: Fetch all districts from API and filter Tamil Nadu
async function fetchTNDistricts() {
  const apiUrl =
    "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=xml&offset=0&limit=100&filters%5Bstate.keyword%5D=Tamil%20Nadu";

  const response = await fetch(apiUrl);
  const data = await response.json();

  if (!data.records) throw new Error("Invalid API response");

  // Extract unique Tamil Nadu districts
  const tnDistricts = [
    ...new Set(
      data.records
        .filter((r) => r.state?.toLowerCase() === "tamil nadu")
        .map((r) => r.district.trim())
    ),
  ];

  return { totalRecords: data.records.length, districts: tnDistricts.sort() };
}

// ✅ JSON endpoint
router.get("/districts", async (req, res) => {
  try {
    const result = await fetchTNDistricts();
    res.json(result);
  } catch (err) {
    console.error("Error fetching district data:", err);
    res.status(500).json({ error: "Failed to fetch districts" });
  }
});

// ✅ CSV download endpoint
router.get("/districts.csv", async (req, res) => {
  try {
    const { districts } = await fetchTNDistricts();

    const csv = "District\n" + districts.join("\n");
    res.setHeader("Content-Disposition", "attachment; filename=tamil_nadu_districts.csv");
    res.type("text/csv").send(csv);
  } catch (err) {
    console.error("Error generating CSV:", err);
    res.status(500).send("Failed to generate CSV");
  }
});

export default router;
