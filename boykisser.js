const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const readline = require('readline');
const https = require('https');

// Discord bot settings
const DISCORD_TOKEN = "your_Token"; 
const CHANNEL_ID = "channel_id"; 

// Groq API settings
const API_KEY = "API_KEY";
const MODEL = "Model";
const PROMPT = 'you? > ';
const passw= "your_password";

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

function passwordcontrol() {
  rl.question('Insert_Password', (passwr) => {
    if (passwr === passw) {
      console.log('Login succesfull. Boykisser Launching...');
      baslatBot();
      client.login(DISCORD_TOKEN);
    } else {
      console.log('Access denied');
      passwordcontrol();
    }
  });
}

function baslatBot() {
  rl.setPrompt(PROMPT);
  console.log('');
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (input === 'exit') {
      console.log('bye!');
      rl.close();
      client.destroy();
      return;
    }

    if (input === 'boykisser') {
      const boykisserPrompt = `
Create an absurd and hilarious scene based on the Boykisser web meme. The scene takes place against a background full of pastel colors. There is a cute but strange character with big eyes;
 He is wearing a neon t-shirt with the word "BOYKISSER" written on it. As the character dances, hearts, stars, and strange emojis fly around him.
 The scene should have an aesthetic that is both cute and disturbing. The image should reflect internet culture and ironic humor.
      `;
      try {
        const response = await sendToGroq(boykisserPrompt);
        console.log(`Boykisser sahnesi: ${response}`);
      } catch (err) {
        console.error('Boykisser error:', err.message);
      }
      rl.prompt();
      return;
    }

    try {
      const response = await sendToGroq(input);
      console.log(`Answer: ${response}`);
    } catch (err) {
      console.error('error:', err.message);
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
          const reply = parsed.choices?.[0]?.message?.content || 'No response received';
          resolve(reply);
        } catch (e) {
          reject(new Error('Response resolution error'));
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
  console.log(`Discord bot activate: ${client.user.tag}`);
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send(" I'm here!");
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
      message.channel.send('❌ Groq API error.');
    }
  } else if (content === '!boykisser') {
    const boykisserPrompt = `
Create an absurd and hilarious scene based on the 
Boykisser web meme. The scene takes place against a background full of pastel colors.
 There is a cute but strange character with big eyes; He is wearing a neon t-shirt with the word 
 "BOYKISSER" written on it. As the character dances, hearts, stars, and strange emojis fly around him. The scene should have an aesthetic that is both cute and disturbing. The image should reflect internet culture and ironic humor.
    `;
    try {
      const reply = await sendToGroq(boykisserPrompt);
      message.channel.send(`🎭 ${reply}`);
    } catch {
      message.channel.send('❌ Boykisser prompt error.');
    }
  }
});

passwordcontrol();
