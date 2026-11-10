const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../../utils/music/MusicManager");
const VoiceGuard  = require("../../utils/music/VoiceGuard");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Resumes the currently track"),
    async execute(interaction) {

        const voiceError = await VoiceGuard.checkSameVoice(interaction);
        if (voiceError) return await interaction.reply({ embeds: [voiceError], ephemeral: true });

        const queueError = await VoiceGuard.checkQueueEmpty(interaction);
        if (queueError) return await interaction.reply({ embeds: [queueError], ephemeral: true });

        const success = MusicManager.resume(interaction.guildId);
        const embed = new EmbedBuilder();

        if (success) {
            embed.setTitle("▶️ Music resumed!")
                .setDescription("You can continue enjoying the music")
                .setColor("Orange");
        } else {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Track not a paused")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.reply({ embeds: [embed] });
    },
};