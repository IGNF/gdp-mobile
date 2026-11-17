FROM node:22.11.0-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci 

COPY src ./src

COPY vite.config.ts ./vite.config.ts
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.node.json ./tsconfig.node.json
COPY tsconfig.app.json ./tsconfig.app.json
COPY resources ./resources

RUN mkdir ./dist

RUN npm run build   