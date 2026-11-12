const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

const MusicManager = require("../../utils/music/MusicManager");
const VideoData = require("../../utils/music/VideoData");

const {
    joinVoiceChannel,
    createAudioResource,
    createAudioPlayer,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    NoSubscriberBehavior,
    demuxProbe,
    getVoiceConnection
} = require("@discordjs/voice");

const { Ytdl, Quality, parseVideoId  } = require('@distube/ytdl-core');

const yt = new Ytdl();
const VoiceGuard = require("../../utils/music/VoiceGuard");

async function startResource(guildId, player, url) {
    const rawStream = yt.download(url, {
        quality: Quality.HighestAudio,
        filter: {
            hasAudio: true,
            hasVideo: false,
        },
        highWaterMark: 1 << 25,
    });

    rawStream.on('error', error => {
        console.error('Ошибка загрузки Youtube:', error);
    });

    const probed = await demuxProbe(rawStream);

    const resource = createAudioResource(probed.stream, {
        inputType: probed.type,
        inlineVolume: false
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
        if (voiceError) return await interaction.reply({ embeds: [voiceError], flags: MessageFlags.Ephemeral });

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
            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();
        
        const videoData = await VideoData.create(url);
        if (!videoData) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Invalid URL")
                .setColor("Red");
            return await interaction.editReply({ embeds: [embed] });
        }

        let player = MusicManager.players.get(interaction.guildId);
        const isIdle = !player || player.state.status === AudioPlayerStatus.Idle;

        MusicManager.add(interaction.guildId, videoData);

        try {
            let connection = getVoiceConnection(interaction.guildId);

            if (!connection || connection.joinConfig.channelId !== voiceChannel.id) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: false
                });

                connection.on(VoiceConnectionStatus.Disconnected, async () => {
                    try {
                        await Promise.race([
                            entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                            entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                        ]);
                    } catch (error) {
                        connection.destroy();
                        MusicManager.players.delete(interaction.guildId);
                        while (MusicManager.getQueue(interaction.guildId).length > 0) {
                            MusicManager.skip(interaction.guildId);
                        }
                    }
                });
            }

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

            await entersState(connection, VoiceConnectionStatus.Ready, 20000);

            if (isIdle) {
                const currentQueue = MusicManager.getQueue(interaction.guildId);
                await startResource(interaction.guildId, player, currentQueue[0].url);
                await entersState(player, AudioPlayerStatus.Playing, 15000);
            }

        } catch (error) {
            console.error("[EXECUTION ERROR]:", error);
            MusicManager.skip(interaction.guildId);

            embed.setTitle("[ERROR]")
                .setDescription("❌ Failed to launch audio stream")
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