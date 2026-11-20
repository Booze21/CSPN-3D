/**
 * CENTRAL CONFIGURATION — edit this file only.
 * 3D models: put optimized (Draco-compressed) .glb files in /public/models and set `model`.
 * Until a file exists, that slot shows an empty pedestal with its expected file path.
 */
export const instagram = {
  username: '2cspn',
  profileUrl: 'https://www.instagram.com/2cspn/',
}

export interface SculptureConfig {
  id: string
  name: string
  era: string
  description: string
  model: string // path inside /public
  scale: number
  yOffset: number
  instagramUrl: string // per-sculpture link, or reuse the profile URL
  featured?: boolean
}

export const sculptures: SculptureConfig[] = [
  { id: 'david', name: 'David', era: 'Renaissance · Marble', description: 'The hero of Florence, frozen in perfect tension.', model: 'models/david.glb', scale: 1, yOffset: 0, instagramUrl: instagram.profileUrl, featured: true },
  { id: 'augustus', name: 'Augustus', era: 'Roman · Imperial', description: 'The first emperor of Rome, serene and absolute.', model: 'models/augustus.glb', scale: 1, yOffset: 0, instagramUrl: instagram.profileUrl, featured: true },
  { id: 'spartan', name: 'The Warrior', era: 'Greek · Archaic', description: 'A hoplite frozen at the edge of battle.', model: 'models/warrior.glb', scale: 1, yOffset: 0, instagramUrl: instagram.profileUrl, featured: true },
  { id: 'nefertiti', name: 'Nefertiti', era: 'Egyptian · New Kingdom', description: 'The queen whose profile outlived an empire.', model: 'models/nefertiti.glb', scale: 1, yOffset: 0, instagramUrl: instagram.profileUrl },
  { id: 'medusa', name: 'Medusa', era: 'Mythological', description: 'The gaze that turned the world to stone.', model: 'models/medusa.glb', scale: 1, yOffset: 0, instagramUrl: instagram.profileUrl },
  { id: 'athena', name: 'Athena', era: 'Greek · Classical', description: 'Goddess of wisdom, strategy and craft.', model: 'models/athena.glb', scale: 1, yOffset: 0, instagramUrl: instagram.profileUrl },
]
