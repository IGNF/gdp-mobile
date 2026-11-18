FROM node:26-alpine AS builder

WORKDIR /app


COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci 

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

RUN npm run build 


FROM nginxinc/nginx-unprivileged:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]