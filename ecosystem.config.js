module.exports = {
  apps: [{
    name: 'coupon-api',
    cwd: './packages/api',
    script: 'src/index.ts',
    interpreter: '/root/.bun/bin/bun',
    interpreter_args: 'run',
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
