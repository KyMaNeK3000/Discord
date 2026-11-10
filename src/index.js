<<<<<<< HEAD
const { Client, IntentsBitField, REST, Routes } = require("discord.js")

const fs = require("node:fs")
const path = require("node:path")

=======
const { Client, IntentsBitField, REST, Routes, Collection } = require("discord.js")
const fs = require("node:fs")
const path = require("node:path")
>>>>>>> aa1ea368a9bb79abad8d11998749921768d09b9c
const dotenv = require("dotenv")
const play = require("play-dl");
dotenv.config()

const BotClient = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
    ],
})

<<<<<<< HEAD
BotClient.on("clientReady", (Bot) => {
=======
BotClient.commands = new Collection();

BotClient.on("clientReady", async(Bot) => {
>>>>>>> aa1ea368a9bb79abad8d11998749921768d09b9c
    // register & update commands
    const commands = []
    const commandsPath = path.join(__dirname, "commands")

<<<<<<< HEAD
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"))
=======
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
>>>>>>> aa1ea368a9bb79abad8d11998749921768d09b9c
    const rest = new REST({version: "10"}).setToken(process.env.TOKEN)

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath)
        if ("data" in command && "execute" in command) {
<<<<<<< HEAD
=======
            BotClient.commands.set(command.data.name, command);
>>>>>>> aa1ea368a9bb79abad8d11998749921768d09b9c
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
        console.log("[ERROR]: ${error}")
    }
    console.log("bot is alive")

    await play.setToken({
        youtube: {
            cookie: "./cookies.json"
        }
    });
})

BotClient.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Not found a command: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
    }
<<<<<<< HEAD
    console.log("bot is alive")
=======
>>>>>>> aa1ea368a9bb79abad8d11998749921768d09b9c
})

BotClient.login(process.env.TOKEN)