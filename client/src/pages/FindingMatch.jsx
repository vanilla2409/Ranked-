import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Brain } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Sword, Target, Zap, Trophy, Code } from "lucide-react";

// Define tips outside the component for stability
const matchingTips = [
  "Tip: Use efficient algorithms to optimize your code.",
  "Tip: Always test edge cases to ensure robustness.",
  "Tip: Keep your code clean and well-commented for better readability.",
  "Tip: Practice regularly to improve your coding skills.",
  "Tip: Collaborate with others to learn new techniques."
];

export default function FindingMatchPage() {
  const [currentTip, setCurrentTip] = useState(0);

  // Memoize tips to ensure stability (optional, since it's already defined outside)
  const tips = useMemo(() => matchingTips, []);

  useEffect(() => {
    // Tip rotation
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => {
        // Ensure the tips array is not empty to avoid division by zero
        if (tips.length === 0) return 0;
        return (prev + 1) % tips.length;
      });
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(tipInterval);
  }, [tips]); // Add tips to dependency array for robustness

  return (
    <div className="min-h-screen bg-[#101010] text-white overflow-hidden relative flex flex-col items-baseline justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-fuchsia-400/20 rounded-full blur-2xl animate-ping"></div>
      </div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main Matching Card */}
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm mb-8">
            <CardContent className="p-8 text-center">
              {/* Animated Swords */}
              <div className="relative mb-8">
                <div className="flex items-center justify-center space-x-8">
                  <div className="relative">
                    <Sword className="w-16 h-16 text-fuchsia-500 animate-bounce" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-fuchsia-500 rounded-full animate-ping"></div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-fuchsia-500 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-200"></div>
                    <div className="w-3 h-3 bg-fuchsia-500 rounded-full animate-pulse delay-400"></div>
                  </div>

                  <div className="relative">
                    <Sword className="w-16 h-16 text-purple-500 animate-bounce delay-500" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full animate-ping delay-500"></div>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
                  Finding Your Opponent
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-8">
                Searching for a worthy challenger to test your coding skills...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-center w-full">
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm mb-8 ">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Brain className="w-5 h-5 mr-2 text-fuchsia-500" />
              Pro Tips
            </h3>
            <Badge className="bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20">
              Tip {currentTip + 1} of {tips.length}
            </Badge>
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-300 animate-fade-in">
              {tips.length > 0 ? tips[currentTip] : "No tips available"}
            </p>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 animate-float">
        <Code className="w-8 h-8 text-fuchsia-500/30" />
      </div>
      <div className="absolute top-40 right-20 animate-float delay-1000">
        <Trophy className="w-6 h-6 text-purple-500/30" />
      </div>
      <div className="absolute bottom-40 left-20 animate-float delay-2000">
        <Target className="w-7 h-7 text-fuchsia-500/30" />
      </div>
      <div className="absolute bottom-20 right-10 animate-float delay-500">
        <Zap className="w-5 h-5 text-purple-500/30" />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}