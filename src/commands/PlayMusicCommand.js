const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../utils/MusicManager");
const VideoData = require("../utils/VideoData");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays music from url")
        .addStringOption(option =>
            option.setName("url")
                .setDescription("Write a youtube url")
                .setRequired(true)),
    async execute(interaction) {
        const embed = new EmbedBuilder();
        const url = interaction.options.getString("url");
        const videoData = await VideoData.create(url);
        if (!videoData) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Invalid URL")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        MusicManager.add(interaction.guildId, videoData)

        embed.setTitle(videoData.title)
            .setColor('Green')
            .setDescription(`**Track ID:** \`${videoData.id}\`\n**Duration:** \`${VideoData.formatDuration(videoData.lengthSeconds)}\``)
            .setAuthor({
                name: videoData.authorName,
                iconURL: videoData.authorAvatar
            });

        await interaction.reply({ embeds: [embed] });
    },
}