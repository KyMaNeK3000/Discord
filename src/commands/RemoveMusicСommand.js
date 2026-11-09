const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../utils/MusicManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Removing music from queue")
        .addIntegerOption(option =>
            option.setName("id")
                .setDescription("Write a music ID")
                .setRequired(true)),
    async execute(interaction) {
        const embed = new EmbedBuilder();
        const trackId = interaction.options.getInteger("id");
        const serverQueue = MusicManager.getQueue(interaction.guild.id);
        const index = MusicManager.findIndexById(interaction.guildId, trackId);

        if (!serverQueue || serverQueue.length < 1) {
            embed.setTitle("[ERROR]: Queue is empty")
                .setDescription("❌ Add music in queue with command /play")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const botVoiceChannel = interaction.guild.members.me.voice.channel;
        const memberVoiceChannel = interaction.member.voice.channel;
        if (!botVoiceChannel || !memberVoiceChannel || botVoiceChannel.id !== memberVoiceChannel.id) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Вы должны находиться в том же голосовом канале, что и бот, чтобы удалять треки!")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }


        if (index === -1) {
            embed.setTitle(`[ERROR]: Track with ID: ${trackId} was not found in queue!`)
                .setDescription("❌ Please provide the correct music ID, you can check it in the queue")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const videoData = serverQueue[index];

        embed.setTitle("Successfully removed")
            .setColor('Green')
            .setDescription(`**${videoData.title}**`);

        if (index === 0) {
            MusicManager.skip(interaction.guild.id);
            await MusicManager.playNext(interaction.guild.id);
        } else {
            MusicManager.removeById(interaction.guild.id, trackId);
        }

        await interaction.reply({ embeds: [embed] });
    },
}