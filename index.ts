import "dotenv/config";
import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, Collection, ActionRowBuilder } from 'discord.js';
import { refreshCommands } from "./slash_commands.js";
import { lfgResponse } from "./lfg.js";


const TOKEN = process.env.TOKEN;
const client= new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'lfg') {
    await lfgResponse(interaction);
  }
});

refreshCommands();
client.login(TOKEN);


