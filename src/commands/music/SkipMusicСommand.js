const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../../utils/music/MusicManager");
const VideoData = require("../../utils/music/VideoData");
const VoiceGuard = require("../../utils/music/VoiceGuard");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips music for the following queue"),
    async execute(interaction) {
        const embed = new EmbedBuilder();
        const serverQueue = MusicManager.getQueue(interaction.guild.id);

        const voiceError = await VoiceGuard.checkSameVoice(interaction);
        if (voiceError) return await interaction.reply({ embeds: [voiceError], ephemeral: true });

        const queueError = await VoiceGuard.checkQueueEmpty(interaction);
        if (queueError) return await interaction.reply({ embeds: [queueError], ephemeral: true });

        if (serverQueue.length < 2) {
            embed.setTitle("[ERROR]: There is no next track in the queue!")
                .setDescription("❌ Add music in queue with command /play")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const player = MusicManager.players.get(interaction.guild.id);
        if (player) {
            player.stop();
        } else {
            MusicManager.skip(interaction.guild.id);
        }

        // await new Promise(resolve => setTimeout(resolve, 200));

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