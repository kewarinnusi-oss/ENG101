FROM node:20-alpine

WORKDIR /app
COPY package.json ./
COPY server.mjs index.html styles.css app.js manifest.webmanifest service-worker.js icon.svg ./

ENV PORT=4173
EXPOSE 4173

CMD ["npm", "start"]
