const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const readline = require('readline');
const https = require('https');

// Discord bot ayarları
const DISCORD_TOKEN = process.env.token; // Bot tokenını buraya ekle
const CHANNEL_ID = process.env.channel; // Kanal ID'sini buraya ekle

// Groq API ayarları
const API_KEY = process.env.api;
const MODEL = process.env.model;
const PROMPT = 'komutun nedir? > ';
const DOGRU_SIFRE = process.env.passw;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

function sifreKontrol() {
  rl.question('Şifreyi girin: ', (sifre) => {
    if (sifre === DOGRU_SIFRE) {
      console.log('Giriş başarılı. Lexia başlatılıyor...');
      baslatBot();
      client.login(DISCORD_TOKEN);
    } else {
      console.log('Erişim reddedildi.');
      sifreKontrol();
    }
  });
}

function baslatBot() {
  rl.setPrompt(PROMPT);
  console.log('Lexia başlatıldı. Çıkmak için "exit" yaz.');
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (input === 'exit') {
      console.log('Görüşürüz!');
      rl.close();
      client.destroy();
      return;
    }

    if (input === 'boykisser') {
      const boykisserPrompt = `
Boykisser internet memesini temel alan absürt ve komik bir sahne oluştur. 
Sahne, pastel renklerle dolu bir arka planda geçiyor. Ortada büyük gözlü, sevimli ama tuhaf bir karakter var; 
üzerinde "BOYKISSER" yazan neon bir tişört giymiş. Karakter dans ederken etrafında kalpler, yıldızlar ve garip emojiler uçuşuyor. 
Sahne hem sevimli hem de rahatsız edici bir estetik taşımalı. Görsel, internet kültürünü ve ironik mizahı yansıtmalı.
      `;
      try {
        const response = await sendToGroq(boykisserPrompt);
        console.log(`Boykisser sahnesi: ${response}`);
      } catch (err) {
        console.error('Boykisser hatası:', err.message);
      }
      rl.prompt();
      return;
    }

    try {
      const response = await sendToGroq(input);
      console.log(`cevap: ${response}`);
    } catch (err) {
      console.error('hata:', err.message);
    }

    rl.prompt();
  });
}

async function sendToGroq(promptText) {
  const data = JSON.stringify({
    messages: [{ role: 'user', content: promptText }],
    model: MODEL
  });

  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const reply = parsed.choices?.[0]?.message?.content || 'yanıt alınamadı';
          resolve(reply);
        } catch (e) {
          reject(new Error('Yanıt çözümleme hatası'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Discord bot olayları
client.once(Events.ClientReady, () => {
  console.log(`Discord bot aktif: ${client.user.tag}`);
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send("Ben geldim. I'm here!");
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  const content = message.content;

  if (content === '!ping') {
    message.channel.send('🏓 Pong!');
  } else if (content.startsWith('!boykisser ')) {
    const query = content.slice(6).trim();
    try {
      const reply = await sendToGroq(query);
      message.channel.send(`🧠 ${reply}`);
    } catch {
      message.channel.send('❌ Groq API hatası.');
    }
  } else if (content === '!boykisser') {
    const boykisserPrompt = `
Boykisser internet memesini temel alan absürt ve komik bir sahne oluştur. 
Sahne, pastel renklerle dolu bir arka planda geçiyor. Ortada büyük gözlü, sevimli ama tuhaf bir karakter var; 
üzerinde "BOYKISSER" yazan neon bir tişört giymiş. Karakter dans ederken etrafında kalpler, yıldızlar ve garip emojiler uçuşuyor. 
Sahne hem sevimli hem de rahatsız edici bir estetik taşımalı. Görsel, internet kültürünü ve ironik mizahı yansıtmalı.
    `;
    try {
      const reply = await sendToGroq(boykisserPrompt);
      message.channel.send(`🎭 ${reply}`);
    } catch {
      message.channel.send('❌ Boykisser prompt hatası.');
    }
  }
});

sifreKontrol();
