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
            // 1. Создаем голосовое подключение
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });

            // Сетевой фикс для Windows (UDP-интервалы)
            connection.on('stateChange', (oldState, newState) => {
                const oldNetworking = Reflect.get(oldState, 'networking');
                const newNetworking = Reflect.get(newState, 'networking');

                const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
                    const newUdp = Reflect.get(newNetworkState, 'udp');
                    clearInterval(newUdp?.keepAliveInterval);
                };

                oldNetworking?.off('stateChange', networkStateChangeHandler);
                newNetworking?.on('stateChange', networkStateChangeHandler);
            });

            // 2. Инициализируем плеер
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

            // 3. Получаем аудио-поток
            const rawStream = yt.download(videoData.url, {
                quality: Quality.HighestAudio,
                filter: format => format.hasAudio && !format.hasVideo,
                highWaterMark: 1 << 25,
                dlChunkSize: 0
            });

            // Стабилизатор потока через PassThrough буфер
            const pcmStream = new PassThrough({ highWaterMark: 1 << 25 });
            rawStream.pipe(pcmStream);

            rawStream.on('error', err => {
                console.error('Ошибка ytdl стрима:', err.message);
            });

            // 4. Оборачиваем стабилизированный поток
            const resource = createAudioResource(pcmStream, {
                inputType: StreamType.Arbitrary
            });

            player.play(resource);

            // Дожидаемся Ready от сети в фоне
            entersState(connection, VoiceConnectionStatus.Ready, 10_000)
                .then(() => console.log("Голосовое соединение успешно перешло в Ready!"))
                .catch(() => {
                    console.log("Сеть не ответила. Перезапуск сетевого адаптера...");
                    connection.configureNetworking();
                });

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