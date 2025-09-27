"use client"

import { Search, ImagePlus, Trophy } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export function NavBarDemo() {
  const navItems = [
    { name: 'Explore', url: '/app/memes', icon: Search },
    { name: 'Create', url: '/app/memes/create', icon: ImagePlus },
    { name: 'Settlements', url: '/app/memes/settlements', icon: Trophy }
  ]

  return <NavBar items={navItems} />
}