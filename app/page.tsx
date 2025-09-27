"use client"

import FeaturesSectionDemo from "@/components/Landing/Features"
import Footer from "@/components/Landing/Footer"
import AnimatedHeading from "@/components/Landing/Heading"
import TimelineDemo from "@/components/Landing/Timeline"

const Page = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <AnimatedHeading />
      <div className="min-h-screen relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="relative w-full max-w-6xl mx-auto h-[80vh] flex items-center justify-center px-4">
          <div className="text-center z-10 max-w-4xl">
            <h2 className="text-white text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Where Memes Meet
              <span className="block text-blue-400">Web3 Economics</span>
            </h2>
            <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              Create viral meme templates, vote on the funniest content, and earn rewards when your taste in humor pays
              off. The future of meme culture is here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/app/memes")}
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                Start Creating
              </button>
              <button
                onClick={() => (window.location.href = "/app/memes")}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 border border-gray-700 hover:border-gray-600"
              >
                Explore Memes
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
