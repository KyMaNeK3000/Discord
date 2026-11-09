class MusicManager {
    static queue = new Map();
    static idCounters = new Map();

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
    }
}

module.exports = MusicManager;