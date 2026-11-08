const { SlashCommandBuilder } = require("discord.js");
const MusicManager = require("../utils/MusicManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("plays music from url")
        .addStringOption(option =>
            option.setName("url")
                .setDescription("Write a youtube url")
                .setRequired(true)),
    async execute(interaction) {
        const url = interaction.options.getString("url");
        MusicManager.add(interaction.guildId, url)
        // Потом нужно сделать чтобы выводилась имя видео, а не ссылка
        await interaction.reply(`${MusicManager.getQueue(interaction.guildId).length}. Added in queue: ${url}`);
    },
}