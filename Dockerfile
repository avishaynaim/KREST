FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev --omit=optional

COPY src/ ./src/
COPY public/ ./public/

ENV HOST=0.0.0.0
ENV PORT=7860

EXPOSE 7860

CMD ["node", "src/server.js"]
