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

                console.log("[1] Voice connection created");
                console.log('[2] State:', connection.state.status)


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
            console.log("[3] Listeners attached");
            connection.subscribe(player);

            await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

            console.log("[4] Voice Ready!");
            console.log("[5] Starting Youtube downland");

            const rawStream = yt.download(videoData.url, {
                quality: Quality.HighestAudio,
                filter: {
                    hasAudio: true,
                    hasVideo: false,
                },
                highWaterMark: 1 << 20,
            });

            console.log("[6] Youtube stream created");

            rawStream.on('error', error => {
                console.error('Ошибка загрузки Youtube:', error);
            });

            const probed = await demuxProbe(rawStream);

            console.log("[7] Audio format:", probed.type);

            const resource = createAudioResource(probed.stream, {
                inputType: probed.type
            });

            console.log("[8] Audio resource created");

            player.play(resource);

            console.log("[9] Player.play() called");

            await entersState(player, AudioPlayerStatus.Playing, 15_000);
            console.log("[10] Playback started");

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