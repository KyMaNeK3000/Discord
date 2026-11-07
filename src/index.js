const { Client, IntentsBitField} = require('discord.js');

const Client = new Client({
    intents: [
        IntentsBitField.Flags
    ],
});