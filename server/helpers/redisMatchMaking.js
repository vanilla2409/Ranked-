import redis from "../exports/redis.js";
import prisma from "../exports/prisma.js";
import { randomUUID } from "crypto";

const MATCHMAKING_KEY = "matchmakingQueue";
const MATCH_DATA_PREFIX = "match:";
const PLAYER_MATCH_PREFIX = "playerMatch:";

const problemSlugs = [
  'sum-of-even',
  'roman-to-integer',
  'palindrome-check'
];

/**
 * Adds a player to the matchmaking queue using a sorted set based on rating.
 * Prevents duplicates by checking if the player is already present.
 */
export async function addToMatchmakingQueue(playerId, playerRating) {
  // Check if the player is already in the queue
  const existingScore = await redis.zscore(MATCHMAKING_KEY, playerId);

  if (existingScore !== null) {
    console.log("Player is already in the matchmaking queue");
    return false;
  }

  // Add the player to the matchmaking queue with rating as score
  try {
    const result = await redis.zadd(MATCHMAKING_KEY, playerRating, playerId);
    console.log(`Added player ${playerId} to queue with rating ${playerRating}`);
    return result;

  } catch (error) {
    console.error("Error adding player to matchmaking queue:", error);
    return false;
  }
}


const RATING_DIFFERENCE = 300;

async function findOpponent(playerId, playerRating) {
  // Find players within rating ± threshold
  const minScore = playerRating - RATING_DIFFERENCE;
  const maxScore = playerRating + RATING_DIFFERENCE;

  // Get potential opponents (excluding the player himself)
  const candidates = await redis.zrangebyscore(MATCHMAKING_KEY, minScore, maxScore);
  // console.log(`Potential opponents for player ${playerId}:`, candidates);
  for (const opponentId of candidates) {
    if (opponentId !== playerId) {
      return opponentId;
    }
 }
  return null;
}

async function createMatch(player1Id, player2Id) {
  const matchId = randomUUID();
  const randomProblem = problemSlugs[Math.floor(Math.random() * problemSlugs.length)];
  const matchData = {
    matchId,
    players: [player1Id, player2Id],
    createdAt: Date.now(),
    status: "pending",
    problem: await prisma.problem.findFirst({
        where: {
          slug: randomProblem,
        },
        select: {
          id: true,
          slug: true,
          description: true,
          codeSnippet: true,
        },
    }),
    successfulSubmission: {
      [player1Id]: false,
      [player2Id]: false,
    },
  };

  // Save match object
  await redis.set(`${MATCH_DATA_PREFIX}${matchId}`, JSON.stringify(matchData));
  await redis.expire(`${MATCH_DATA_PREFIX}${matchId}`, 45 * 60 + 10); // 45 minutes + 10 seconds
  // Allow each player to lookup their match
  await redis.set(`${PLAYER_MATCH_PREFIX}${player1Id}`, matchId);
  await redis.expire(`${PLAYER_MATCH_PREFIX}${player1Id}`, 10); 

  await redis.set(`${PLAYER_MATCH_PREFIX}${player2Id}`, matchId);
  await redis.expire(`${PLAYER_MATCH_PREFIX}${player2Id}`, 10); 

  console.log(`✅ Match Created: ${matchId} between ${player1Id} and ${player2Id}`);
}

// A worker that will be responsible for processing the matchmaking queue
export async function matchmakerWorker() {

  console.log("🎯 Matchmaking worker started...");

  while (true) {
    try {
      const TopPlayer = await redis.zrange(MATCHMAKING_KEY, 0, 0, "WITHSCORES");
      if (TopPlayer.length === 0 || TopPlayer.length === 1) {
        // No players in the queue
        // console.log("No players in the matchmaking queue");
        await new Promise((res) => setTimeout(res, 7000));
        continue;
      }

      const opponentId = await findOpponent(TopPlayer[0], Number(TopPlayer[1]));

      if (opponentId) {
        // Remove both players from the queue
        await redis.zrem(MATCHMAKING_KEY, TopPlayer[0], opponentId);
        // Create the match
        await createMatch(TopPlayer[0], opponentId);

      } else {
        // No match found for this player yet; try again shortly
        await new Promise((res) => setTimeout(res, 500));
      }
    } catch (error) {
      console.error("Matchmaking worker error:", error.message);
      // Wait longer if there's an error (e.g., Redis down)
      await new Promise((res) => setTimeout(res, 10000));
    }
  }
}

export async function getMatchForPlayer(playerId) {
  const matchId = await redis.get(`${PLAYER_MATCH_PREFIX}${playerId}`);

  if (!matchId) {
    return null;
  }

  const matchData = await redis.get(`${MATCH_DATA_PREFIX}${matchId}`);

  if (!matchData || matchData.status === "completed") {
    return null;
  }
  return JSON.parse(matchData);
}

export async function getMatchDetails(matchId) {
  const matchData = await redis.get(`${MATCH_DATA_PREFIX}${matchId}`);

  if (!matchData) {
    return null;
  }

  return JSON.parse(matchData);
}

export async function updateMatchDetails(matchId, updates, usernameOfSuccessfulSubmissionPlayer) {
  const matchData = await getMatchDetails(matchId);
  if (!matchData) {
    return null;
  }
  const updatedMatchData = { 
    ...matchData,
    ...updates,
    status: "completed",
    successfulSubmission: {
      ...matchData.successfulSubmission,
      [usernameOfSuccessfulSubmissionPlayer]: true,
    },
  };

  await redis.set(`${MATCH_DATA_PREFIX}${matchId}`, JSON.stringify(updatedMatchData));
  return;
}
