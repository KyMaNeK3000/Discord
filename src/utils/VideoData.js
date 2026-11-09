const { Ytdl } = require('@distube/ytdl-core');
const yt = new Ytdl();

class VideoData {
    // Класс информации о видео
    id;
    url;
    title;
    lengthSeconds;
    authorName;
    authorAvatar;

    constructor(url, info) {
        this.url = url;
        this.title = info.videoDetails.title;
        this.lengthSeconds = info.videoDetails.lengthSeconds;
        this.authorName = info.videoDetails.author.name;

        const thumbnails = info.videoDetails.author.thumbnails;
        this.authorAvatar = thumbnails && thumbnails.length > 0
            ? thumbnails[thumbnails.length - 1].url
            : null;
    }

    // Форматирует в 00:00:00
    static formatDuration(secondsRaw) {
        const totalSeconds = parseInt(secondsRaw, 10);
        if (isNaN(totalSeconds) || totalSeconds <= 0) return '0:00';

        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const formattedSecs = secs < 10 ? `0${secs}` : secs;

        if (hrs > 0) {
            const formattedMins = mins < 10 ? `0${mins}` : mins;
            return `${hrs}:${formattedMins}:${formattedSecs}`;
        }
        return `${mins}:${formattedSecs}`;
    }

    // Создает новый объект класса VideoData
    static async create(url) {
        try {
            const info = await yt.getInfo(url);
            return new VideoData(url, info);
        } catch (error) {
            console.error('Error when creating the object VideoData:', error.message);
            return null;
        }
    }
}

module.exports = VideoData;