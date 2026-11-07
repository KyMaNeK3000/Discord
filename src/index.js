const { Client, IntentsBitField, REST, Routes } = require("discord.js")

const fs = require('node:fs')
const path = require('node:path')

const dotenv = require("dotenv")
dotenv.config()

const BotClient = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
})

BotClient.on('clientReady', (Bot) => {
    // register & update commands
    const commands = []
    const commandsPath = path.join(__dirname, 'commands')
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
    const rest = new REST({version: '10'}).setToken(process.env.TOKEN)

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath)
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON())
        } else {
            console.log(`[WARN]: In command ${filePath} missed "data" or "execute".`)
        }
    }

    try {
        BotClient.guilds.cache.forEach(async(Guild) => {
            await rest.put(Routes.applicationCommands(Bot.user.id, Guild.id), { body: commands })
        })
    } catch (error) {
        console.log(`[ERROR]: ${error}`)
    }
    console.log(`bot is alive`)
})

BotClient.login(process.env.TOKEN)