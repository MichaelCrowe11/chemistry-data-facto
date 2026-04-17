# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Allow Railway (or any CI) to inject the backend API base at build time.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# envsubst is provided by gettext; needed to render nginx.conf from template at runtime.
RUN apk add --no-cache gettext

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Runtime env template for frontend
COPY env.js.template /etc/nginx/env.js.template

# Copy nginx configuration template (PORT is provided at runtime)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Railway injects PORT at runtime; default to 8080 for local Docker runs.
ENV PORT=8080

# Expose default port (Railway ignores EXPOSE)
EXPOSE 8080

# Render config from template, then start nginx
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && envsubst '$VITE_API_URL' < /etc/nginx/env.js.template > /usr/share/nginx/html/env.js && nginx -g 'daemon off;' "]
