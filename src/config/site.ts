/** CENTRAL CONFIGURATION — edit this file only. */
export const instagram = {
  username: '2cspn',
  profileUrl: 'https://www.instagram.com/2cspn/',
}

export const site = {
  title: 'Welcome',
  subtitle: 'THE ART OF ETERNITY',
  buttonLabel: 'Open Instagram',
  hint: 'Tap the statue',
  hall: 'models/hall.glb', // full-screen background building
}

/** Statue + heads. Clicking the statue switches to the next one.
 *  rotation = [x, y, z] in radians if a model stands wrong; keepMaterial keeps the model's own texture. */
export const models: { file: string; rotation: [number, number, number]; keepMaterial: boolean }[] = [
  { file: 'models/david.glb', rotation: [0, 0, 0], keepMaterial: false },
  { file: 'models/head1.glb', rotation: [0, 0, 0], keepMaterial: true },
  { file: 'models/head2.glb', rotation: [0, 0, 0], keepMaterial: false },
]
