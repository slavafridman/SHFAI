ARG NODE_IMAGE
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY .shifter-developer-delivery/production/stage/backend/package.json .shifter-developer-delivery/production/stage/backend/package-lock.json ./
RUN test "$(node --version)" = "v24.21.0" \
    && test "$(npm --version)" = "11.19.0" \
    && npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    SHF_APP_ENV=production
WORKDIR /app
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node .shifter-developer-delivery/production/stage/backend/package.json .shifter-developer-delivery/production/stage/backend/package-lock.json ./
COPY --chown=node:node .shifter-developer-delivery/production/stage/backend/*.mts ./
USER node
STOPSIGNAL SIGTERM
CMD ["node", "server.mts"]
