FROM quay.io/qasimtech/mega-md:latest

WORKDIR /root/choco-itachi-v2

LABEL name="CHOCO-ITACHI-V2 🍫😈"
LABEL owner="CHOCO ITACHI"
LABEL number="224611257942"

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start:optimized"]