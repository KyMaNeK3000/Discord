const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("send")
        .setDescription("send message to user's dm")
        .addUserOption((builder) => {
            builder.setName("user")
            builder.setDescription("user")
            builder.setRequired(true)
        }),
    async execute(interaction) {
        const Target = interaction.options.getUser("user")
    },
}