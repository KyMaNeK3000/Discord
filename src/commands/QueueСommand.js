const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../utils/MusicManager");
const VideoData = require("../utils/VideoData");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Check queue list"),
    async execute(interaction) {
        const embed = new EmbedBuilder();
        const queueRawMusic = [];
        const serverQueue = MusicManager.getQueue(interaction.guild.id);

        if (!serverQueue || serverQueue.length === 0) {
            embed.setTitle("[ERROR]: Queue is empty")
                .setDescription("❌ Add music in queue with command /play")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

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

        embed.setTitle("Queue List")
            .setDescription(queueMusic)
            .setColor('Orange');

        await interaction.reply({ embeds: [embed] });
    },
}