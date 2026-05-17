const analyticsRepository = require("../../repositories/analytics.repository");

// GET /api/analytics/summary
async function getSummary(req, res) {
  try {
    const data = await analyticsRepository.getSummary();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data analitik" });
  }
}

// GET /api/analytics/revenue?days=7 or /api/analytics/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
async function getRevenue(req, res) {
  try {
    const { startDate, endDate, days } = req.query;
    let data;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start > end
      )
        return res.status(400).json({ error: "Rentang tanggal tidak valid" });
      data = await analyticsRepository.getRevenueByRange(start, end);
    } else {
      const rangeDays = Math.min(Number(days) || 7, 90);
      data = await analyticsRepository.getRevenueByDay(rangeDays);
    }

    res.json({ revenue: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data revenue" });
  }
}

// GET /api/analytics/peak-hours
async function getPeakHours(req, res) {
  try {
    const { startDate, endDate } = req.query;
    let since;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start > end
      )
        return res.status(400).json({ error: "Rentang tanggal tidak valid" });
      since = { start, end };
    }
    const data = await analyticsRepository.getOccupancyByHour(since);
    res.json({ peakHours: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data peak hours" });
  }
}

module.exports = { getSummary, getRevenue, getPeakHours };


