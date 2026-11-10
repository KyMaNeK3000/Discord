const {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    NoSubscriberBehavior,
    AudioPlayerStatus,
    StreamType,
    getVoiceConnection
} = require("@discordjs/voice");
const { Ytdl, Quality } = require('@distube/ytdl-core');
const yt = new Ytdl();
const { PassThrough } = require('stream');

class MusicManager {
    static queue = new Map();
    static idCounters = new Map();
    static players = new Map();

    // Получает очередь определенного сервера
    /**
     * Get queue for server
     * @param {string} guildId string.
     * @returns {Array<VideoData>} VideoInfo[].
     */
    static getQueue(guildId)  {
        if (!MusicManager.queue.has(guildId)) MusicManager.queue.set(guildId, []);
        return MusicManager.queue.get(guildId);
    }

    // Создает следующий айди для музыки
    static getNextId(guildId) {
        if (!MusicManager.idCounters.has(guildId)) MusicManager.idCounters.set(guildId, 1);
        const currentId = MusicManager.idCounters.get(guildId);
        MusicManager.idCounters.set(guildId, currentId + 1);
        return currentId;
    }

    static getOrCreatePlayer(guildId) {
        if (MusicManager.players.has(guildId)) {
            return MusicManager.players.get(guildId);
        }

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });

        // Отслеживаем завершение трека для автоматического переключения
        player.on(AudioPlayerStatus.Idle, () => {
            console.log(`[MusicManager]: Трек завершился на сервере ${guildId}. Запуск следующего...`);
            MusicManager.skip(guildId); // Удаляем отыгравший первый трек
            MusicManager.playNext(guildId); // Запускаем идущий следом
        });

        player.on('error', error => {
            console.error(`[MusicManager Error] Сервер ${guildId}:`, error.message);
            // При ошибке потока также пробуем переключиться дальше, чтобы бот не зависал в молчании
            MusicManager.skip(guildId);
            MusicManager.playNext(guildId);
        });

        MusicManager.players.set(guildId, player);
        return player;
    }

    static async playNext(guildId) {
        const queue = MusicManager.getQueue(guildId);
        const player = MusicManager.getOrCreatePlayer(guildId);
        const connection = getVoiceConnection(guildId);

        // Если очередь пуста или бот вылетел из голосового канала — останавливаем плеер
        if (queue.length === 0 || !connection) {
            player.stop();
            return false;
        }

        const currentTrack = queue[0];

        try {
            const rawStream = yt.download(currentTrack.url, {
                quality: Quality.HighestAudio,
                filter: format => format.hasAudio && !format.hasVideo,
                highWaterMark: 1 << 25,
                dlChunkSize: 0
            });

            // Стабилизируем Node.js поток через сквозной PassThrough буфер
            const pcmStream = new PassThrough({ highWaterMark: 1 << 25 });
            rawStream.pipe(pcmStream);

            const resource = createAudioResource(pcmStream, {
                inputType: StreamType.Arbitrary
            });

            connection.subscribe(player);
            player.play(resource);
            return true;
        } catch (error) {
            console.error("[MusicManager.playNext Exception]:", error);
            MusicManager.skip(guildId);
            return MusicManager.playNext(guildId);
        }
    }

    // Добавляет музыку в очередь и добавляет к каждому треку свой айди
    static add(guildId, videoData) {
        videoData.id = MusicManager.getNextId(guildId);
        this.getQueue(guildId).push(videoData);
    }

    // Находит в очереди трек по айди
    static findIndexById(guildId, trackId) {
        const queue = this.getQueue(guildId);
        return queue.findIndex(track => track.id === trackId);
    }

    // Удяляет трек по айди из очереди
    static removeById(guildId, trackId) {
        const index = this.findIndexById(guildId, trackId);
        if (index !== -1) {
            return this.getQueue(guildId).splice(index, 1)[0];
        }
        return null;
    }

    // Скипает трек (удаляет из очереди первый объект и все остальные треки переходят на -1)
    static skip(guildId) {
        return this.getQueue(guildId).shift();
    }

    // Полность очищает очередь
    static clear(guildId) {
        MusicManager.queue.delete(guildId);
        MusicManager.idCounters.delete(guildId);

        const player = MusicManager.players.get(guildId);
        if (player) {
            player.stop();
            MusicManager.players.delete(guildId);
        }

        const connection = getVoiceConnection(guildId);
        if (connection) {
            connection.destroy(); // Бот выходит из голосового канала при полной очистке
        }
    }
}

module.exports = MusicManager;