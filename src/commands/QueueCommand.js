const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const MusicManager = require("../utils/MusicManager");
const URLGetter = require("../utils/URLGetter");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("check queue list"),
    async execute(interaction) {
        const embed = new EmbedBuilder();
        const queueRawMusic = [];
        const serverQueue = MusicManager.getQueue(interaction.guild.id);

        if (!serverQueue || serverQueue.length === 0) {
            embed.setTitle("Queue is empty")
                .setDescription("Add music in queue with command /play")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed] });
        }

        for (let i = 0; i < serverQueue.length; i++) {
            const queue = await URLGetter.getVideoTitle(serverQueue[i]);
            queueRawMusic.push(`${i + 1}. ${queue}`);
        }
        const queueMusic = queueRawMusic.join('\n');

        embed.setTitle("Queue List")
            .setDescription(queueMusic)
            .setColor('Orange');

        await interaction.reply({ embeds: [embed] });
    },
}