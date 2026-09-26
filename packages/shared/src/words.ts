export const WORD_CATEGORIES: Record<string, string[]> = {
  classic: [
    "banana", "umbrella", "sandwich", "bicycle", "volcano", "pillow", "ladder",
    "campfire", "backpack", "toothbrush", "balloon", "skateboard", "pancake",
    "flashlight", "snowman", "hammock", "cactus", "jellyfish", "spaceship",
    "accordion", "lighthouse", "pretzel", "kangaroo", "waffle", "telescope",
    "octopus", "penguin", "dinosaur", "robot", "castle", "dragon", "mermaid",
    "wizard", "ninja", "pirate", "vampire", "zombie", "alien", "ghost",
    "giraffe", "snail", "flamingo", "sloth", "hedgehog", "unicorn", "shark",
    "crocodile", "owl", "bat", "crab", "whale", "turtle", "llama", "peacock",
    "rocket", "guitar", "headphones", "crown", "sunglasses", "lollipop",
  ],
  actions: [
    "sneezing", "juggling", "snoring", "dancing", "yodeling", "hiccup",
    "wrestling", "surfing", "skydiving", "hula hoop", "tightrope walking",
    "moonwalk", "cartwheel", "photobomb", "brain freeze", "sleepwalking",
    "stage diving", "karaoke", "tripping over", "high five", "fist bump",
    "a selfie", "belly flop", "limbo", "pillow fight", "sword swallowing",
  ],
  food: [
    "spaghetti", "sushi", "taco", "popcorn", "donut", "burrito", "cupcake",
    "watermelon", "avocado", "pineapple", "marshmallow", "meatball",
    "birthday cake", "french fries", "hot sauce", "ice cream cone", "pizza",
    "dumpling", "corn dog", "croissant", "bubble tea", "fortune cookie",
    "cheese wheel", "gingerbread man", "fried egg", "nachos",
  ],
  weird: [
    "a suspicious hot dog", "gym socks", "a guilty dog", "bad wifi",
    "monday morning", "an awkward hug", "a plot twist", "a haunted toaster",
    "a conspiracy theory", "a mid-life crisis", "a group chat argument",
    "a bad haircut", "existential dread", "a rubber duck army",
    "a cat plotting revenge", "a printer jam", "a broken vending machine",
    "a suspicious noise at 3am", "a group project", "buffering",
    "a sock with a hole", "a sneaky pigeon", "an angry cloud", "a dramatic hamster",
    "a banana in disguise", "a very tired battery", "a spoiled teenager potato",
    "a ghost doing taxes", "a dog on a zoom call", "a frog in a tuxedo",
  ],
  nature: [
    "tornado", "rainbow", "waterfall", "glacier", "coral reef", "quicksand",
    "avalanche", "meteor shower", "northern lights", "desert oasis",
    "volcano island", "thunderstorm", "sunflower", "mushroom", "full moon",
    "cave", "iceberg", "palm tree", "bonsai", "venus flytrap", "cobweb",
  ],
  objects: [
    "trampoline", "chandelier", "typewriter", "compass", "anchor", "kite",
    "wheelbarrow", "scarecrow", "windmill", "beehive", "birdcage", "seesaw",
    "hourglass", "disco ball", "fire hydrant", "traffic cone", "lava lamp",
    "roller coaster", "ferris wheel", "hot air balloon", "submarine",
    "treasure chest", "magnifying glass", "paper airplane", "snow globe",
    "mailbox", "rubber duck", "boombox", "piggy bank", "fidget spinner",
  ],
  wild: [
    "superhero", "time machine", "treasure map", "secret handshake",
    "invisible friend", "robot uprising", "parallel universe", "black hole",
    "alien abduction", "haunted house", "zombie apocalypse", "magic carpet",
    "genie lamp", "dragon egg", "pirate ship", "crystal ball", "werewolf",
    "yeti", "loch ness monster", "sphinx", "mummy", "spaceship crash",
  ],
};

export const WORD_LIST: string[] = Object.values(WORD_CATEGORIES).flat();

export type WordDifficulty = "easy" | "medium" | "hard";

/** Rough difficulty by shape of the word: single short nouns are easy, long phrases are hard. */
export function wordDifficulty(word: string): WordDifficulty {
  const words = word.trim().split(/\s+/).length;
  const letters = word.replace(/[^a-z]/gi, "").length;
  if (words >= 3 || letters >= 14) return "hard";
  if (words === 2 || letters >= 8) return "medium";
  return "easy";
}

/** How many words are in a prompt, e.g. "hula hoop" -> 2, "a suspicious hot dog" -> 4. */
export function promptWordCount(word: string): number {
  return word.trim().split(/\s+/).length;
}

/**
 * `difficulty`, when given, restricts choices to that tier (the host's chosen game
 * mode) — every word offered that turn is the same difficulty. `maxWords` caps how
 * long a prompt's phrase can be (1/2/3 words); choices naturally end up a mix of
 * shorter and longer prompts up to that cap, not all exactly that length.
 *
 * Falls back in stages if a combination leaves too few words to fill `count`:
 * difficulty+length -> difficulty alone -> the full list. Difficulty wins over the
 * length cap since it's the more deliberate choice (e.g. "Tricky" + "1 word" has no
 * matches at all — our hard words are never single short words — so that turn just
 * ignores the length cap rather than ignoring difficulty).
 */
export function pickRandomWords(
  count: number,
  exclude: Set<string> = new Set(),
  difficulty?: WordDifficulty,
  maxWords?: number,
): string[] {
  let pool = WORD_LIST.filter((w) => !exclude.has(w));
  if (difficulty) {
    const tier = pool.filter((w) => wordDifficulty(w) === difficulty);
    if (tier.length >= count) pool = tier;
  }
  if (maxWords) {
    const short = pool.filter((w) => promptWordCount(w) <= maxWords);
    if (short.length >= count) pool = short;
  }
  const source = pool.length >= count ? pool : WORD_LIST;
  const picked: string[] = [];
  while (picked.length < count && picked.length < source.length) {
    const w = source[Math.floor(Math.random() * source.length)];
    if (!picked.includes(w)) picked.push(w);
  }
  return picked;
}
