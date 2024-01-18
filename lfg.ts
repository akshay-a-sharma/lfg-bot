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

const statusToEmoji = { available: ":white_check_mark:", tentative: ":grey_question:", decline: "" };

let canPing = true;

export async function lfgResponse(interaction: ChatInputCommandInteraction<CacheType>) {
  const teamSize = interaction.options.getNumber("size") ?? 5;
  const rolePing = interaction.options.getRole("ping");
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
    .setThumbnail("https://vgraphs.com/images/players/cards/valorant-player-looking-for-group-card-avatar.png")
    .addFields({
      name: `Players in Group (1/${teamSize})`,
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

  let reply:any = {
    content: "",
    embeds: [exampleEmbed],
    components: [responseRow, pingRow],
  }
  if (rolePing != null)
  {
    reply = {...reply, allowedMentions: {roles: [rolePing.id]}, content: rolePing.toString()};
  }

  const response = await interaction.reply(reply);

  const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button });

  collector.on("collect", async (event) => {
    try {
      let shouldPing = false;
      if (event.customId === "ping") {
        if (!players.filter((e) => e.status !== "decline").length) {
          await event.reply("No players in group.");
          return;
        }
        pingButton.setDisabled(true);
        pingRow.setComponents(pingButton);
        event.update({ components: [responseRow, pingRow] }).then((test) => {
          event.followUp(`${createPingList(players, teamSize)} your group is ready!`);
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
        if (event.customId === "available")
        {
          if (players.filter((e) => e.status === "available").length === teamSize - 1)
          {
            if (canPing)
            {
              shouldPing = true;
            }
          }
        }
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
          name: `Players in Group (${availablePlayers > teamSize ? teamSize : availablePlayers}/${teamSize})`,
          value: createPlayerList(players, teamSize),
        },
      ];
      if (event.customId === "decline")
      {
        console.log(`${event.user.displayName} declined!`);
      }
      if (players.filter((e) => e.status !== "decline").length > teamSize) {
        fields.push({
          name: `Waitlist :hourglass:`,
          value: createPlayerList(players, teamSize, true),
        });
      }
      if (players.filter((e) => e.status === "decline").length > 0)
      {
        fields.push({name: "Declined :no_entry:", value: createDeclineList(players)})
      }
      exampleEmbed.setFields(fields);
      if (shouldPing)
      {
        canPing = false;
        event.update({ embeds: [exampleEmbed] }).then((test) => {
          event.followUp(`${createPingList(players, teamSize)} your group is ready!`);
          setTimeout((e) => {
            canPing = true;
          }, 300000);
        });
      }
      else await event.update({ embeds: [exampleEmbed] });
    } catch (e) {
      console.log("Failed interaction?");
      console.log(e);
    }
  });
}

function createPlayerList(
  players: Array<{ name: string; status: string; user: User; timestamp: number }>,
  teamSize: number,
  waitlist = false,
) {
  // sort by availability first, timestamp second
  let sortedPlayers = players
    .filter((e) => e.status !== "decline")
    .sort((a, b) => Number(b.status === "available") - Number(a.status === "available") || a.timestamp - b.timestamp);
  sortedPlayers = waitlist ? sortedPlayers.slice(teamSize) : sortedPlayers.slice(0, teamSize);
  return sortedPlayers.length === 0 ? "\u200B" : sortedPlayers.map((e) => `${statusToEmoji[e.status]} ${e.name}`).join("\n");
}

function createDeclineList(
  players: Array<{ name: string; status: string; user: User; timestamp: number }>,
) {
  // sort by availability first, timestamp second
  let sortedPlayers = players
    .filter((e) => e.status === "decline")
    .sort((a, b) => a.timestamp - b.timestamp);
  return sortedPlayers.length === 0 ? "\u200B" : sortedPlayers.map((e) => `${statusToEmoji[e.status]} ${e.name}`).join("\n");
}

function createPingList(players: Array<{ name: string; status: string; user: User; timestamp: number }>, teamSize: number) {
  let sortedPlayers = players
    .filter((e) => e.status !== "decline")
    .sort((a, b) => Number(b.status === "available") - Number(a.status === "available") || a.timestamp - b.timestamp);
  sortedPlayers = sortedPlayers.slice(0, teamSize);
  return sortedPlayers.map((e) => e.user).join(", ");
}
