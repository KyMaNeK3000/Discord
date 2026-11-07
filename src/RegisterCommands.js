const { REST, Routes } =  require('discord.js');
require('dotenv').config();

const commands =  [
    {
        name: 'sasun',
        description: 'sasat eto talant'
    }
];

const rest = new REST({version: '10'}).setToken(process.env.token);

(async () => {
    try {
        console.log('Wait, KyMaBoT trying register commands');

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands });

        console.log('Thanks for your time, KyMaBoT registered a commands.');
    } catch (error) {
        console.log(`ERROR: ${error}`);
    }
})();