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

        const channel = interaction.options.getChannel("channel");
        const textMessage = interaction.options.getString("message");
        const attachment = interaction.options.getAttachment("file");

        if (!attachment && !textMessage) {
            embed.setTitle("[ERROR]")
                .setDescription("❌ Пустые вложения.")
                .setColor("Red");
            return await interaction.editReply({ embeds: [embed] });
        }

        try {
            const messagePayload = {};

            if (textMessage) messagePayload.content = textMessage;
            if (attachment) messagePayload.files = [attachment.url];

            await channel.send(messagePayload);

            embed.setTitle("[BOT: Sent Successfully]")
                .setColor('Green')
                .setDescription(`✉️ **Message in:** ${channel}\n**Text:** \`${textMessage || "[Только вложение]"}\``);

            if (attachment && attachment.contentType?.startsWith("image/")) {
                embed.setImage(attachment.url);
            } else if (attachment) {
                embed.addFields({ name: "📁 Attached File:", value: `[${attachment.name}](${attachment.url})` });
            }
            return await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("[CHANNEL SEND ERROR]:", error); // Выводим реальную ошибку в консоль для дебага
            embed.setTitle("[ERROR]")
                .setDescription(`❌ Не удалось отправить сообщение. Проверьте тип канала и права бота на отправку сообщений (Send Messages) в нём.`)
                .setColor("Red");
            return await interaction.editReply({ embeds: [embed] });
        }
    },
}