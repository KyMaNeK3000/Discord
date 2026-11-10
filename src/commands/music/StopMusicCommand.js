const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../../utils/music/MusicManager");
const VoiceGuard  = require("../../utils/music/VoiceGuard");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stops the bot "),
    async execute(interaction) {
        const queueError = await VoiceGuard.checkQueueEmpty(interaction);
        if (queueError) return await interaction.reply({ embeds: [queueError], ephemeral: true });

        MusicManager.stop(interaction.guildId)

        const embed = new EmbedBuilder()
            .setTitle("[BOT]")
            .setColor('Green')
            .setDescription("Bot is successfully stopped!");

        await interaction.reply({ embeds: [embed] });
    },
}