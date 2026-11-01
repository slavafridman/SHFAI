FROM nginxinc/nginx-unprivileged:stable-bookworm@sha256:cd33960e98e93d4d63385790ff7f8f5bf2ca95184c581b7f42ae8aea1139fbfc
COPY nginx.local-demo-ingress.conf /etc/nginx/nginx.conf
USER 101:101
RUN test "$(. /etc/os-release; echo "$VERSION_CODENAME")" = "bookworm" \
    && nginx -v 2>&1 | grep -Fx 'nginx version: nginx/1.28.0' \
    && curl --version \
    && test "$(id -u)" = "101" \
    && ! command -v node
EXPOSE 8080
STOPSIGNAL SIGQUIT
# Bypass base entrypoint configuration writes; init owns/reaps NGINX directly.
ENTRYPOINT ["nginx", "-g", "daemon off;"]
