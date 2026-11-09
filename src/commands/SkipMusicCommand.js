const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../utils/MusicManager");
const VideoData = require("../utils/VideoData");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips music for the following queue"),
    async execute(interaction) {
        const embed = new EmbedBuilder();
        const serverQueue = MusicManager.getQueue(interaction.guild.id);

        if (serverQueue.length < 1) {
            embed.setTitle("[ERROR]: Queue is empty")
                .setDescription("❌ Add music in queue with command /play")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (serverQueue.length < 2) {
            embed.setTitle("[ERROR]: There is no next track in the queue!")
                .setDescription("❌ Add music in queue with command /play")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        MusicManager.skip(interaction.guild.id)
        const videoData = serverQueue[0];

        embed.setTitle("Music successfully skipped")
            .setColor('Green')
            .setDescription(`**Current track:** \`${videoData.title}\`\n**Track ID:** \`${videoData.id}\`\n**Duration:** \`${VideoData.formatDuration(videoData.lengthSeconds)}\`\n`)
            .setAuthor({
                name: videoData.authorName,
                iconURL: videoData.authorAvatar
            });

        await interaction.reply({ embeds: [embed] });
    },
}