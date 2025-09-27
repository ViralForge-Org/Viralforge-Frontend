"use client"

import FeaturesSectionDemo from "@/components/Landing/Features"
import Footer from "@/components/Landing/Footer"
import AnimatedHeading from "@/components/Landing/Heading"
import TimelineDemo from "@/components/Landing/Timeline"

const Page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 relative overflow-hidden">
      {/* Comic Dot Pattern Background */}
      <div className="absolute inset-0 opacity-20"
           style={{
             backgroundImage: `radial-gradient(circle, #ff6b6b 2px, transparent 2px)`,
             backgroundSize: '30px 30px'
           }} />


      <AnimatedHeading />

      <div className="min-h-screen relative">
        <div className="relative w-full max-w-6xl mx-auto h-[80vh] flex items-center justify-center px-4">
          <div className="text-center z-10 max-w-4xl">
            <h2 className="text-gray-900 text-4xl md:text-6xl font-black mb-6 leading-tight transform -rotate-1"
                style={{
                  textShadow: '4px 4px 0px #ffeb3b, -2px -2px 0px #ff5722',
                  fontFamily: 'Comic Sans MS, cursive'
                }}>
              WHERE MEMES MEET
              <span className="block text-red-600 transform rotate-2">WEB3 POWER! 💥</span>
            </h2>
            <p className="text-gray-700 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed font-bold">
              🎨 Create viral meme templates, vote on the funniest content, and earn rewards when your taste in humor pays
              off. The future of meme culture is here! 🚀
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/app/memes")}
                className="px-8 py-4 bg-red-500 hover:bg-red-600 border-4 border-black text-white rounded-xl font-black transition-all duration-300 transform hover:scale-110 hover:rotate-3 shadow-xl uppercase"
              >
                🎨 START CREATING!
              </button>
              <button
                onClick={() => (window.location.href = "/app/memes")}
                className="px-8 py-4 bg-blue-400 hover:bg-blue-500 border-4 border-black text-white rounded-xl font-black transition-all duration-300 transform hover:scale-110 hover:-rotate-3 shadow-xl uppercase"
              >
                🔍 EXPLORE MEMES!
              </button>
            </div>
          </div>
        </div>
      </div>

      <FeaturesSectionDemo />
      <TimelineDemo />
      <Footer />
    </div>
  )
}

export default Page
