/**
 * Built-in game icon library: PNGs served from public/icons, listed here so
 * the inspector can show a picker without fetching a manifest. An asset
 * refers to one as icon = "pack:<name>".
 */
export type PackIcon = { name: string; label: string; width: number; height: number };
export const packIcons: PackIcon[] = [
  { name: "coin-gold", label: "Coin gold", width: 180, height: 181 },
  { name: "gem-silver", label: "Gem silver", width: 161, height: 177 },
  { name: "gem-green", label: "Gem green", width: 164, height: 177 },
  { name: "gem-purple", label: "Gem purple", width: 181, height: 175 },
  { name: "heart-red", label: "Heart red", width: 184, height: 162 },
  { name: "star-gold", label: "Star gold", width: 179, height: 176 },
  { name: "energy-lightning", label: "Energy lightning", width: 132, height: 174 },
  { name: "experience-badge", label: "Experience badge", width: 192, height: 191 },
  { name: "shield-blue", label: "Shield blue", width: 156, height: 175 },
  { name: "sword", label: "Sword", width: 169, height: 178 },
  { name: "bullet-gold", label: "Bullet gold", width: 156, height: 175 },
  { name: "magnet", label: "Magnet", width: 167, height: 165 },
  { name: "stopwatch", label: "Stopwatch", width: 157, height: 182 },
  { name: "speed-shoe", label: "Speed shoe", width: 191, height: 169 },
  { name: "medkit", label: "Medkit", width: 172, height: 161 },
  { name: "bomb", label: "Bomb", width: 159, height: 181 },
  { name: "arrow-up", label: "Arrow up", width: 162, height: 169 },
  { name: "arrow-down", label: "Arrow down", width: 163, height: 161 },
  { name: "fast-forward", label: "Fast forward", width: 165, height: 135 },
  { name: "snowflake", label: "Snowflake", width: 165, height: 181 },
  { name: "fire", label: "Fire", width: 149, height: 175 },
  { name: "poison-skull", label: "Poison skull", width: 171, height: 170 },
  { name: "ammo-bullets", label: "Ammo bullets", width: 165, height: 145 },
  { name: "rocket", label: "Rocket", width: 163, height: 192 },
  { name: "key-gold", label: "Key gold", width: 155, height: 171 },
  { name: "settings-gear", label: "Settings gear", width: 166, height: 169 },
  { name: "radar", label: "Radar", width: 176, height: 176 },
  { name: "drone", label: "Drone", width: 158, height: 164 },
  { name: "shield-gold", label: "Shield gold", width: 157, height: 169 },
  { name: "gold-bar", label: "Gold bar", width: 169, height: 144 },
  { name: "crown-ticket", label: "Crown ticket", width: 169, height: 138 },
  { name: "gift-box", label: "Gift box", width: 178, height: 174 },
  { name: "chest-wood", label: "Chest wood", width: 211, height: 189 },
  { name: "chest-blue", label: "Chest blue", width: 190, height: 176 },
  { name: "chest-purple", label: "Chest purple", width: 197, height: 189 },
  { name: "crate-military", label: "Crate military", width: 192, height: 183 },
  { name: "ammo-crate", label: "Ammo crate", width: 205, height: 178 },
  { name: "battery", label: "Battery", width: 110, height: 174 },
  { name: "potion-green", label: "Potion green", width: 146, height: 189 },
  { name: "fuel-can", label: "Fuel can", width: 166, height: 176 },
  { name: "replay", label: "Replay", width: 182, height: 192 },
  { name: "home", label: "Home", width: 192, height: 177 },
  { name: "double-2x", label: "Double 2x", width: 192, height: 186 },
];
export const isPackIcon = (icon: string) => icon.startsWith("pack:");
export const packIconName = (icon: string) => icon.slice(5);
export const packIconUrl = (icon: string) => `/icons/${packIconName(icon)}.png`;
export const packIconExists = (icon: string) =>
  isPackIcon(icon) && packIcons.some((p) => p.name === packIconName(icon));
