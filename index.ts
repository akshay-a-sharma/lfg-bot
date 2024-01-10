import "dotenv/config";
import { Client, GatewayIntentBits } from 'discord.js';
import { refreshCommands } from "./slash_commands.js";

const TOKEN = process.env.TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

refreshCommands();
client.login(TOKEN);


