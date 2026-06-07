# Relay backend image. Runs the API + in-process scheduler via tsx.
FROM node:22-slim

WORKDIR /app

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm ci

COPY . .

# Run as the unprivileged built-in node user.
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
# Platforms (Render/Railway/Fly) inject PORT + DATABASE_URL at runtime.
EXPOSE 8787

CMD ["npm", "run", "start"]
