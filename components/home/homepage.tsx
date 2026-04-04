"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight } from 'lucide-react';
import { ChatInterface } from "@/components/ai/chat-interface";

export default function Homepage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-white w-full overflow-x-hidden">
      {/* Full-Screen Menu Overlay */}
      <div className={`fixed inset-0 bg-white z-[200] transition-transform duration-500 ease-in-out ${isMenuOpen ? "translate-y-0" : "-translate-y-[102%]"}`}>
        <div className="p-6 px-10 flex justify-between items-center bg-white border-b border-gray-100">
          <Link href="/" className="text-[#2c332e] text-xl font-serif flex items-center gap-2">
            {/* You can replace this with an actual logo SVG/Image */}
            <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-yellow-400 inline-block"></span>
            BETTER <br className="hidden" />EXPERIENCE
          </Link>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="text-gray-500 hover:text-black transition-colors cursor-pointer p-2"
          >
            <X className="w-8 h-8" strokeWidth={1.5} />
          </button>
        </div>

        <div className="h-[calc(100vh-80px)] flex">
          {/* Sidebar Menu List */}
          <div className="w-full md:w-[400px] border-r border-gray-100 h-full overflow-y-auto py-10 px-10 md:px-20">
            <nav className="flex flex-col space-y-4">
              {[
                { name: "About Us", hasSub: true },
                { name: "Destinations", hasSub: true },
                { name: "Resorts", hasSub: true },
                { name: "Experiences", hasSub: true },
                { name: "Wellness", hasSub: true },
                { name: "Celebration & Events", hasSub: false },
                { name: "Boston Day Spa", hasSub: false },
                { name: "Sustainability", hasSub: false },
                { name: "Training & Development", hasSub: false },
                { name: "Coming Soon", hasSub: false },
                { name: "Gallery", hasSub: false },
                { name: "Contact Us", hasSub: false },
              ].map((item, idx) => (
                <Link 
                  key={idx} 
                  href="#" 
                  className="flex items-center justify-between text-lg text-gray-600 hover:text-black transition-colors py-1 group"
                >
                  <span className="font-light">{item.name}</span>
                  {item.hasSub && (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Main content area of the menu (empty in the screenshot, could hold images later) */}
          <div className="hidden md:block flex-1 bg-white"></div>
        </div>
      </div>

      {/* Header / Navigation */}
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between p-6 px-10 text-white bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
        <div className="flex items-center space-x-6 z-50">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center space-x-2 text-sm uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Menu className="w-6 h-6" />
            <span className="hidden md:inline">Menu</span>
          </button>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 z-50">
          <Link href="/" className="text-2xl tracking-[0.2em] font-light uppercase text-center block leading-tight hover:opacity-80 transition-opacity">
            Better<br />Experience
          </Link>
        </div>

        <div className="flex items-center space-x-6 shrink-0 z-50">
          <button className="bg-transparent border border-white px-6 py-2 uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
            Reserve
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[100dvh] w-full bg-black overflow-hidden m-0 p-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-[100dvh] object-cover mix-blend-screen"
          style={{ width: "100%", height: "100vh", objectFit: "cover" }}
          poster="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2680&q=80"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-luxury-resort-pool-and-lounge-chairs-4171-large.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
        
        <div className="hidden absolute bottom-10 left-10 z-20 text-white md:block pointer-events-none">
          <p className="text-sm font-light uppercase tracking-widest drop-shadow-md">
            Splash Sale is Live
          </p>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-24 px-6 md:px-20 max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-serif mb-12 text-[#2c332e]">
          Welcome to Better Experience.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16">
          {/* Column 1: Resorts */}
          <div className="group cursor-pointer flex flex-col items-center text-center">
            <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-4">Resorts</h3>
            <h4 className="text-2xl font-serif text-[#2c332e] mb-4">Extraordinary Destinations</h4>
            <p className="text-gray-600 font-light text-sm leading-relaxed mb-6 px-4">
              Immerse yourself in the breathtaking beauty of picturesque landscapes, where nature&apos;s splendor meets the elegance of world-class hospitality. Experience the rich cultural heritage and tranquil retreats that redefine luxury.
            </p>
            <Link href="#" className="uppercase text-xs tracking-widest border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors">
              Explore Destinations
            </Link>
          </div>

          {/* Column 2: Experiences */}
          <div className="group cursor-pointer flex flex-col items-center text-center">
            <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-4">Experiences</h3>
            <h4 className="text-2xl font-serif text-[#2c332e] mb-4">Thrills, Nature, and Memories</h4>
            <p className="text-gray-600 font-light text-sm leading-relaxed mb-6 px-4">
              Indulge in an exquisite collection of curated experiences designed to awaken your senses. From thrilling outdoor adventures to serene wellness retreats, every moment is tailored for sophistication and delight.
            </p>
            <Link href="#" className="uppercase text-xs tracking-widest border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors">
              Explore Experiences
            </Link>
          </div>

          {/* Column 3: Events */}
          <div className="group cursor-pointer flex flex-col items-center text-center">
            <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-4">Events</h3>
            <h4 className="text-2xl font-serif text-[#2c332e] mb-4">Celebrations at Better Experience</h4>
            <p className="text-gray-600 font-light text-sm leading-relaxed mb-6 px-4">
              Celebrate life&apos;s most cherished moments in unparalleled luxury. From grand weddings to intimate gatherings, our exquisite venues and impeccable service ensure every occasion is nothing short of extraordinary.
            </p>
            <Link href="#" className="uppercase text-xs tracking-widest border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors">
              Explore Events
            </Link>
          </div>
        </div>
      </section>

      {/* Inspirational Locations */}
      <section className="py-16 bg-[#f9f9f9]">
        <div className="px-6 md:px-12 max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-[#2c332e] mb-6">
              Inspirational locations
            </h2>
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              This year, embark on grand adventures, encountering new dimensions spurred by the spirit of Better Experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {[ 
              { title: "African Village", tag: "Shaggar City", img: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2670&auto=format&fit=crop" },
              { title: "Entoto", tag: "Entoto Park, Addis Ababa", img: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2670&auto=format&fit=crop" },
              { title: "Water Park", tag: "Better Experience Water Park", img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2670&auto=format&fit=crop" },
              { title: "Awash Falls", tag: "Awash National Park", img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2680&auto=format&fit=crop" },
              { title: "The Palm", tag: "Northern Afar", img: "https://images.unsplash.com/photo-1535827841776-24afc1e255ac?q=80&w=2670&auto=format&fit=crop" },
              { title: "Bishoftu", tag: "Bishoftu", img: "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=2670&auto=format&fit=crop" }
            ].map((loc, i) => (
              <div key={i} className="group relative h-[450px] overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 z-10" />
                <img 
                  src={loc.img} 
                  alt={loc.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-xs uppercase tracking-[0.2em] mb-3">{loc.tag}</span>
                  <h3 className="text-3xl font-serif mb-6">{loc.title}</h3>
                  <button className="border border-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-300">
                    Explore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2c332e] pt-20 pb-10 text-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div>
              <h4 className="uppercase text-xs tracking-widest text-gray-400 mb-6">More Information</h4>
              <ul className="space-y-4 text-sm font-light text-gray-300">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">+1 234 567 890</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">booking@betterexperience.com</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="uppercase text-xs tracking-widest text-gray-400 mb-6">Resorts</h4>
              <ul className="space-y-4 text-sm font-light text-gray-300">
                <li><Link href="#" className="hover:text-white transition-colors">African Village</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Bishoftu</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Entoto Adventure Park</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Lake Tana</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Awash</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="uppercase text-xs tracking-widest text-gray-400 mb-6">Adventure & Wellness</h4>
              <ul className="space-y-4 text-sm font-light text-gray-300">
                <li><Link href="#" className="hover:text-white transition-colors">Water Park</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Adventure Park</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Day Spa</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Wellness Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="uppercase text-xs tracking-widest text-gray-400 mb-6">Socials</h4>
              <div className="flex space-x-6 text-sm font-light text-gray-300">
                <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
                <Link href="#" className="hover:text-white transition-colors">YouTube</Link>
                <Link href="#" className="hover:text-white transition-colors">Facebook</Link>
                <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-700/50 flex flex-col md:flex-row justify-between items-center text-xs font-light text-gray-400">
            <p>All Copyright © {new Date().getFullYear()} Better Experience Resort & Spa.</p>
            <p className="mt-4 md:mt-0">Powered by ALX</p>
          </div>
        </div>
      </footer>

      <ChatInterface />
    </div>
  );
}
