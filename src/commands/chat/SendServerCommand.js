const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const dotenv = require("dotenv")

const ALLOWED_USERS = [process.env.DEVELOPER_1, process.env.DEVELOPER_2];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("send")
        .setDescription("Sends messages on server channels")
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Select the channel")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("message")
                .setDescription("Write a message")
                .setRequired(true)),
    async execute(interaction) {
        const embed = new EmbedBuilder();

        if (!ALLOWED_USERS.includes(interaction.user.id)) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Лох, у тебя нет прав чтобы использовать эту команду лол боже")
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const channel = interaction.options.getChannel("channel");
        const textMessage = interaction.options.getString("message");
        
        try {
            await channel.send({ content: textMessage });

            embed.setTitle("[BOT: Sent Successfully]")
                .setColor('Green')
                .setDescription(`✉️ **Message in:** \`${channel}\`\n**Text:** \`${textMessage}\``);
            return await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            embed.setTitle("[ERROR]")
                .setDescription(`❌ Не удалось отправить сообщение`)
                .setColor("Red");
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
}