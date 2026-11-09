const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../utils/MusicManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Completely clears the queue"),
    async execute(interaction) {
        const embed = new EmbedBuilder();
        const serverQueue = MusicManager.getQueue(interaction.guild.id);
        const text = [
            "There’s not a single piece left ✨",
            "Hey its me, its Dolbaebity!",
            "Sasun eshkere",
            "Prodam garaj, cena 100000000000000000 ryblei\nNomer: 8-800-555-35-35"
        ];
        const randomText = text[Math.floor(Math.random() * text.length)];

        if (!serverQueue || serverQueue.length < 1) {
            embed.setTitle("[ERROR]: Queue already empty")
                .setDescription("❌ Add music in queue with command /play")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const botVoiceChannel = interaction.guild.members.me.voice.channel;
        const memberVoiceChannel = interaction.member.voice.channel;

        if (botVoiceChannel && (!memberVoiceChannel || botVoiceChannel.id !== memberVoiceChannel.id)) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Вы должны находиться в том же голосовом канале, что и бот, чтобы очистить очередь!")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        embed.setTitle("Queue successfully cleared!")
            .setColor('Green')
            .setDescription(randomText);

        MusicManager.clear(interaction.guildId)

        await interaction.reply({ embeds: [embed] });
    },
}