import { REST, Routes, SlashCommandBuilder } from "discord.js";

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const rest = new REST({ version: "10" }).setToken(TOKEN);

const commands = [
  // {
  //   name: "lfg",
  //   description: "Creates a group.",
  // },
  new SlashCommandBuilder()
    .addRoleOption((option) =>
      option.setName("ping").setDescription("Pings the given role.").setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("size")
        .setDescription("The total number of players in the group (including yourself).")
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(20)
    )
    .setName("lfg")
    .setDescription("Creates a group.")
    .toJSON()
    ,
];
export async function refreshCommands() {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}
