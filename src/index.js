const { Client, IntentsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('clientReady', (c) => {
    console.log('KyMaBoT is ready for work')
});

client.login(process.env.TOKEN);