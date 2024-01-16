import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  User,
} from "discord.js";

const statusToEmoji = { available: ":white_check_mark:", tentative: ":grey_question:", decline: ":x:" };

export async function lfgResponse(interaction: ChatInputCommandInteraction<CacheType>) {
  let players = [
    {
      name: interaction.user.displayName,
      status: "available",
      user: interaction.user,
      timestamp: Date.now(),
    },
  ];
  const exampleEmbed = new EmbedBuilder()
    .setColor([89, 0, 214])
    .setTitle(`${interaction.user.displayName} is looking for a group!`)
    .setThumbnail("https://static-00.iconduck.com/assets.00/games-valorant-icon-2048x2048-68la6c9i.png")
    .addFields({
      name: `Players in Group (1/5)`,
      value: players.map((e) => `${statusToEmoji[e.status]} ${e.name}`).join("\n"),
    })
    .setTimestamp();

  const availableButton = new ButtonBuilder()
    .setCustomId("available")
    .setLabel("Available")
    .setStyle(ButtonStyle.Success);

  const tentativeButton = new ButtonBuilder()
    .setCustomId("tentative")
    .setLabel("Tentative")
    .setStyle(ButtonStyle.Secondary);

  const declineButton = new ButtonBuilder()
    .setCustomId("decline")
    .setLabel("Decline")
    .setStyle(ButtonStyle.Danger);

  const pingButton = new ButtonBuilder()
    .setCustomId("ping")
    .setLabel("Ping Members")
    .setStyle(ButtonStyle.Primary);

  const responseRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    availableButton,
    tentativeButton,
    declineButton
  );
  const pingRow = new ActionRowBuilder<ButtonBuilder>().addComponents(pingButton);

  const response = await interaction.reply({
    // allowedMentions: {roles: ['801630543477342269']},
    // content: "<@&801630543477342269>",
    content: "",
    embeds: [exampleEmbed],
    components: [responseRow, pingRow],
  });

  const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });

  collector.on("collect", async (event) => {
    try {
      if (event.customId === "ping") {
        if (!players.filter((e) => e.status !== "decline").length) {
          await event.reply("No players in group.");
          return;
        }
        pingButton.setDisabled(true);
        pingRow.setComponents(pingButton);
        event.update({ components: [responseRow, pingRow] }).then((test) => {
          event.followUp(`${createPingList(players)} your group is ready!`);
          setTimeout((e) => {
            pingButton.setDisabled(false);
            pingRow.setComponents(pingButton);
            test.edit({ components: [responseRow, pingRow] });
          }, 300000);
        });
        return;
      }

      let player = players.findIndex((e) => e.name === event.user.displayName);
      if (player === -1) {
        players.push({
          name: event.user.displayName,
          status: event.customId,
          user: event.user,
          timestamp: Date.now(),
        });
      } else if (players[player].status !== event.customId) {
        players[player].status = event.customId;
        players[player].timestamp = Date.now();
      }
      let availablePlayers = players.filter((e) => e.status === "available").length;
      let fields = [
        {
          name: `Players in Group (${availablePlayers > 5 ? 5 : availablePlayers}/5)`,
          value: createPlayerList(players),
        },
      ];
      if (event.customId === "decline")
      {
        
      }
      if (players.filter((e) => e.status !== "decline").length > 5) {
        fields.push({
          name: `Waitlist`,
          value: createPlayerList(players, true),
        });
      }
      exampleEmbed.setFields(fields);
      await event.update({ embeds: [exampleEmbed] });
    } catch (e) {
      console.log("Failed interaction?");
      console.log(e);
    }
  });
}

function createPlayerList(
  players: Array<{ name: string; status: string; user: User; timestamp: number }>,
  waitlist = false
) {
  // sort by availability first, timestamp second
  let sortedPlayers = players
    .filter((e) => e.status !== "decline")
    .sort((a, b) => Number(b.status === "available") - Number(a.status === "available") || a.timestamp - b.timestamp);
  sortedPlayers = waitlist ? sortedPlayers.slice(5) : sortedPlayers.slice(0, 5);
  return sortedPlayers.length === 0 ? "\u200B" : sortedPlayers.map((e) => `${statusToEmoji[e.status]} ${e.name}`).join("\n");
}

function createPingList(players: Array<{ name: string; status: string; user: User; timestamp: number }>) {
  let sortedPlayers = players
    .filter((e) => e.status !== "decline")
    .sort((a, b) => Number(b.status === "available") - Number(a.status === "available") || a.timestamp - b.timestamp);
  sortedPlayers = sortedPlayers.slice(0, 5);
  return sortedPlayers.map((e) => e.user).join(", ");
}
