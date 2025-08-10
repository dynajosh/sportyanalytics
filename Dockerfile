FROM ghcr.io/puppeteer/puppeteer:24.16.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./

# Use npm install instead of npm ci
RUN npm install --only=production

COPY . .

CMD [ "node", "index.js" ]