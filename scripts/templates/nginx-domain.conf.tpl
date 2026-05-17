# ${APP_NAME} — domain mode (LMS)

server {
    listen 80;
    server_name ${NGINX_SERVER_NAME};

    client_max_body_size ${CLIENT_MAX_BODY_SIZE};
    access_log /var/log/nginx/${APP_NAME}-access.log;
    error_log  /var/log/nginx/${APP_NAME}-error.log;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location /api/ {
        proxy_pass http://127.0.0.1:${APP_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:${APP_PORT}/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root ${APP_HOME}/current/web;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
