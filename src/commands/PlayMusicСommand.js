const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const MusicManager = require("../utils/MusicManager");
const VideoData = require("../utils/VideoData");
const {
    joinVoiceChannel,
    createAudioResource,
    createAudioPlayer,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    NoSubscriberBehavior,
    demuxProbe
} = require("@discordjs/voice");
const play = require("play-dl");
const { Ytdl, Quality } = require('@distube/ytdl-core');
const yt = new Ytdl();
const { PassThrough } = require('stream');

const players = new Map();

try {
    process.env.FFMPEG_PATH = require('ffmpeg-static');
} catch (e) {
    console.error("ffmpeg-static не найден");
}

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

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ First join in voice channel!")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();
        const videoData = await VideoData.create(url);
        if (!videoData) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Invalid URL")
                .setColor("Red");
            return await interaction.editReply({ embeds: [embed] });
        }

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });

            let player = players.get(interaction.guildId);
            if (!player) {
                player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play
                    }
                });
                players.set(interaction.guildId, player);

                player.on('stateChange', (oldState, newState) => {
                    console.log(`Плеер изменил состояние: с ${oldState.status} на ${newState.status}`);
                });

                player.on('error', error => {
                    console.error('Ошибка Аудио-Плеера:', error.message);
                });
            }

            connection.subscribe(player);

            await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

            const rawStream = yt.download(videoData.url, {
                quality: Quality.HighestAudio,
                filter: {
                    hasAudio: true,
                    hasVideo: false,
                },
                highWaterMark: 1 << 20,
            });

            rawStream.on('error', error => {
                console.error('Ошибка загрузки Youtube:', error);
            });

            const probed = await demuxProbe(rawStream);

            const resource = createAudioResource(pcmStream, {
                inputType: probed.type
            });

            player.play(resource);

            await entersState(connection, VoiceConnectionStatus.Playing, 15_000);

        } catch (error) {
            console.error("Ошибка во время воспроизведения через ytdl:", error);
            embed.setTitle("[ERROR]")
                .setDescription("❌ Не удалось запустить аудио-поток.")
                .setColor("Red");
            return await interaction.editReply({ embeds: [embed] });
        }

        MusicManager.add(interaction.guildId, videoData)

        embed.setTitle(videoData.title)
            .setColor('Green')
            .setDescription(`**Track ID:** \`${videoData.id}\`\n**Duration:** \`${VideoData.formatDuration(videoData.lengthSeconds)}\``)
            .setAuthor({
                name: videoData.authorName,
                iconURL: videoData.authorAvatar
            });

        await interaction.editReply({ embeds: [embed] });
    },
}