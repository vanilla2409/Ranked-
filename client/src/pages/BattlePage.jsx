import React, { useState, useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../components/ui/resizable";
import ReactMarkdown from "react-markdown";
import axios from "../lib/axios";
import FindingMatchPage from "./FindingMatch";
import { LuSwords } from "react-icons/lu";
import { useAuth } from "../lib/useAuth";




function BattlePage({ matchDetails }) {
  const navigate = useNavigate();
  const { refetch, user } = useAuth();
  const [code, setCode] = useState(matchDetails.problem.codeSnippet);
  const [timeLeft, setTimeLeft] = useState(45*60);
  const [timerActive, setTimerActive] = useState(true);
  const [resignDialogOpen, setResignDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultDialogTitle, setResultDialogTitle] = useState("");
  const [resultDialogMessage, setResultDialogMessage] = useState("");
  const [resultDialogElo, setResultDialogElo] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [consoleTab, setConsoleTab] = useState("result");
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  }


  // Timer logic
  useEffect(() => {
    const createdAt = matchDetails.createdAt; // in ms
    const endTime = createdAt + 45 * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((endTime - now) / 1000);
      setTimeLeft(Math.max(diff, 0));
    };

    if (!timerActive) return;

    updateTimer(); // Initialize immediately
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [matchDetails.createdAt, timerActive]);

  // Background polling for match status
  useEffect(() => {
    if (!matchDetails || !timerActive || resultDialogOpen) return;

    const checkMatchStatus = async () => {
      try {
        const res = await axios.get('/match-status', {
          params: { matchId: matchDetails.matchId }
        });
        
        if (res.data.success) {
          const { status, successfulSubmission, ratingDifference } = res.data;
          
          if (status === 'completed') {
            // Find who solved the problem first
            const winner = Object.keys(successfulSubmission || {}).find(
              (username) => successfulSubmission[username] === true
            );
            
            const myUsername = user?.username || matchDetails.players[0]; // fallback
            
            if (winner && winner !== myUsername) {
              // The opponent won, so this player lost!
              setTimerActive(false);
              setResultDialogTitle("You lost the match");
              setResultDialogMessage("The other player solved the problem first!");
              setResultDialogElo(ratingDifference?.loser || null);
              setResultDialogOpen(true);
            }
          }
        }
      } catch (err) {
        console.error("Error checking match status:", err);
      }
    };

    const interval = setInterval(checkMatchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [matchDetails, timerActive, resultDialogOpen, user]);

  // Local timer expiration handler
  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setResultDialogTitle("Oops! Time's up!");
      setResultDialogMessage("The 45-minute time limit for this match has expired.");
      setResultDialogElo(null);
      setResultDialogOpen(true);
    }
  }, [timeLeft, timerActive]);

  const handleSubmit = async () => {
    if (submitLoading) return; // Prevent multiple submissions
    setSubmitLoading(true);
    setConsoleOpen(true);
    setConsoleTab("result");
    setSubmissionResult({ status: "Running", message: "Running your code against test cases..." });

    try {
      const response = await axios.post('/submit', {
        problemId: matchDetails.problem.id,
        solutionCode: editorRef.current.getValue(),
        matchId: matchDetails.matchId,
      })
      if (response.data.success) {
        const tokens = response.data.tokens;
        const maxAttempts = 15; // Maximum number of polling attempts
        let attempts = 0;
        const pollingInterval = 2000; // Poll every 2 seconds
        
        const pollStatus = async () => {
          while (attempts < maxAttempts) {
            try {
              const res = await axios.post('/status-submission', {
                tokens: tokens,
                matchId: matchDetails.matchId,
              });
              if (res.data.success) {
                console.log(res.data);
                setSubmissionResult({ status: "Accepted", message: "All test cases passed!" });
                setResultDialogTitle(res.data.result);
                setResultDialogMessage(res.data.message);
                setResultDialogElo(res.data.ratingDifference);
                setResultDialogOpen(true);
                setTimerActive(false); // Stop active match state and timer
                setSubmitLoading(false);
                return; // Exit polling on success
              }
              else {
                if (res.data.message === "PENDING") {
                  attempts += 1;
                  await new Promise(resolve => setTimeout(resolve, pollingInterval));
                  continue;
                }
                
                setSubmissionResult(res.data.details || { status: res.data.message || "Error", message: "Execution failed" });
                setSubmitLoading(false);
                return; // Exit polling on failure
              }
            } catch (err) {
              console.error("Polling error:", err);
            }
            attempts += 1;
            await new Promise(resolve => setTimeout(resolve, pollingInterval));
          }
          setSubmissionResult({ status: "Timed Out", message: "Evaluation timed out. Please submit again." });
          setSubmitLoading(false);
        };

        await pollStatus();
      }
      else {
        setSubmissionResult(null);
        setConsoleOpen(false);
        setResultDialogTitle("Oops! Times up to submit");
        setResultDialogMessage(response.data.message);
        setResultDialogElo(null);
        setResultDialogOpen(true);
        setSubmitLoading(false);
      }
    } catch (error) {
        console.error("Error submitting solution:", error);
        setSubmissionResult({ status: "Error", message: "Submission failed. Please check backend server connection." });
        setSubmitLoading(false);
    }
  };

  const handleResign = async () => {
    try {
      await axios.post('/resign', { matchId: matchDetails.matchId });
    } catch (err) {
      console.error("Error resigning:", err);
    }
    localStorage.removeItem("matchDetails"); // Clear match details from local storage
    setTimerActive(false);
    await refetch(); // Refetch user data
    navigate("/dashboard");
  };

  const handleExit = async () => {
    if (timerActive) {
      try {
        await axios.post('/resign', { matchId: matchDetails.matchId });
      } catch (err) {
        console.error("Error resigning on exit:", err);
      }
    }
    localStorage.removeItem("matchDetails"); // Clear match details from local storage
    setTimerActive(false); // Stop the timer
    setResultDialogOpen(false); // Close any open dialogs
    await refetch(); // Refetch user data
    navigate("/dashboard");
  };

  const formatTime = (s) => {
  const min = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
  };  

  return (
    <div className="min-h-screen bg-[#101010] text-white flex flex-col">
      {/* Top bar: Timer & Players */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-fuchsia-700 bg-[#181022]">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-4">
          <span className="text-lg font-mono bg-black/60 px-3 py-1 rounded">⏰ {formatTime(timeLeft)}</span>
        </motion.div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-8">
            <span className="font-bold text-2xl">{matchDetails.players[0]}</span>
            <LuSwords className="text-fuchsia-600 text-3xl mx-2" />
            <span className="font-bold text-2xl">{matchDetails.players[1]}</span>
          </div>
        </div>
        <Button onClick={handleExit} className="bg-slate-950 text-white px-4 py-2 rounded-md"> Exit Match</Button>
      </div>
      {/* Split screen */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-auto">
        {/* Left: Problem Card */}
        <ResizablePanel defaultSize={40} minSize={20} maxSize={70} className="md:w-1/2 w-full">
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="h-full">
            <Card className="h-full bg-[#181022] border-fuchsia-700">
              <CardHeader>
                <CardTitle>{matchDetails.problem.slug}</CardTitle>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-700/30 text-purple-300">{matchDetails.difficulty || 'Easy'}</span>
                  {matchDetails.tags?.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">{tag}</span>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none text-white">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-fuchsia-700">
                    Problem Statement
                  </h2>
                  <div className="prose prose-invert mb-4">
                    <ReactMarkdown>
                      {matchDetails.problem.description}
                    </ReactMarkdown>
                  </div>

                </div>
              </CardContent>
            </Card>
          </motion.div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        {/* Right: Editor only, full height */}
        <ResizablePanel defaultSize={60} minSize={20} maxSize={90} className="md:w-1/2 w-full">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2 justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="bg-[#232136] border border-fuchsia-700 rounded px-4 py-2 text-base text-white min-w-[120px] font-mono text-center">Python</span>
                
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setConsoleOpen(!consoleOpen)} 
                  className="bg-[#232136] border border-fuchsia-700 text-white hover:bg-fuchsia-950 px-4 py-2 text-base font-semibold rounded-md flex items-center gap-2"
                >
                  {consoleOpen ? "Hide Console" : "Console"}
                </Button>
                <Button onClick={handleSubmit} disabled={submitLoading} className={submitLoading ? "bg-fuchsia-800 text-white hover:bg-fuchsia-900 px-6 py-2 text-base font-semibold rounded-md" : "bg-fuchsia-600 text-white hover:bg-fuchsia-700 px-6 py-2 text-base font-semibold rounded-md"}>{submitLoading ? "Submitting..." : "Submit"}</Button>
                <Dialog open={resignDialogOpen} onOpenChange={setResignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-slate-900 border border-red-500 text-red-500 cursor-pointer hover:bg-neutral-900 px-6 py-2 text-base font-semibold rounded-md">Resign</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#181022] border-fuchsia-700">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
                        Are you sure you want to resign?
                      </DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                      <Button onClick={handleResign} className="bg-gradient-to-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white border-0 font-semibold">
                        Yes, Resign
                      </Button>
                      <DialogClose asChild>
                        <Button variant="ghost" className="text-white hover:text-fuchsia-600 hover:bg-fuchsia-900/10 transition-colors">
                          Cancel
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex-1 min-h-[300px] flex flex-col">
              {consoleOpen ? (
                <ResizablePanelGroup direction="vertical" className="flex-1 h-full border border-fuchsia-800/40 rounded-md overflow-hidden">
                  <ResizablePanel defaultSize={60} minSize={30}>
                    <MonacoEditor
                      height="100%"
                      width="100%"
                      language="python"
                      value={code}
                      theme="vs-dark"
                      onMount={handleEditorDidMount}
                      options={{
                        fontSize: 16,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                      }}
                      onChange={setCode}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle className="bg-fuchsia-800/40 hover:bg-fuchsia-700/60" />
                  <ResizablePanel defaultSize={40} minSize={20}>
                    <ConsolePanel 
                      onClose={() => setConsoleOpen(false)} 
                      result={submissionResult} 
                      activeTab={consoleTab} 
                      setActiveTab={setConsoleTab} 
                      problemSlug={matchDetails.problem.slug}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                <MonacoEditor
                  height="100%"
                  width="100%"
                  language="python"
                  value={code}
                  theme="vs-dark"
                  onMount={handleEditorDidMount}
                  options={{
                    fontSize: 16,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                  }}
                  onChange={setCode}
                />
              )}
            </div>
            <ResultDialog
              open={resultDialogOpen}
              onClose={handleExit}
              title={resultDialogTitle}
              message={resultDialogMessage}
              eloChange={resultDialogElo}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function ConsolePanel({ onClose, result, activeTab, setActiveTab, problemSlug }) {
  return (
    <div className="h-full bg-[#0d0915] text-white flex flex-col font-sans select-text">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-fuchsia-950 bg-[#140e1f] text-sm font-semibold select-none">
        <div className="flex gap-4">
          <button 
            type="button"
            onClick={() => setActiveTab("result")} 
            className={`pb-1 border-b-2 transition-colors ${activeTab === "result" ? "border-fuchsia-500 text-fuchsia-400 font-bold" : "border-transparent text-gray-400 hover:text-white"}`}
          >
            Submission Result
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("testcase")} 
            className={`pb-1 border-b-2 transition-colors ${activeTab === "testcase" ? "border-fuchsia-500 text-fuchsia-400 font-bold" : "border-transparent text-gray-400 hover:text-white"}`}
          >
            Match Specs
          </button>
        </div>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-lg transition-colors p-1" title="Minimize Console">
          ✕
        </button>
      </div>

      {/* Body panel content */}
      <div className="flex-1 overflow-auto p-4 min-h-0">
        {activeTab === "result" ? (
          <div>
            {!result ? (
              <div className="text-gray-400 text-sm italic">
                No code submitted yet. Complete your implementation and click "Submit" to test your solution.
              </div>
            ) : result.status === "Running" ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500"></div>
                <div className="text-fuchsia-300 font-mono text-sm">{result.message}</div>
              </div>
            ) : result.status === "Accepted" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-sm font-bold tracking-wide">
                    SUCCESS
                  </span>
                  <span className="text-emerald-300 font-mono text-sm">{result.message}</span>
                </div>
              </div>
            ) : (
              // FAILED STATE (Wrong Answer, Runtime Error, Compile Error, etc.)
              <div className="flex flex-col gap-4 text-sm font-mono">
                {/* Status Indicator */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-md text-sm font-bold tracking-wide ${
                    result.status?.includes("Runtime Error") ? "bg-amber-600/20 text-amber-400 border border-amber-600/30" : "bg-rose-600/20 text-rose-400 border border-rose-600/30"
                  }`}>
                    {result.status}
                  </span>
                  <span className="text-gray-400 text-xs">
                    Failed at Test Case {result.failedIndex} of {result.totalTestCases}
                  </span>
                </div>

                {/* Stderr / Compile Error traceback container */}
                {(result.stderr || result.compile_output) && (
                  <div className="flex flex-col gap-1.5 w-full">
                    <span className="text-red-400 font-semibold text-xs tracking-wider uppercase">Error Traceback:</span>
                    <pre className="bg-[#180a13] border border-red-950/40 text-rose-300 rounded p-3 text-xs overflow-auto max-h-[140px] font-mono leading-relaxed whitespace-pre-wrap select-text">
                      {result.stderr || result.compile_output}
                    </pre>
                  </div>
                )}

                {/* Expected vs Actual Outputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  {/* Testcase Input */}
                  {result.input !== null && (
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <span className="text-gray-400 text-xs uppercase tracking-wider">Testcase Input:</span>
                      <pre className="bg-[#140e1f] border border-fuchsia-950/40 text-fuchsia-200 rounded p-2.5 text-xs overflow-x-auto max-h-[80px]">
                        {result.input}
                      </pre>
                    </div>
                  )}

                  {/* Expected Output */}
                  {result.expectedOutput !== null && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-emerald-400 text-xs uppercase tracking-wider">Expected Output:</span>
                      <pre className="bg-[#0b1712] border border-emerald-950/30 text-emerald-300 rounded p-2.5 text-xs overflow-x-auto">
                        {result.expectedOutput}
                      </pre>
                    </div>
                  )}

                  {/* Actual Output */}
                  {result.actualOutput !== null && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-rose-400 text-xs uppercase tracking-wider">Your Output:</span>
                      <pre className="bg-[#1a0f12] border border-rose-950/30 text-rose-300 rounded p-2.5 text-xs overflow-x-auto">
                        {result.actualOutput}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Tab: Match Specs */
          <div className="text-sm font-sans flex flex-col gap-3">
            <h3 className="text-fuchsia-400 font-bold text-base">Match Information</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-[#140e1f] rounded p-4 border border-fuchsia-950/30 max-w-lg">
              <span className="text-gray-400">Problem Slug:</span>
              <span className="text-white font-bold">{problemSlug}</span>
              
              <span className="text-gray-400">Total Available Testcases:</span>
              <span className="text-white">{result?.totalTestCases || 2}</span>

              <span className="text-gray-400">Max Time Limit (Match):</span>
              <span className="text-white">45 Minutes</span>

              <span className="text-gray-400">Runtime Timeout Limit (per test):</span>
              <span className="text-white">10 Seconds</span>
            </div>
            <p className="text-gray-400 text-xs italic mt-2">
              Note: Passing all test cases guarantees victory only if you are the first opponent to finish, or if you score a faster time than your opponent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultDialog({ open, onClose, title, message, eloChange }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!open) return;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (countdown === 0 && open) {
      onClose();
    }
  }, [countdown, open, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#181022] border-fuchsia-700 text-white">
        <DialogHeader className="flex flex-col items-center justify-center text-center w-full">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center my-4">
          <div className="text-lg mb-2">{message}</div>
          {eloChange !== null && (
            <div className={`text-lg font-semibold ${eloChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {eloChange > 0 ? `+${Math.round(eloChange)} elo` : `${Math.round(eloChange)} elo`}
            </div>
          )}
          <div className="text-xs text-neutral-400 mt-4 italic">
            Redirecting to dashboard in {countdown} seconds...
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white w-full">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MainBattlePage() {
  const [matchDetails, setMatchDetails] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const maxAttempts = 30; // Maximum number of polling attempts (e.g., 30 * 2s = 60s)
  const pollingInterval = 2000; // Poll every 2 seconds

  useEffect(() => {
    const startMatchmaking = async () => {
      const matchExists = localStorage.getItem("matchDetails"); // Check if match details are already stored
      if (matchExists) {
        setMatchDetails(JSON.parse(matchExists));
        return; // Exit if match details already exist
      }
      try {
        const res = await axios.get('/find-match');
        if (res.data.success) {
          console.log("Matchmaking started successfully");
          setIsPolling(true);
        } else {
          console.error("Failed to start matchmaking:", res.data);
          setPollingError("Failed to start matchmaking. Please try again.");
        }
      } catch (err) {
        console.error("Error in find-match:", err);
        setPollingError("Error starting matchmaking. Please try again.");
      }
    };
    startMatchmaking();
  }, []);

  useEffect(() => {
    if (!isPolling) return;

    let isCancelled = false;
    let attempts = pollingAttempts; 

    const pollStatus = async () => {
      while (!isCancelled && attempts < maxAttempts) {
        try {
          const res = await axios.get('/status-fm');
          console.log("Polling result:", res.data);

          if (res.data.success && res.data.matchDetails) {
            setMatchDetails(res.data.matchDetails);
            setIsPolling(false);
            localStorage.setItem("matchDetails", JSON.stringify(res.data.matchDetails));
            return; // Exit polling on success
          } else {
            console.log("Match not found yet, continuing to poll...");
          }

          attempts += 1;
          setPollingAttempts(attempts); // Update state after increment
        } catch (err) {
          console.error("Polling error:", err);
          setPollingError("Error checking match status. Retrying...");
        }

        if (attempts >= maxAttempts) {
          setIsPolling(false);
          setPollingError("No match found after maximum attempts. Please try again.");
          return;
        }

        // Wait before the next poll
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      }
    };

    pollStatus();

    return () => {
      isCancelled = true;
    };
  }, [isPolling]); 

  if (pollingError) {
    return (
      <div className="min-h-screen bg-[#101010] text-white flex items-center justify-center">
        <div className="text-red-400">{pollingError}</div>
      </div>
    );
  }

  if (!matchDetails) {
    return <FindingMatchPage/>;
  }

  return <BattlePage matchDetails={matchDetails} />;
}
