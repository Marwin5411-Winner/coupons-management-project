module.exports = {
  apps: [{
    name: 'coupon-api',
    cwd: './packages/api',
    script: 'bun',
    args: 'run src/index.ts',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3100
    },
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
