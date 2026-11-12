const { SlashCommandBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const MusicManager = require("../../utils/music/MusicManager");
const VoiceGuard = require("../../utils/music/VoiceGuard");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Completely clears the queue"),
    async execute(interaction) {
        const text = [
            "There’s not a single piece left ✨",
            "It's good day for a walk 💫",
        ];
        const randomText = text[Math.floor(Math.random() * text.length)];

        const queueError = await VoiceGuard.checkQueueEmpty(interaction);
        if (queueError) return await interaction.reply({ embeds: [queueError], flags: MessageFlags.Ephemeral });

        const embed = new EmbedBuilder()
            .setTitle("Queue successfully cleared!")
            .setColor('Green')
            .setDescription(randomText);

        MusicManager.clear(interaction.guildId)

        await interaction.reply({ embeds: [embed] });
    },
}