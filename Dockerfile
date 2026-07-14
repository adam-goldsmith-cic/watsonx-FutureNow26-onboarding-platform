# =============================================================================
# IBM Onboarding Platform — Dockerfile
#
# Base image: Red Hat UBI9 Node.js 22 Minimal (registry.redhat.io)
# Complies with IBM container security policy:
#   - Red Hat registry source
#   - Minimal base image (reduced attack surface)
#   - Non-root runtime user (UID 1001)
#   - No secrets or credentials in image layers
#   - Multi-stage build (dev toolchain excluded from final image)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — deps: install production dependencies only
# -----------------------------------------------------------------------------
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:latest AS deps

WORKDIR /app

# Copy only the files needed to resolve dependencies
COPY package.json package-lock.json ./

# Install production dependencies only — dev deps are not needed at runtime
RUN npm ci --omit=dev --ignore-scripts

# -----------------------------------------------------------------------------
# Stage 2 — builder: compile the Next.js app
# -----------------------------------------------------------------------------
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:latest AS builder

WORKDIR /app

# Copy all dependencies (including devDependencies needed for the build)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Disable telemetry during build — no outbound calls from CI/CD
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js app — produces .next/standalone via output: 'standalone'
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3 — runner: minimal production image
# -----------------------------------------------------------------------------
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:latest AS runner

WORKDIR /app

# Use non-root user — UID 1001 is pre-created in UBI9 minimal images
USER 1001

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# 0.0.0.0 is required inside the container so Docker can forward traffic via -p.
# External exposure is controlled by the Docker/Kubernetes port binding — not by this value.
# In production on OpenShift/Kubernetes, a Service/Route fronts the container; this is safe.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy the standalone server output (includes all required node_modules)
COPY --from=builder --chown=1001:1001 /app/.next/standalone ./

# Copy static assets: Next.js serves these from the filesystem
COPY --from=builder --chown=1001:1001 /app/.next/static ./.next/static
COPY --from=builder --chown=1001:1001 /app/public ./public

# Copy org-config.json — this is the plugin config source of truth at runtime.
# In Phase 2 this will be replaced by a database-backed config API.
COPY --from=builder --chown=1001:1001 /app/src/config/org-config.json ./src/config/org-config.json

EXPOSE 3000

# Healthcheck — OpenShift / Kubernetes liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/api/user || exit 1

# Start the standalone Next.js server
CMD ["node", "server.js"]
