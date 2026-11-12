const { SlashCommandBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const MusicManager = require("../../utils/music/MusicManager");
const VideoData = require("../../utils/music/VideoData");
const VoiceGuard = require("../../utils/music/VoiceGuard");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Check queue list"),
    async execute(interaction) {
        const queueRawMusic = [];
        const serverQueue = MusicManager.getQueue(interaction.guild.id);

        const queueError = await VoiceGuard.checkQueueEmpty(interaction);
        if (queueError) return await interaction.reply({ embeds: [queueError], flags: MessageFlags.Ephemeral });

        const firstTrack = serverQueue[0];

        queueRawMusic.push(`### 🎶 Current Track\n\`${firstTrack.title}\`\n**ID:** \`${firstTrack.id}\`\n**Duration:** \`${VideoData.formatDuration(firstTrack.lengthSeconds)}\`\n`);

        if (serverQueue.length > 1) {
            queueRawMusic.push(`### ⏳ Up Next`);
        }

        const maxDisplay = Math.min(serverQueue.length, 16);
        for (let i = 1; i < maxDisplay; i++) {
            const track = serverQueue[i];
            queueRawMusic.push(`\`ID: ${track.id}.\` **${track.title}** \`(${VideoData.formatDuration(track.lengthSeconds)})\``);
        }

        if (serverQueue.length > 16) {
            queueRawMusic.push(`\n*...и еще **${serverQueue.length - 16}** треков в очереди*`);
        }

        const queueMusic = queueRawMusic.join('\n');

        const embed = new EmbedBuilder()
            .setTitle("Queue List")
            .setDescription(queueMusic)
            .setColor('Orange');

        await interaction.reply({ embeds: [embed] });
    },
}