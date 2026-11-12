const { SlashCommandBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const MusicManager = require("../../utils/music/MusicManager");
const VoiceGuard  = require("../../utils/music/VoiceGuard");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Resumes the currently track"),
    async execute(interaction) {

        const voiceError = await VoiceGuard.checkSameVoice(interaction);
        if (voiceError) return await interaction.reply({ embeds: [voiceError], flags: MessageFlags.Ephemeral });

        const queueError = await VoiceGuard.checkQueueEmpty(interaction);
        if (queueError) return await interaction.reply({ embeds: [queueError], flags: MessageFlags.Ephemeral });

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
            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        await interaction.reply({ embeds: [embed] });
    },
};