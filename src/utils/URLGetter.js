const { Ytdl } = require('@distube/ytdl-core');
const yt = new Ytdl();
class URLGetter {
    static async getVideoTitle(videoUrl) {
        try {
            const info = await yt.getInfo(videoUrl);
            return info.videoDetails.title;
        } catch (error) {
            console.error(error);
            return "Unknown video"
        }
    }

    // Сделать проверку ссылки
}

module.exports = URLGetter;
