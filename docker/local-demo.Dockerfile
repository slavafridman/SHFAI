ARG NODE_IMAGE=node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:stable-bookworm@sha256:cd33960e98e93d4d63385790ff7f8f5bf2ca95184c581b7f42ae8aea1139fbfc
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN test "$(node --version)" = "v24.21.0" \
    && test "$(npm --version)" = "11.19.0" \
    && test "$(. /etc/os-release; echo "$VERSION_CODENAME")" = "bookworm" \
    && npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && node -e 'const fs=require("node:fs"); if(require("./node_modules/oracledb/package.json").version!=="26.0.0")process.exit(1); fs.writeFileSync("runtime-versions.json",JSON.stringify({node:process.version,npm:"11.19.0",oracledb:"26.0.0",debian:"bookworm"}))'

# Retain the complete trusted NGINX library/runtime closure from its pinned base.
# Node needs only its executable, libstdc++ and libgcc in addition to Bookworm libc.
# No npm, host dependencies, supervisor package, apt upgrade or Oracle Client.
FROM ${NGINX_IMAGE} AS runtime
USER root
COPY --from=dependencies /usr/local/bin/node /usr/local/bin/node
COPY --from=dependencies /usr/lib/x86_64-linux-gnu/libstdc++.so.6 /usr/lib/x86_64-linux-gnu/libstdc++.so.6
COPY --from=dependencies /usr/lib/x86_64-linux-gnu/libgcc_s.so.1 /usr/lib/x86_64-linux-gnu/libgcc_s.so.1
RUN test "$(. /etc/os-release; echo "$VERSION_CODENAME")" = "bookworm" \
    && test "$(node --version)" = "v24.21.0" \
    && nginx -v 2>&1 | grep -Fx 'nginx version: nginx/1.28.0' \
    && ldd /usr/local/bin/node && ldd /usr/sbin/nginx \
    && ! ldd /usr/local/bin/node | grep 'not found' \
    && ! ldd /usr/sbin/nginx | grep 'not found' \
    && rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*
WORKDIR /app
COPY --from=dependencies --chown=101:101 /app/node_modules ./node_modules
COPY --from=dependencies --chown=101:101 /app/runtime-versions.json ./
COPY --chown=101:101 backend/*.mts backend/package.json backend/package-lock.json ./
COPY --chown=101:101 backend/config-examples/dev.example.json ./config-examples/dev.example.json
COPY --chown=101:101 browser/ /usr/share/nginx/html/
COPY --chown=101:101 packaging/*.mjs ./packaging/
COPY packaging/nginx.local-demo.conf /etc/nginx/nginx.conf
ENV NODE_ENV=production
LABEL org.shifter.scope="isolated-empty-dev-demo" \
      org.shifter.state="volatile-no-native-writes" \
      org.shifter.authentication="explicit-opt-in-synthetic-not-real-login"
USER 101:101
EXPOSE 8080
STOPSIGNAL SIGTERM
ENTRYPOINT ["node", "/app/packaging/local-demo-supervisor.mjs"]
