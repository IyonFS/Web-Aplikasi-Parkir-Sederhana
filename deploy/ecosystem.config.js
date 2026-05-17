// deploy/ecosystem.config.js
// Konfigurasi PM2 untuk deploy tanpa Docker
// Pakai jika VPS tidak punya Docker

module.exports = {
  apps: [
    {
      name: 'hygiopark-api',
      script: 'server.js',
      cwd: '/var/www/hygiopark/backend',

      // Cluster mode: pakai semua CPU core
      instances: 'max',
      exec_mode: 'cluster',

      // Environment production
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },

      // Auto restart jika crash
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,

      // Memory limit — restart jika > 512MB
      max_memory_restart: '512M',

      // Logging
      log_file: '/var/log/hygiopark/combined.log',
      out_file: '/var/log/hygiopark/out.log',
      error_file: '/var/log/hygiopark/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,

      // Watch & reload (nonaktifkan di production)
      watch: false,
    },
  ],
};


