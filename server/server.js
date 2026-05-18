import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import userRouter from './routes/userRouter.js'

dotenv.config()
import prisma from './exports/prisma.js'
import fs from 'fs'
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios'
import { loadTestCases } from './helpers/loadTestCases.js'
import { checkPlayer } from './helpers/redisPlayersManagement.js'
import { addToMatchmakingQueue, getMatchForPlayer, matchmakerWorker, getMatchDetails, updateMatchDetails } from './helpers/redisMatchMaking.js'
import { setSubmissionForUser, getSubmissionForUser } from './helpers/redisSubmissionManagement.js'
import { addNewMatch, getPastYearActivity, updateActivity } from './helpers/db.js'
import { updateMatchResults } from './helpers/glicko.js'
import cookieParser from 'cookie-parser'
import auth from './middleware/auth.js'
import { getLeaderboard, getLeaderboardPage } from './helpers/leaderboard.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    console.log(`[CORS Check] Incoming Origin: ${origin}`);
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}))

app.use(express.json())
app.use(cookieParser())

// Add logging middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});


app.use('/users', userRouter)
const port = 3000

app.get('/', (req, res) => {
  res.send('API is running')
})

app.get('/api/leaderboard', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const result = await getLeaderboardPage(page, limit);
    
    res.json({
      success: true,
      data: result.leaderboard,
      pagination: {
        currentPage: page,
        totalPages: result.totalPages,
        totalPlayers: result.totalPlayers,
        playersPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: "Failed to load leaderboard"
    });
  }
});

app.get('/leaderboard' , async (req, res) => {
  const range = req.query.range ? parseInt(req.query.range) : 10; // Default to top 10 if no range is provided
  const leaderboard = await getLeaderboard(range);

  res.json({
    success: true,
    leaderboard,
  });
})

app.put('/judge0/callback', async (req, res) => {
  try {
    const body = req.body;

    const submissionId = body.token
    const status = body.status.description;

    const submissionData = { status };
    if (body.stdout) submissionData.stdout = body.stdout;
    if (body.stderr) submissionData.stderr = body.stderr;
    if (body.compile_output) submissionData.compile_output = body.compile_output;
    if (body.message) submissionData.message = body.message;

    await setSubmissionForUser(submissionId, submissionData);

    if (!submissionId || !status) {
      return res.status(400).json({ error: 'Missing token/submission_id or status' });
    }

    res.status(200).json({ message: 'Callback received successfully' });
  } catch (error) {
    console.error('Error handling Judge0 callback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use(auth)

app.get('/userActivity', async (req, res) => {
  const { userId } = req.user;

  if(!userId)
    return res.json({
      success: false,
      message: "Unauthorized"
    })

  try {
    const activity = await getPastYearActivity(userId)

    return res.json({
      success: true,
      activity: activity,
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.json({
      success: false,
      message: "Failed to fetch user activity"
    });
  }
})

app.post('/submit', async (req, res) => {
  const { problemId , solutionCode, matchId } = req.body;
  const { username } = req.user;

  if(!problemId || !solutionCode)
    return res.json({
      success: false,
      message: "Problem ID and solution code are required"
    })
  
  const matchDetails = await getMatchDetails(matchId);

  if(!matchDetails)
    return res.json({
      success: false,
      message: "Time limit exceeded for this match. Rating will be decresed only if your opponent was able to solve it"
    })

  if(matchDetails.successfulSubmission?.[username]){
    return res.json({
      success: false,
      message:"You have already submitted correct solution in this match"
    })
  }

  const problem = await prisma.problem.findFirst({
    where:{
      id: problemId
    }
  })
  
  if(!problem)
    return res.json({
      success: false,
      message: "Problem does not exists"
    })
  
  const PathToProblem = path.join(__dirname, process.env.PATH_TO_PROBLEMS, problem.slug, 'boilerplateFullCode.txt');
  let fullCode = fs.readFileSync(PathToProblem, 'utf8').replace('##USER_CODE##', solutionCode);

  //console.log('Full code:', fullCode);

  const testCases = loadTestCases(problem.slug);
  const submissions = testCases.map(tc => ({
    source_code: fullCode,
    language_id: 71, 
    stdin: tc.input,
    cpu_time_limit: 10,
    expected_output: tc.expected_output,
    memory_limit: null,
    max_processes_and_or_threads: 10,
    callback_url: process.env.CALLBACK_URL,
  }));
  
  let response = null;
  // console.log('Submissions:', submissions);
  try {
    const isRapidAPI = process.env.JUDGE0_API_URL.includes('rapidapi.com');
    const headers = isRapidAPI ? {
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      'Content-Type': 'application/json'
    } : {
      'X-Auth-Token': process.env.JUDGE0_API_KEY,
      'Content-Type': 'application/json'
    };

    response = await axios.post(
      `${process.env.JUDGE0_API_URL}/submissions/batch`,
      { submissions },
      {
        headers,
        params: {
          base64_encoded: false,
        }
      }
    );

    response.data.forEach(element => {
        console.log(element.token);
        setSubmissionForUser(element.token, {status: 'PENDING'});
    })

    res.json({
      success: true,
      message: "Code submitted successfully",
      tokens: response.data.map(submission => submission.token)
    })

  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({
      success: false,
      message: "Failed to connect to the code compilation server. Please try again."
    });
  }

  
})

app.get('/find-match', async (req, res) => {
  const {userId, username} = req.user;

  if(!userId || !username)
    return res.json({
      success: false,
      message: "Unauthorized"
    })

  const player = await checkPlayer(username);
  // console.log('Player:', player);
  // console.log('Player rating:', player.getRating());
  const response = await addToMatchmakingQueue(player.id, player.getRating());
  if(response) {
    return res.json({
      success: true,
    });
  } else {
    return res.json({
      success: false,
    });
  }
})

app.get('/status-fm' , async (req, res) => {
  const {userId, username} = req.user;

  if(!userId || !username)
    return res.json({
      success: false,
      message: "Unauthorized"
    })
  
  const matchFound = await getMatchForPlayer(username);
  if(matchFound) {
    return res.json({
      success: true,
      matchDetails: matchFound
    });
  } else {
    return res.json({
      success: false,
      message: "No match found"
    });
  }
})

app.get('/match-status', async (req, res) => {
  const { matchId } = req.query;

  if (!matchId) {
    return res.json({
      success: false,
      message: "Match ID is required"
    });
  }

  const matchDetails = await getMatchDetails(matchId);
  if (!matchDetails) {
    return res.json({
      success: false,
      message: "Match not found"
    });
  }

  res.json({
    success: true,
    status: matchDetails.status,
    players: matchDetails.players,
    successfulSubmission: matchDetails.successfulSubmission,
    ratingDifference: matchDetails.status === "completed" ? {
      winner: matchDetails.winner,
      loser: matchDetails.loser
    } : null
  });
})

app.post('/resign', async (req, res) => {
  const { matchId } = req.body;
  const loserUsername = req.user.username;

  if (!matchId) {
    return res.json({
      success: false,
      message: "Match ID is required"
    });
  }

  const matchDetails = await getMatchDetails(matchId);
  if (!matchDetails) {
    return res.json({
      success: false,
      message: "Match not found"
    });
  }

  if (matchDetails.status === 'completed') {
    return res.json({
      success: false,
      message: "Match is already completed"
    });
  }

  try {
    const winnerUsername = matchDetails.players[0] === loserUsername ? matchDetails.players[1] : matchDetails.players[0];

    // Add match record to the database
    await addNewMatch(winnerUsername, loserUsername, matchId, matchDetails.problem.id, matchDetails.playedAt);

    // Get winner and loser player objects from Redis
    const winnerPlayer = await checkPlayer(winnerUsername);
    const loserPlayer = await checkPlayer(loserUsername);

    // Calculate rating differences & update leaderboard & save to Redis
    const ratingDifference = await updateMatchResults(winnerPlayer, loserPlayer, 1);

    // Update match status to completed in Redis and record winner ELO delta
    await updateMatchDetails(matchId, ratingDifference, winnerUsername);

    // Update user activities/heatmaps
    await updateActivity(req.user.userId);
    
    // Attempt to update winner activity if they exist in the DB
    const winnerUser = await prisma.user.findUnique({
      where: { username: winnerUsername }
    });
    if (winnerUser) {
      await updateActivity(winnerUser.id);
    }

    res.json({
      success: true,
      message: "Resigned successfully",
      ratingDifference: ratingDifference.loser
    });
  } catch (error) {
    console.error('Error during resignation:', error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error during resignation"
    });
  }
})

app.post('/status-submission', async (req, res) => {
  const {tokens} = req.body;

  if(tokens.length === 0)
    return res.json({
      success: false,
      message: "Submission ID is required"
    })

  const matchDetails = await getMatchDetails(req.body.matchId);
  if (!matchDetails) {
    return res.json({
      success: false,
      message: "Time limit exceeded for this match. Rating will be decreased only if your opponent was able to solve it"
    })
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let submission = await getSubmissionForUser(token);
    if(!submission) {
      return res.json({
        success: false,
        message: "Invalid submission ID"
      });
    }

    // Fallback: If status is PENDING, poll Judge0 directly to support local environments without public callbacks
    if (submission.status === 'PENDING') {
      try {
        const isRapidAPI = process.env.JUDGE0_API_URL.includes('rapidapi.com');
        const headers = isRapidAPI ? {
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        } : {
          'X-Auth-Token': process.env.JUDGE0_API_KEY
        };

        const response = await axios.get(`${process.env.JUDGE0_API_URL}/submissions/${token}`, {
          headers,
          params: {
            base64_encoded: false
          }
        });

        const latestStatus = response.data?.status?.description;
        if (latestStatus && latestStatus !== 'In Queue' && latestStatus !== 'Processing') {
          const submissionData = { status: latestStatus };
          if (response.data.stdout) submissionData.stdout = response.data.stdout;
          if (response.data.stderr) submissionData.stderr = response.data.stderr;
          if (response.data.compile_output) submissionData.compile_output = response.data.compile_output;
          if (response.data.message) submissionData.message = response.data.message;

          // Update local status in Redis
          await setSubmissionForUser(token, submissionData);
          submission = {
            ...submission,
            ...submissionData
          };
        }
      } catch (err) {
        console.error(`Error polling Judge0 directly for token ${token}:`, err.message);
      }
    }

    if(submission.status !== 'Accepted'){
      const testCases = loadTestCases(matchDetails.problem.slug);
      const failedTestCase = testCases[i];

      res.json({
        success: false,
        message: submission.status,
        details: {
          status: submission.status,
          failedIndex: i + 1,
          totalTestCases: tokens.length,
          input: failedTestCase ? failedTestCase.input : null,
          expectedOutput: failedTestCase ? failedTestCase.expected_output : null,
          actualOutput: submission.stdout || null,
          stderr: submission.stderr || null,
          compile_output: submission.compile_output || null,
          message: submission.message || null
        }
      });
      return;
    }
  }


  if(matchDetails.status === 'pending') { // if true, he is the first person to finish (hence winner)
    
    try {

      const lostPlayerUsername = matchDetails.players[0] === req.user.username ? matchDetails.players[1] : matchDetails.players[0];
      await addNewMatch(req.user.username, lostPlayerUsername, req.body.matchId, matchDetails.problem.id, matchDetails.playedAt);
      
      // get winner and opponent players details before this match
      const winner = await checkPlayer(req.user.username);
      const opponent = await checkPlayer(lostPlayerUsername);
      // update match results [ranks and players] & get back the rating Difference
      const ratingDifference = await updateMatchResults(winner, opponent, 1);

      // update matchData for opponent and set successfulSubmission of user to true
      await updateMatchDetails(req.body.matchId, ratingDifference, req.user.username)

      //updating heatmap activity
      await updateActivity(req.user.userId);
      

      // send back response
      res.json({
        success: true,
        result: "You won the match",
        message: "All test cases passed",
        ratingDifference: ratingDifference.winner
      });
    } catch (error) {
      console.error('Error adding new match:', error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error while finalising match details."
      });
    }
  }
  else{

    await updateMatchDetails(req.body.matchId, matchDetails.ratingDifference, req.user.username);

    await updateActivity(req.user.userId);

    res.json({
      
      success: true,
      message: "All test cases passed",
      result: "You lost the match",
      ratingDifference: matchDetails.loser
    });
  }
})


app.listen(process.env.PORT || port, async () => {
  console.log(`Server listening on port: ${process.env.PORT || port}`)
  matchmakerWorker() 
})

