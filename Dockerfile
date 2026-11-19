FROM node:26-alpine AS builder

WORKDIR /app


COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts 

COPY src ./src

COPY scripts/viteGeodesyPdfProxyPlugin.ts ./scripts/viteGeodesyPdfProxyPlugin.ts
COPY vite.config.ts ./vite.config.ts
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.node.json ./tsconfig.node.json
COPY tsconfig.app.json ./tsconfig.app.json
COPY resources ./resources
COPY public ./public

COPY index.html ./index.html

RUN mkdir ./dist

# Les VITE_* sont figées dans le JS au build : les passer en --build-arg
# (build-args du workflow GitHub), pas en variable d'environnement du conteneur.
ARG VITE_OAUTH_WEB_REDIRECT_URI
ARG VITE_SECRET
ARG VITE_BASE_API_URL
ARG VITE_OAUTH_CLIENT_ID
ARG VITE_OAUTH_BASE_URL
ARG VITE_GEOPORTAIL_SCAN_API_KEY
ARG VITE_GDP_REPORT_COMMUNITY_ID
ARG VITE_GDP_REPORT_DISPLAY_THEMES
ARG VITE_GDP_REPORT_SUBMISSION_THEME
ARG VITE_GDP_NEWS_URL
ARG VITE_MATOMO_URL
ARG VITE_MATOMO_SITE_ID
ARG VITE_AUTH_REQUIRED

RUN npm run build 


FROM nginxinc/nginx-unprivileged:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]