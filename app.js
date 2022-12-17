const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
  }
};

initializeDbAndServer();
// player details table
const convertPlayerDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// match details table
const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// player match score table
const convertPlayerMatchScoreDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
// API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;

  const playerArray = await database.all(getPlayersQuery);
  response.send(
    playerArray.map((eachPlayer) =>
      convertPlayerDetailsDbObjectToResponseObject(eachPlayer)
    )
  );
});

// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const playerDetailsQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await database.get(playerDetailsQuery);
  response.send(convertPlayerDetailsDbObjectToResponseObject(player));
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details 
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const matchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const match = await database.get(matchQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(match));
});

// API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const playerMatchesQuery = `SELECT * FROM player_match_score
    natural join match_details 
    WHERE player_id = ${playerId};`;

  const playerMatches = await database.all(playerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

// API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const matchPlayersQuery = `SELECT * FROM player_match_score
    natural join player_details 
    WHERE match_id = ${matchId};`;

  const matchPlayers = await database.all(matchPlayersQuery);
  response.send(
    matchPlayers.map((eachMatch) =>
      convertPlayerDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

// API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const playerScoresQuery = `SELECT player_id, player_name, 
  SUM(score) as score, SUM(fours) as fours, SUM(sixes) as sixes 
  FROM player_match_score 
    NATURAL JOIN player_details WHERE player_id = ${playerId};`;

  const playerScores = await database.get(playerScoresQuery);
  response.send({
    playerId: playerScores.player_id,
    playerName: playerScores.player_name,
    totalScore: playerScores.score,
    totalFours: playerScores.fours,
    totalSixes: playerScores.sixes,
  });
});

module.exports = app;
