const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
require("dotenv").config();

const ALLOWED_USERS = [process.env.DEVELOPER_1, process.env.DEVELOPER_2];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dm")
        .setDescription("Sends messages in DM from bot")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Select the user")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("message")
                .setDescription("Write a message")
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName("file")
                .setDescription("Attach an image or file (optional)")
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const embed = new EmbedBuilder();

        if (!ALLOWED_USERS.includes(interaction.user.id)) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Лох, у тебя нет прав чтобы использовать эту команду лол боже")
                .setColor("Red");
            return await interaction.editReply({ embeds: [embed] });
        }

        const targetUser = interaction.options.getUser("user");
        const textMessage = interaction.options.getString("message");
        const attachment = interaction.options.getAttachment("file");

        if (!attachment && !textMessage) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Пустые вложения.")
                .setColor("Red");
            return await interaction.editReply({ embeds: [embed] });
        }
        
        try {
            const messagePayload = { content: textMessage };
            if (attachment) {
                messagePayload.files = [attachment.url];
            }
            await targetUser.send(messagePayload);

            embed.setTitle("[BOT: Sent Successfully]")
                .setColor('Green')
                .setDescription(`✉️ **Message for:** \`${targetUser.tag}\`\n**Text:** \`${textMessage}\``);

            if (attachment && attachment.contentType?.startsWith("image/")) {
                embed.setImage(attachment.url);
            } else if (attachment) {
                embed.addFields({ name: "📁 Attached File:", value: `[${attachment.name}](${attachment.url})` });
            }
            return await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            embed.setTitle("[ERROR]")
                .setDescription(`❌ Не удалось отправить сообщение. Возможно, у пользователя закрыта личка или он заблокировал бота.`)
                .setColor("Red");
            return await interaction.editReply({ embeds: [embed] });
        }
    },
}