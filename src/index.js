const { Client, IntentsBitField } = require("discord.js")

const dotenv = require("dotenv")
dotenv.config()

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
})

client.on("clientReady", (Bot) => {
    console.log("bot is alive")
})

client.login(process.env.TOKEN)