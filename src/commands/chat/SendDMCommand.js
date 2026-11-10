const { SlashCommandBuilder, EmbedBuilder} = require("discord.js");
// const dotenv = require("dotenv")

const ALLOWED_USERS = [process.env.DEVELOPER_1, process.env.DEVELOPER_2];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("send")
        .setDescription("Sends messages in DM from bot")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Select the user")
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

        const targetUser = interaction.options.getUser("user");
        const textMessage = interaction.options.getString("message");
        
        try {
            await targetUser.send({ content: textMessage });

            embed.setTitle("[BOT: Sent Successfully]")
                .setColor('Green')
                .setDescription(`✉️ **Message for:** \`${targetUser.tag}\`\n**Text:** \`${textMessage}\``);
            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            embed.setTitle("[ERROR]")
                .setDescription(`❌ Не удалось отправить сообщение. Возможно, у пользователя закрыта личка или он заблокировал бота.`)
                .setColor("Red");
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
}