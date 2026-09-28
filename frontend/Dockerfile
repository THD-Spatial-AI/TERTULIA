# ---- build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_BACKEND_URL=
ARG VITE_AUTH_SERVICE_URL=http://localhost:8002
ARG VITE_AUTH_REALM=tertulia
ARG VITE_DEFAULT_LANG=en

RUN npm run build

# ---- production stage ----
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Use 127.0.0.1 (not "localhost") so the check hits nginx on IPv4; "localhost"
# can resolve to ::1 in the container while nginx listens on 0.0.0.0 → refused.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
