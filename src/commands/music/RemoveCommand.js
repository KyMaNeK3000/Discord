const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../../utils/music/MusicManager");
const VoiceGuard = require("../../utils/music/VoiceGuard");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Removing music from queue")
        .addIntegerOption(option =>
            option.setName("id")
                .setDescription("Write a music ID")
                .setRequired(true)),
    async execute(interaction) {
        const embed = new EmbedBuilder();
        const trackId = interaction.options.getInteger("id");
        const serverQueue = MusicManager.getQueue(interaction.guild.id);
        const index = MusicManager.findIndexById(interaction.guildId, trackId);

        const voiceError = await VoiceGuard.checkSameVoice(interaction);
        if (voiceError) return await interaction.reply({ embeds: [voiceError], ephemeral: true });

        const queueError = await VoiceGuard.checkQueueEmpty(interaction);
        if (queueError) return await interaction.reply({ embeds: [queueError], ephemeral: true });

        if (index === -1) {
            embed.setTitle(`[ERROR]: Track with ID: ${trackId} was not found in queue!`)
                .setDescription("❌ Please provide the correct music ID, you can check it in the queue")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const videoData = serverQueue[index];

        embed.setTitle("Successfully removed")
            .setColor('Green')
            .setDescription(`**${videoData.title}**`);

        if (index === 0) {
            MusicManager.skip(interaction.guild.id);
            await MusicManager.playNext(interaction.guild.id);
        } else {
            MusicManager.removeById(interaction.guild.id, trackId);
        }

        await interaction.reply({ embeds: [embed] });
    },
}