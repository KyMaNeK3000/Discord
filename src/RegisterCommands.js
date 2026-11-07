const { REST, Routes } =  require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const rest = new REST({version: '10'}).setToken(process.env.token);

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARN]: In command ${filePath} missed "data" or "execute".`);
    }
}

(async () => {
    try {
        console.log('Wait, KyMaBoT trying register commands');

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands });

        console.log('Thanks for your time, KyMaBoT registered a commands.');
    } catch (error) {
        console.log(`[ERROR]: ${error}`);
    }
})();

