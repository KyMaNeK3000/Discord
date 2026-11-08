const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('plays music from url'),
    async execute(interaction) {
        // Типа тут логика что делает лол
    },
}

