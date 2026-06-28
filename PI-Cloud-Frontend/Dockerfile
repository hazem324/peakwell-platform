# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments — override at build time via --build-arg
ARG BACKEND_URL=
ARG AI_RISK_URL=http://localhost:8001
ARG AI_SYMPTOM_URL=http://localhost:8002
ARG AI_NUTRITION_URL=http://localhost:8003
ARG AI_EVENTS_URL=/ai-events

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Replace every hardcoded origin in source before compiling so the
# built JS/HTML bundles reference the real backend endpoints.
RUN find src -type f \( -name "*.ts" -o -name "*.html" \) \
      -exec sed -i "s|http://localhost:8090|${BACKEND_URL}|g" {} + && \
    find src -type f \( -name "*.ts" -o -name "*.html" \) \
      -exec sed -i "s|http://localhost:8004|${AI_EVENTS_URL}|g" {} + && \
    find src -type f \( -name "*.ts" -o -name "*.html" \) \
      -exec sed -i "s|http://localhost:5000|${AI_EVENTS_URL}|g" {} +

RUN npm run build -- --configuration production

# Stage 2: Serve
FROM nginx:alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/peakwell/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
