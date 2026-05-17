import { useEffect, useState } from "react"
import { Card, CardContent } from "../components/ui/card"
import { User, Crown, Trophy, Medal, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../components/ui/button"
import axios from "../lib/axios"

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const response = await axios.get("/api/leaderboard", { params: { page, limit } })
        if (response.data.success) {
          const mapped = response.data.data.map((entry) => ({
            rank: entry.rank,
            username: entry.userId, // userId is actually username in leaderboard
            rating: entry.rating,
            isTop: entry.rank <= 3,
          }))
          setLeaderboard(mapped)
          setTotalPages(response.data.pagination.totalPages)
        } else {
          console.error(response.data.message || "Failed to fetch leaderboard")
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [page])

  // Extract top 3 players and remaining players
  const topThreePlayers = leaderboard.slice(0, 3)
  const remainingPlayers = leaderboard.slice(3)

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Podium Section */}
            {topThreePlayers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-8 text-center">Champions Podium</h2>
                <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8 max-w-4xl mx-auto">
                  {/* 2nd Place */}
                  {topThreePlayers.length >= 2 && (
                    <PodiumPlace
                      player={topThreePlayers[1]}
                      height="h-64 md:h-40"
                      icon={<Medal className="w-6 h-6 text-gray-300" />}
                      color="from-gray-400 to-gray-500"
                      textColor="text-gray-300"
                    />
                  )}

                  {/* 1st Place */}
                  {topThreePlayers.length >= 1 && (
                    <PodiumPlace
                      player={topThreePlayers[0]}
                      height="h-72 md:h-48"
                      icon={<Trophy className="w-8 h-8 text-yellow-500" />}
                      color="from-yellow-400 to-yellow-600"
                      textColor="text-yellow-400"
                    />
                  )}

                  {/* 3rd Place */}
                  {topThreePlayers.length >= 3 && (
                    <PodiumPlace
                      player={topThreePlayers[2]}
                      height="h-56 md:h-36"
                      icon={<Medal className="w-6 h-6 text-amber-600" />}
                      color="from-amber-600 to-amber-700"
                      textColor="text-amber-600"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Remaining Players List */}
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">Leaderboard Rankings</h2>
              <Card className="bg-[#181022] border-fuchsia-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-fuchsia-600/10 to-purple-600/10 border-b border-fuchsia-700 p-4">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-300">
                      <span className="w-16 text-center">Rank</span>
                      <span className="flex-1 text-center">Player</span>
                      <span className="w-24 text-right">Rating</span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-800">
                    {leaderboard.map((player) => (
                      <div
                        key={player.rank}
                        className={`flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors ${
                          player.isTop ? "bg-gradient-to-r from-fuchsia-600/5 to-purple-600/5" : ""
                        }`}
                      >
                        <div className="w-16 flex items-center justify-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              player.rank === 1
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
                                : player.rank === 2
                                  ? "bg-gradient-to-r from-gray-400 to-gray-500 text-black"
                                  : player.rank === 3
                                    ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white"
                                    : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {player.rank}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-1 justify-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-white truncate max-w-[150px] md:max-w-[200px]">
                            {player.username}
                          </span>
                        </div>

                        <div className="w-24 flex items-center justify-end space-x-2">
                          <span className={`font-bold text-lg ${player.isTop ? "text-fuchsia-400" : "text-gray-300"}`}>
                            {Math.round(player.rating)}
                          </span>
                          {player.rank <= 3 && (
                            <Crown
                              className={`w-4 h-4 ${
                                player.rank === 1
                                  ? "text-yellow-500"
                                  : player.rank === 2
                                    ? "text-gray-400"
                                    : "text-amber-600"
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="ghost"
                  className="text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-5 h-5 mr-1" /> Prev
                </Button>
                <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
                <Button
                  variant="ghost"
                  className="text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PodiumPlace({ player, height, icon, color, textColor }) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-center">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 mx-auto flex items-center justify-center mb-2 border-4 border-[#0f0a18]">
          <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
        </div>
        <div className="font-bold text-lg md:text-xl truncate max-w-[120px]">{player.username}</div>
        <div className={`flex items-center justify-center gap-2 ${textColor} font-bold`}>
          {icon}
          <span>{Math.round(player.rating)}</span>
        </div>
      </div>
      <div className={`${height} w-28 md:w-36 rounded-t-lg bg-gradient-to-b ${color} flex items-center justify-center`}>
        <div className={`text-3xl md:text-4xl font-bold text-black`}>#{player.rank}</div>
      </div>
    </div>
  )
}
