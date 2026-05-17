import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../lib/useAuth"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Users, Target, Crown, TrendingUp, User } from "lucide-react"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
gsap.registerPlugin(ScrollTrigger)
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { showSuccess, showError } from "../components/ui/sonner"
import axios from "../lib/axios"

export default function LandingPage() {
  const rankedRef = useRef(null)
  const stats = [
    { label: "Active Battlers", value: 10000, color: "text-fuchsia-400" },
    { label: "Battles Fought", value: 50000, color: "text-purple-400" },
    { label: "Live Matches", value: 24, suffix: "/7", color: "text-fuchsia-400" },
  ];
  const statRefs = useRef([]);

  useEffect(() => {
    if (rankedRef.current) {
      gsap.from(rankedRef.current, {
        y: 40,
        opacity: 0,
        duration: 2.5,
        delay: 0.2,
        ease: "power3.out"
      });
    }
    setTimeout(() => {
      const heroRanked = document.getElementById("hero-ranked-force");
      if (heroRanked) {
        gsap.fromTo(heroRanked,
          { opacity: 0, scale: 0.7, filter: 'blur(6px)' },
          {
            opacity: 1,
            scale: 1,
            filter: 'blur(0.1px)',
            duration: 2.2,
            delay: 1,
            ease: "back.out(1.7)"
          }
        );
      }
    }, 0);

    statRefs.current.forEach((el, i) => {
      if (!el) return;
      const end = stats[i].value;
      const obj = { val: 0 };

      if (stats[i].suffix) {
        el.textContent = `0${stats[i].suffix}`;
      } else {
        el.textContent = '0';
      }

      gsap.to(obj, {
        val: end,
        duration: 1.5,
        delay: 0.2 + i * 0.15,
        ease: "power1.out",
        onUpdate: () => {
          if (el) {
            el.textContent = stats[i].suffix
              ? `${Math.floor(obj.val)}${stats[i].suffix}`
              : Math.floor(obj.val).toLocaleString();
          }
        },
        onComplete: () => {
          if (el) {
            el.textContent = stats[i].suffix
              ? `${end}${stats[i].suffix}`
              : end.toLocaleString();
          }
        }
      });
    });

    gsap.from(".hero-badge", {
      scale: 0.7,
      opacity: 0,
      duration: 2,
      delay: 0.3,
      ease: "back.out(1.7)"
    });

    gsap.fromTo(
      ".hero-btn",
      { y: -40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        delay: 0.8,
        ease: "power3.out"
      }
    );

    gsap.from(".animate-hero-fadein", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      delay: 1.7,
      stagger: 0.15,
      ease: "power3.out"
    });

    gsap.utils.toArray('.feature-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        y: 60,
        opacity: 0,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power3.out',
      });
    });
    gsap.utils.toArray('.leaderboard-row').forEach((row, i) => {
      gsap.from(row, {
        scrollTrigger: {
          trigger: row,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        x: i % 2 === 0 ? -60 : 60,
        opacity: 0,
        duration: 0.7,
        delay: i * 0.05,
        ease: 'power2.out',
      });
    });

    // Animation for 'Compete. Win. Get' 
    const mainTitle = document.getElementById('main-title-text');
    if (mainTitle) {
      gsap.fromTo(
        mainTitle,
        { opacity: 0, y: 60, scale: 0.95, filter: 'blur(8px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.5,
          delay: 0.5,
          ease: 'power3.out'
        }
      );
    }
  }, []);

  const { user, refetch } = useAuth()
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get("/leaderboard", { params: { range: 5 } })
        if (response.data.success) {
          const modifiedLeaderboard = response.data.leaderboard.reduce((acc, curr, idx, arr) => {
            if (idx % 2 === 0) {
              acc.push({
                rank: acc.length + 1,
                username: curr,
                rating: parseFloat(arr[idx + 1]),
                isTop: acc.length < 5, // mark top 5 as `isTop`
              });
            }
            return acc;
          }, []);
          setLeaderboard(modifiedLeaderboard)
          console.log("Leaderboard fetched successfully:", response.data.leaderboard)
        } else {
          showError(response.data.message || "Failed to fetch leaderboard")
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      }
    }
    fetchLeaderboard()
  }, [])


  // Handlers for login/signup
  const handleLoginChange = (e) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value })
  const handleSignupChange = (e) => setSignupForm({ ...signupForm, [e.target.name]: e.target.value })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const {data} = await axios.post(`/users/login`, {
        usernameOrEmail: loginForm.email,
        password: loginForm.password,
      })
      if (data.success) {
        showSuccess("Logged in successfully")
        setLoginForm({ email: "", password: "" })
        setLoading(false)
        await refetch()
        setTimeout(() => {
          navigate("/dashboard" , { replace: true })
        }, 1000)
      }
      else {
        showError(data.message || "Login failed")
        setLoading(false)
      }
    } catch (error) {
      if(error.response && error.response.data) {
        showError(error.response.data.message || "Login failed")
      }
      else {
        console.log(error)
        showError("An error occurred while logging in")
      }
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    if (signupForm.password !== signupForm.confirmPassword) {
      showError("Passwords do not match")
      setLoading(false)
      return
    }
    try {
      const response = await axios.post(`/users/signup`, {
        username: signupForm.username,
        email: signupForm.email,
        password: signupForm.password,
      })
      if (response.data.success) {
        showSuccess("Account created successfully! Please log in.")
        setSignupOpen(false)
        setSignupForm({ username: "", email: "", password: "", confirmPassword: "" })
      }
      else {
        showError(response.data.message || "Signup failed")
      }
    } catch (err) {
      showError(err.response?.data?.message || "An error occurred during signup")
    } finally {
      setLoading(false)
    }
  }

  // --- Animated Number Hooks (with trigger) ---
  function useCountUpOnView({ end, duration = 1.2, triggerId }) {
    const [count, setCount] = React.useState(0);
    const [hasAnimated, setHasAnimated] = React.useState(false);
    useEffect(() => {
      if (!triggerId) return;
      let observer;
      const el = document.getElementById(triggerId);
      if (!el) return;
      function handleIntersect(entries) {
        if (entries[0].isIntersecting && !hasAnimated) {
          let raf, start;
          const totalFrames = Math.round(duration * 60);
          let frame = 0;
          function animate(ts) {
            if (!start) start = ts;
            frame = Math.min(totalFrames, Math.round(((ts - start) / 1000) * 60));
            const progress = Math.min(frame / totalFrames, 1);
            setCount(Math.floor(progress * end));
            if (frame < totalFrames) {
              raf = requestAnimationFrame(animate);
            } else {
              setCount(end);
              setHasAnimated(true);
            }
          }
          raf = requestAnimationFrame(animate);
          observer.disconnect();
          return () => cancelAnimationFrame(raf);
        }
      }
      observer = new window.IntersectionObserver(handleIntersect, { threshold: 0.4 });
      observer.observe(el);
      return () => observer && observer.disconnect();
    }, [end, duration, triggerId, hasAnimated]);
    return count;
  }

  function useAnimatedNumberOnView(finalValue, duration = 1.2, min = 1, max = 30, triggerId) {
    const [value, setValue] = React.useState(0);
    const [hasAnimated, setHasAnimated] = React.useState(false);
    useEffect(() => {
      if (!triggerId) return;
      let observer;
      const el = document.getElementById(triggerId);
      if (!el) return;
      function handleIntersect(entries) {
        if (entries[0].isIntersecting && !hasAnimated) {
          let raf, start;
          const totalFrames = Math.round(duration * 60);
          let frame = 0;
          function animate(ts) {
            if (!start) start = ts;
            frame = Math.min(totalFrames, Math.round(((ts - start) / 1000) * 60));
            if (frame < totalFrames) {
              setValue(Math.floor(Math.random() * (max - min + 1)) + min);
              raf = requestAnimationFrame(animate);
            } else {
              setValue(finalValue);
              setHasAnimated(true);
            }
          }
          raf = requestAnimationFrame(animate);
          observer.disconnect();
          return () => cancelAnimationFrame(raf);
        }
      }
      observer = new window.IntersectionObserver(handleIntersect, { threshold: 0.4 });
      observer.observe(el);
      return () => observer && observer.disconnect();
    }, [finalValue, duration, min, max, triggerId, hasAnimated]);
    return value;
  }

  // --- Animated stats values (triggered on view) ---
  const activeBattlers = useCountUpOnView({ end: 10000, duration: 3.4, triggerId: 'stats-section' });
  const battlesFought = useCountUpOnView({ end: 50000, duration: 3.4, triggerId: 'stats-section' });
  const liveMatches = useAnimatedNumberOnView(24, 3.4, 10, 30, 'stats-section');
  const liveDays = useAnimatedNumberOnView(7, 3.4, 1, 9, 'stats-section');

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#101010]/95 backdrop-blur supports-[backdrop-filter]:bg-[#101010]/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-4xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent" ref={rankedRef}>
              Ranked
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => setLoginOpen(true)}
            >
              Login
            </Button>
            <Button
              className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white border-0"
              onClick={() => setSignupOpen(true)}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="hero-badge mb-6 bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 hover:bg-fuchsia-500/20 p-4 text-xl">
            Live 1v1 Battles
          </Badge>

          <h1
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
            style={{ minHeight: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <span id="main-title-text" style={{ display: 'inline-block', marginRight: '0.5ch' }}>
              Compete. Win. Get
            </span>
            <span style={{ display: 'inline-block', width: '1ch' }} />
            <span
              className="hero-ranked bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent"
              style={{ display: 'inline-flex', minWidth: '7ch', letterSpacing: '0.05em', fontWeight: 700 }}
              id="hero-ranked-force"
            >
              Ranked
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Face off against developers worldwide in real-time DSA challenges. Climb the ranks, prove your skills, and
            become the ultimate coding champion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              className="hero-btn bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white border-0 text-lg px-8 py-6 h-auto font-semibold shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 transition-all duration-300"
              type="button"
              style={{ display: 'inline-block' }}
              onClick={() => user ? navigate('/battle') : setLoginOpen(true)}
            >
              Enter Battle Arena
            </Button>
          </div>

          {/* Stats */}
          <div id="stats-section" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-fuchsia-400 mb-2">
                {activeBattlers.toLocaleString()}+
              </div>
              <div className="text-gray-400">Active Battlers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {battlesFought.toLocaleString()}+
              </div>
              <div className="text-gray-400">Battles Fought</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-fuchsia-400 mb-2">
                {liveMatches}/{liveDays}
              </div>
              <div className="text-gray-400">Live Matches</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-gray-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-hero-fadein">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
                Ranked?
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto animate-hero-fadein">
              The ultimate platform for competitive programming and skill development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="feature-card bg-gray-900/50 border-gray-800 hover:border-fuchsia-500/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-time Battles</h3>
                <p className="text-gray-400">
                  Face opponents in live 1v1 coding challenges with instant feedback and results.
                </p>
              </CardContent>
            </Card>

            <Card className="feature-card bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Rating System</h3>
                <p className="text-gray-400">
                  Climb the leaderboards with our ELO-based rating system and track your progress.
                </p>
              </CardContent>
            </Card>

            <Card className="feature-card bg-gray-900/50 border-gray-800 hover:border-fuchsia-500/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Global Community</h3>
                <p className="text-gray-400">Connect with developers worldwide and learn from the best in the field.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Real-time{" "}
              <span className="bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">See who's dominating the arena right now</p>
          </div>

          <div className="text-center m-6">
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Live Updates
            </Badge>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* --- UNIFY LEADERBOARD CARD COLORS --- */}
            <Card className="bg-[#181022] border-fuchsia-700 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-fuchsia-600/10 to-purple-600/10 border-b border-fuchsia-700 p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-300">
                    <span>Rank</span>
                    <span>Player</span>
                    <span>Rating</span>
                  </div>
                </div>

                <div className="divide-y divide-fuchsia-900/30">
                  {leaderboard.map((player) => (
                    <div
                      key={player.rank}
                      className={`leaderboard-row flex items-center justify-between p-4 transition-colors ${player.isTop ? "bg-gradient-to-r from-fuchsia-600/5 to-purple-600/5" : "hover:bg-fuchsia-900/10"
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${player.rank === 1
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black"
                            : player.rank === 2
                              ? "bg-gradient-to-r from-gray-400 to-gray-500 text-black"
                              : player.rank === 3
                                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white"
                                : "bg-[#232136] text-gray-300 border border-fuchsia-900/30"
                            }`}
                        >
                          {player.rank}
                        </div>
                      </div>

                      {/* Align avatar and name to the center under Player heading */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-white text-center truncate">{player.username}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-lg ${player.isTop ? "text-fuchsia-400" : "text-gray-300"}`}>
                          {player.rating.toLocaleString()}
                        </span>
                        {player.rank <= 3 && (
                          <Crown
                            className={`w-4 h-4 ${player.rank === 1
                              ? "text-yellow-400"
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

                <div className="bg-[#232136] border-t border-fuchsia-900/30 p-4 text-center">
                  <Button variant="ghost" className="text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10" onClick={() => navigate('/leaderboard')}>
                    View Full Leaderboard
                    <TrendingUp className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-fuchsia-900/20 to-purple-900/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Crown className="w-16 h-16 text-fuchsia-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Prove Your Worth?</h2>
            <p className="text-xl text-gray-400 mb-8">
              Do you have what it takes to rise through the ranks and become a coding champion?
            </p>
            <Button
              size="lg"
              className=" bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white border-0 text-lg md:text-2xl px-12 py-6 h-auto font-semibold shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 transition-all duration-300"
              onClick={() => user ? navigate('/battle') : setSignupOpen(true)}
            >
              Start Your Battle Journey
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 bg-[#101010]">
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Ranked. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="bg-[#181022] border-fuchsia-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
              Login
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your email and password to sign in
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="grid gap-4 py-4">
            <Input
              name="email"
              type="text"
              placeholder="Email or Username"
              value={loginForm.email}
              onChange={handleLoginChange}
              required
              className="bg-[#232136] border-fuchsia-700 text-white"
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={handleLoginChange}
              required
              className="bg-[#232136] border-fuchsia-700 text-white"
            />
            <DialogFooter>
              <Button
                type="submit"
                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white border-0 font-semibold"
                disabled={loading}
              >
                {loading ? "Logging In..." : "Log In"}
              </Button>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:text-fuchsia-600 hover:bg-fuchsia-900/10 transition-colors"
                >
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Signup Dialog */}
      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogTrigger asChild>
        </DialogTrigger>
        <DialogContent className="bg-[#181022] border-fuchsia-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
              Sign Up
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Create your account to get started
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="grid gap-4 py-4">
            <Input
              name="username"
              type="text"
              placeholder="Username"
              value={signupForm.username}
              onChange={handleSignupChange}
              required
              className="bg-[#232136] border-fuchsia-700 text-white"
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={signupForm.email}
              onChange={handleSignupChange}
              required
              className="bg-[#232136] border-fuchsia-700 text-white"
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={signupForm.password}
              onChange={handleSignupChange}
              required
              className="bg-[#232136] border-fuchsia-700 text-white"
            />
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={signupForm.confirmPassword}
              onChange={handleSignupChange}
              required
              className="bg-[#232136] border-fuchsia-700 text-white"
            />
            <DialogFooter>
              <Button
                type="submit"
                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white border-0 font-semibold"
                disabled={loading}
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </Button>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:text-fuchsia-600 hover:bg-fuchsia-900/10 transition-colors"
                >
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Style Dialog cross (close) button globally for dialogs on this page */}
      <style>{`
        .fixed > button.absolute.top-4.right-4,
        .fixed > .absolute.top-4.right-4 {
          color: white !important;
          transition: color 0.2s;
        }
        .fixed > button.absolute.top-4.right-4:hover,
        .fixed > .absolute.top-4.right-4:hover {
          color: #101010 !important;
          background: white !important;
        }
      `}</style>
    </div>
  )
}

