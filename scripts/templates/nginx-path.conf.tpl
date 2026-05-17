# ${APP_NAME} — path locations (LMS: API + uploads + SPA)

location ${BASE_PATH}api/ {
    proxy_pass http://127.0.0.1:${APP_PORT}/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
}

location ${BASE_PATH}uploads/ {
    proxy_pass http://127.0.0.1:${APP_PORT}/uploads/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size ${CLIENT_MAX_BODY_SIZE};
}

location ${BASE_PATH} {
    alias ${APP_HOME}/current/web/;
    index index.html;
    try_files $uri $uri/ ${BASE_PATH}index.html;
}

location = ${BASE_PATH_PREFIX} {
    return 301 ${BASE_PATH};
}
