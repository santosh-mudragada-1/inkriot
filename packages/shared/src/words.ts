export const WORD_LIST: string[] = [
  // everyday
  "banana", "umbrella", "sandwich", "bicycle", "volcano", "pillow", "ladder",
  "campfire", "backpack", "toothbrush", "balloon", "skateboard", "pancake",
  "flashlight", "snowman", "hammock", "cactus", "jellyfish", "spaceship",
  "accordion", "lighthouse", "pretzel", "kangaroo", "waffle", "telescope",
  "octopus", "penguin", "dinosaur", "robot", "castle", "dragon", "mermaid",
  "wizard", "ninja", "pirate", "vampire", "zombie", "alien", "ghost",
  // actions
  "sneezing", "juggling", "snoring", "dancing", "yodeling", "hiccup",
  "wrestling", "surfing", "skydiving", "hula hoop", "tightrope walking",
  // food
  "spaghetti", "sushi", "taco", "popcorn", "donut", "burrito", "cupcake",
  "watermelon", "avocado", "pineapple", "marshmallow", "meatball",
  // weird/funny
  "a suspicious hot dog", "gym socks", "a guilty dog", "bad wifi",
  "monday morning", "an awkward hug", "a plot twist", "a haunted toaster",
  "a conspiracy theory", "a mid-life crisis", "a group chat argument",
  "a bad haircut", "existential dread", "a rubber duck army",
  "a cat plotting revenge", "a printer jam", "a broken vending machine",
  "a suspicious noise at 3am", "a group project", "buffering",
  // nature
  "tornado", "rainbow", "waterfall", "glacier", "coral reef", "quicksand",
  "avalanche", "meteor shower", "northern lights", "desert oasis",
  // objects
  "trampoline", "chandelier", "typewriter", "compass", "anchor", "kite",
  "wheelbarrow", "scarecrow", "windmill", "beehive", "birdcage", "seesaw",
  // pop-ish generic
  "superhero", "time machine", "treasure map", "secret handshake",
  "invisible friend", "robot uprising", "parallel universe", "black hole",
];

export const WORD_CATEGORIES: Record<string, string[]> = {
  classic: WORD_LIST.slice(0, 38),
  actions: WORD_LIST.slice(38, 49),
  food: WORD_LIST.slice(49, 61),
  weird: WORD_LIST.slice(61, 81),
  nature: WORD_LIST.slice(81, 91),
  objects: WORD_LIST.slice(91, 103),
  wild: WORD_LIST.slice(103),
};

export function pickRandomWords(count: number, exclude: Set<string> = new Set()): string[] {
  const pool = WORD_LIST.filter((w) => !exclude.has(w));
  const source = pool.length >= count ? pool : WORD_LIST;
  const picked = new Set<string>();
  while (picked.size < count && picked.size < source.length) {
    picked.add(source[Math.floor(Math.random() * source.length)]);
  }
  return Array.from(picked);
}
