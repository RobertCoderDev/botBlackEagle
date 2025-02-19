const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

let sock;

const connectWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('connection.update', ({ connection, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'open') console.log('✅ Conexión exitosa con WhatsApp');
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', ({ messages }) => {
    const msg = messages[0];
    if (!msg.key.fromMe && msg.message) {
      console.log(`💬 Mensaje recibido de ${msg.key.remoteJid}:`, msg.message.conversation);
    }
  });
};

connectWhatsApp();

app.post('/send', async (req, res) => {
  const { number, message } = req.body;
  await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
  res.send(`📩 Mensaje enviado a ${number}`);
});

app.get('/', (_, res) => res.send('🚀 WhatsApp Baileys API está corriendo en Vercel'));

app.listen(3000, () => console.log('🌐 Servidor local activo en http://localhost:3000'));
