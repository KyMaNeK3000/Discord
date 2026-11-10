const { Client, IntentsBitField, REST, Routes, Collection, EmbedBuilder, Partials} = require("discord.js")
const { DatabaseSync } = require("node:sqlite")

const fs = require("node:fs")
const path = require("node:path")

const dotenv = require("dotenv")
dotenv.config()

const BotClient = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
})

const Datastore = new DatabaseSync("../.db")

BotClient.commands = new Collection();

BotClient.on("ready", async (Bot) => {
    const commands = [];
    const commandsPath = path.join(__dirname, "commands");

    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);

        if (fs.lstatSync(folderPath).isDirectory()) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);

                if ("data" in command && "execute" in command) {
                    BotClient.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                } else {
                    console.log(`[WARN]: В команде ${filePath} отсутствует "data" или "execute".`);
                }
            }
        } else if (folder.endsWith('.js')) {
            const command = require(folderPath);
            if ("data" in command && "execute" in command) {
                BotClient.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
            }
        }
    }
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
        console.log(`[REST]: Началось обновление ${commands.length} слэш-команд...`);

        await rest.put(Routes.applicationCommands(Bot.user.id), { body: [] });
        console.log("[REST]: Глобальный кэш старых команд успешно очищен.");

        BotClient.guilds.cache.forEach((Guild) => {
            rest.put(Routes.applicationGuildCommands(Bot.user.id, Guild.id), { body: commands });
        });

        console.log("[REST]: Все слэш-команды успешно зарегистрированы локально по серверам!");
    } catch (error) {
        console.error(`[ERROR REST]: ${error}`);
    }

    console.log(`Бот ${Bot.user.tag} запущен и готов к работе!`);
});

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
})

const DEVELOPERS = [process.env.DEVELOPER_1, process.env.DEVELOPER_2];

BotClient.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (!message.guild) {
        console.log(`[DM Получено] От ${message.author.tag}: ${message.content}`);

        const result = `${message.author}\n${message.content || "[Вложение или Пусто]"}`

        for (const devId of DEVELOPERS) {
            try {
                const developer = await BotClient.users.fetch(devId);
                await developer.send({ content: result });
            } catch (err) {
                console.error(`Не удалось переслать ЛС разработчику с ID ${devId}:`, err.message);
            }
        }
    }
});

BotClient.login(process.env.TOKEN)