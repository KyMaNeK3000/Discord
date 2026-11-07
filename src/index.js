const { Client, IntentsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        IntentsBitField.Flags.GuildRoleDelete,
        IntentsBitField.Flags.GuildRoleUpdate,
        IntentsBitField.Flags.GuildRoleCreate,
        IntentsBitField.Flags.VoiceStateUpdate,
        IntentsBitField.Flags.InviteCreate,
        IntentsBitField.Flags.InviteDelete,
        IntentsBitField.Flags.MessageReactionAdd,
        IntentsBitField.Flags.MessageReactionRemove,
        IntentsBitField.Flags.GuildRoleDelete,
        IntentsBitField.Flags.MessageCreate,
        IntentsBitField.Flags.MessageUpdate,
        IntentsBitField.Flags.MessageDelete
    ],
});

client.on('clientReady', (c) => {
    console.log('KyMaBoT is ready for work')
});

client.login(process.env.TOKEN);