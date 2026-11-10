const { EmbedBuilder } = require("discord.js");
const MusicManager = require("./MusicManager");

class VoiceGuard {
    static checkMemberVoice(interaction) {
        const memberVoiceChannel = interaction.member.voice.channel;
        if (!memberVoiceChannel) {
            return new EmbedBuilder()
                .setTitle("[ERROR]: Voice channel")
                .setDescription("❌ First join in a voice channel!")
                .setColor("Red");
        }
        return null;
    }

    static checkSameVoice(interaction) {
        const botVoiceChannel = interaction.guild.members.me.voice.channel;
        const memberVoiceChannel = interaction.member.voice.channel;

        if (!botVoiceChannel) return null;

        if (!memberVoiceChannel || botVoiceChannel.id !== memberVoiceChannel.id) {
            const botName = interaction.guild.members.me.nickname || interaction.guild.members.me.user.username;
            return new EmbedBuilder()
                .setTitle("[ERROR]: Voice channel")
                .setDescription(`❌ You must be in the same voice channel as the ${botName}`)
                .setColor("Red");

        }
        return null;
    }

    static checkQueueEmpty(interaction) {
        const serverQueue = MusicManager.getQueue(interaction.guildId);
        if (!serverQueue || serverQueue.length < 1) {
            return new EmbedBuilder()
                .setTitle("[ERROR]: Queue is empty")
                .setDescription("❌ Add music in queue with command /play")
                .setColor("Red");
        }
        return null;
    }
}

module.exports = VoiceGuard;