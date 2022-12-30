FROM node:18

RUN wget -qO - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y xvfb google-chrome-stable

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN --mount=type=secret,id=_env,dst=/etc/secrets/.env cat /etc/secrets/.env

CMD xvfb-run -a --server-args="-screen 0 1280x800x24 -ac -nolisten tcp -dpi 96 +extension RANDR" npm start