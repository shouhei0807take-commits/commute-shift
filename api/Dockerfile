FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
ARG NODE_ENV=development
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm ci --omit=dev; \
    else \
      npm ci; \
    fi

COPY . .

EXPOSE 8787

ENV NODE_ENV=$NODE_ENV

CMD ["sh", "-c", \
  "if [ \"$NODE_ENV\" = 'production' ]; then npm run build && npm start; else npm run dev; fi"]
