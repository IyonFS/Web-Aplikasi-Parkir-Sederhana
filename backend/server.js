require("dotenv").config();

const http = require("http");
const prisma = require("./src/config/db");
const app = require("./src/app");
const { initSocket } = require("./src/socket/socket.server");
const { startSchedulers } = require("./src/services/recurring.service");

const server = http.createServer(app);
const PORT = parseInt(process.env.PORT, 10) || 4000;

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const portProbe = http.createServer();
    portProbe.listen(startPort, () => {
      portProbe.close(() => resolve(startPort));
    });
    portProbe.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
        return;
      }
      reject(err);
    });
  });
}

async function start() {
  try {
    await prisma.$connect();
    console.log("Database PostgreSQL terhubung");

    initSocket(server);
    startSchedulers();

    const availablePort = await findAvailablePort(PORT);
    server.listen(availablePort, () => {
      console.log(`Hygiopark API -> http://localhost:${availablePort}`);
      console.log(`WebSocket    -> ws://localhost:${availablePort}`);
      console.log(
        `Midtrans     -> ${
          process.env.MIDTRANS_SERVER_KEY
            ? process.env.MIDTRANS_IS_PRODUCTION === "true"
              ? "PRODUCTION"
              : "SANDBOX"
            : "DEMO"
        }`,
      );
      console.log("Demo credentials:");
      console.log("  Admin   -> admin@hygiopark.io / password123");
      console.log("  Petugas -> operator@hygiopark.io / password123");
      console.log("  Owner   -> user@hygiopark.io / password123");

      if (availablePort !== PORT) {
        console.log(
          `Port ${PORT} sudah digunakan, server berjalan di ${availablePort}.`,
        );
      }
    });
  } catch (err) {
    console.error("Gagal start server:", err.message);
    process.exit(1);
  }
}

start();


