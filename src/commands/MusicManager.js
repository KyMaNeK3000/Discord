class MusicManager {
    static queue = new Map();

    /**
     * Get queue for server
     * @param {string} guildId string.
     * @returns {Array} any[].
     */
    static getQueue(guildId)  {
        if (!this.queue.has(guildId)) this.queue.set(guildId, []);
        return this.queue.get(guildId);
    }

    static add(guildId, url) {
        this.getQueue(guildId).push(url);
    }

    static remove(guildId, index) {
        return this.getQueue(guildId).splice(index, 1)[0];
    }

    static skip(guildId) {
        return this.getQueue(guildId).shift();
    }

    static clear(guildId) {
        this.queue.delete(guildId);
    }
}