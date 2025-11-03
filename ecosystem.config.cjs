// PM2 Configuration for Quill Your Dream
// Default: Uses NeDB database service (file-based, no external database needed)
// To use MongoDB instead: Set USE_NEDB=false in .env file

module.exports = {
  apps: [{
    name: 'quill-your-dream',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
      // NeDB is default - no configuration needed
      // Set USE_NEDB=false in .env to use MongoDB instead
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
