const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const MusicManager = require("../../utils/music/MusicManager");
const VideoData = require("../../utils/music/VideoData");
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
const { Ytdl, Quality, parseVideoId  } = require('@distube/ytdl-core');
const yt = new Ytdl();
const { PassThrough } = require('stream');
const VoiceGuard = require("../../utils/music/VoiceGuard");

try {
    process.env.FFMPEG_PATH = require('ffmpeg-static');
} catch (e) {
    console.error("ffmpeg-static не найден");
}

async function startResource(guildId, player, url) {
    const rawStream = yt.download(url, {
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

    const resource = createAudioResource(probed.stream, {
        inputType: probed.type
    });

    player.play(resource);
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

        const voiceError = await VoiceGuard.checkMemberVoice(interaction);
        if (voiceError) return await interaction.reply({ embeds: [voiceError], ephemeral: true });

        let isValidUrl = true;
        try {
            parseVideoId(url);
        } catch (error) {
            isValidUrl = false;
        }

        if (!isValidUrl) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Invalid YouTube URL! Please provide a valid video link.")
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

        const queue = MusicManager.getQueue(interaction.guildId);
        const isQueueEmpty = queue.length === 0;

        MusicManager.add(interaction.guildId, videoData);

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });

            let player = MusicManager.players.get(interaction.guildId);
            if (!player) {
                player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play
                    }
                });
                MusicManager.players.set(interaction.guildId, player);

                player.on(AudioPlayerStatus.Idle, async () => {
                    MusicManager.skip(interaction.guildId);

                    const nextQueue = MusicManager.getQueue(interaction.guildId);
                    if (nextQueue.length > 0) {
                        const nextTrack = nextQueue[0];
                        try {
                            await startResource(interaction.guildId, player, nextTrack.url);
                        } catch (err) {
                            console.error("Ошибка автозапуска следующего трека:", err);
                        }
                    } else {
                        console.log("[QUEUE]: Queue is empty. Finished playback.");
                    }
                });

                player.on('stateChange', (oldState, newState) => {
                    console.log(`[STATE]: ${oldState.status} -> ${newState.status}`);
                });

                connection.on('debug', message => {
                    console.log(`[DEBUG]:${message}`);
                })

                player.on('error', error => {
                    console.error('[ERROR]:', error.message);
                });


            }
            connection.subscribe(player);

            await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

            if (isQueueEmpty) {
                await startResource(interaction.guildId, player, videoData.url);
                await entersState(player, AudioPlayerStatus.Playing, 15_000);
            }

        } catch (error) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Failed launch audio stream")
                .setColor("Red");
            return await interaction.editReply({ embeds: [embed] });
        }

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