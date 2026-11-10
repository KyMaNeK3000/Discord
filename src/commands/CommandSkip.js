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

        if (!serverQueue || serverQueue.length < 1) {
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

        const botVoiceChannel = interaction.guild.members.me.voice.channel;
        const memberVoiceChannel = interaction.member.voice.channel;
        if (!botVoiceChannel || !memberVoiceChannel || botVoiceChannel.id !== memberVoiceChannel.id) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Вы должны находиться в том же голосовом канале, что и бот, чтобы пропустить трек!")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const player = MusicManager.players.get(interaction.guild.id);
        if (player) {
            player.stop();
        } else {
            MusicManager.skip(interaction.guild.id);
        }

        await new Promise(resolve => setTimeout(resolve, 200));

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