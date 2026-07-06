# Roonscep authoritative game server (Colyseus) for Fly.io.
# Built from the repo root because the server imports the shared game engine
# from src/game. The static client is NOT part of this image (Netlify hosts it).
FROM node:20-slim

WORKDIR /app

# Install server deps first for layer caching
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

# The shared pure engine + the server source
COPY src/game ./src/game
COPY server ./server

ENV PORT=2567
EXPOSE 2567

WORKDIR /app/server
CMD ["npm", "run", "start"]
