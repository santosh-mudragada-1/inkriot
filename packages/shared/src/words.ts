/**
 * Word library, hand-sorted into difficulty tiers by how hard the thing is to *draw*
 * and *recognise* — not by spelling length. Every prompt should be sketchable in under
 * a minute; abstract ideas ("existential dread", "bad wifi") were cut on purpose.
 *
 *  - easy:   one recognisable object/animal a kid could draw
 *  - medium: needs a detail or two to read (props, context, a second noun)
 *  - hard:   ("Tricky") scenes, actions, compound ideas — drawable, but you have to think
 */
export const WORDS_BY_DIFFICULTY = {
  easy: [
    // animals
    "cat", "dog", "fish", "bird", "cow", "pig", "duck", "frog", "snake", "mouse",
    "horse", "sheep", "rabbit", "bear", "lion", "tiger", "zebra", "monkey", "elephant", "giraffe",
    "penguin", "owl", "bat", "crab", "whale", "turtle", "snail", "spider", "bee", "butterfly",
    "ant", "ladybug", "worm", "shark", "octopus", "jellyfish", "starfish", "dolphin", "chicken", "fox",
    "koala", "panda", "kangaroo", "camel", "hippo", "crocodile", "dinosaur", "unicorn", "dragon", "llama",
    // food
    "apple", "banana", "pizza", "cake", "donut", "cookie", "carrot", "cheese", "egg", "bread",
    "cherry", "grapes", "lemon", "orange", "pear", "pineapple", "strawberry", "watermelon", "corn", "burger",
    "hot dog", "fries", "popcorn", "lollipop", "cupcake", "ice cream", "pancake", "taco", "sandwich", "candy",
    "mushroom", "pumpkin", "broccoli", "peas", "coconut", "avocado", "sushi", "pretzel", "noodles", "milk",
    // things
    "ball", "book", "chair", "table", "bed", "lamp", "clock", "phone", "key", "door",
    "window", "house", "car", "bus", "train", "boat", "plane", "rocket", "bike", "truck",
    "tree", "flower", "sun", "moon", "star", "cloud", "rain", "snow", "rainbow", "fire",
    "hat", "shoe", "sock", "shirt", "glasses", "crown", "ring", "bag", "umbrella", "scarf",
    "cup", "spoon", "fork", "knife", "plate", "bottle", "pencil", "scissors", "brush", "comb",
    "guitar", "drum", "piano", "trumpet", "bell", "kite", "balloon", "gift", "candle", "robot",
    "ghost", "alien", "pirate", "king", "queen", "clown", "witch", "snowman", "castle", "tent",
    "heart", "smile", "eye", "nose", "hand", "foot", "ear", "tooth", "bone", "skull",
    "leaf", "cactus", "palm tree", "island", "mountain", "volcano", "river", "beach", "wave", "shell",
    "anchor", "ladder", "hammer", "saw", "axe", "shovel", "bucket", "broom", "mop", "toothbrush",
    "sword", "shield", "bow", "arrow", "flag", "map", "coin", "diamond", "magnet", "battery",
    "tv", "computer", "camera", "radio", "headphones", "light bulb", "fan", "bridge", "tower", "igloo",
    "snowflake", "lightning", "tornado", "feather", "nest", "web", "teddy bear", "doll", "yo-yo",
  ],
  medium: [
    // animals with a twist / less common
    "flamingo", "peacock", "hedgehog", "sloth", "raccoon", "squirrel", "beaver", "walrus", "seal", "parrot",
    "toucan", "swan", "goose", "pelican", "eagle", "vulture", "moose", "deer", "reindeer", "gorilla",
    "rhino", "cheetah", "leopard", "wolf", "skunk", "porcupine", "armadillo", "chameleon", "lizard", "scorpion",
    "caterpillar", "dragonfly", "mosquito", "lobster", "shrimp", "squid", "seahorse", "stingray", "pufferfish", "narwhal",
    "mermaid", "vampire", "zombie", "wizard", "ninja", "superhero", "astronaut", "cowboy", "knight", "fairy",
    "mummy", "werewolf", "yeti", "genie", "scarecrow", "chef", "doctor", "firefighter", "police officer", "mail carrier",
    // food & kitchen
    "spaghetti", "meatball", "burrito", "dumpling", "croissant", "waffle", "bagel", "cinnamon roll", "gingerbread man", "fried egg",
    "birthday cake", "ice cream cone", "milkshake", "bubble tea", "fortune cookie", "nachos", "corn dog", "cheese wheel", "french toast", "popsicle",
    "cotton candy", "candy cane", "chocolate bar", "peanut butter", "jelly bean", "hot sauce", "salt shaker", "frying pan", "teapot", "toaster",
    "blender", "microwave", "fridge", "rolling pin", "lunchbox", "picnic basket", "cereal bowl", "pizza slice", "soda can", "baguette",
    // objects & places
    "backpack", "flashlight", "telescope", "microscope", "binoculars", "compass", "hourglass", "stopwatch", "alarm clock", "calculator",
    "skateboard", "rollerskates", "surfboard", "snowboard", "sled", "scooter", "wheelbarrow", "tractor", "helicopter", "submarine",
    "sailboat", "canoe", "hot air balloon", "parachute", "fire truck", "ambulance", "school bus", "police car", "taxi", "motorcycle",
    "lighthouse", "windmill", "barn", "treehouse", "skyscraper", "pyramid", "haunted house", "circus tent", "playground",
    "trampoline", "seesaw", "swing", "slide", "sandcastle", "roller coaster", "ferris wheel", "carousel", "bowling pin", "dartboard",
    "chandelier", "fireplace", "bathtub", "shower", "toilet", "sink", "mirror", "couch", "bunk bed", "rocking chair",
    "typewriter", "piggy bank", "treasure chest", "magnifying glass", "paper airplane", "snow globe", "mailbox", "rubber duck", "boombox", "disco ball",
    "lava lamp", "traffic light", "traffic cone", "fire hydrant", "stop sign", "parking meter", "street lamp", "bench", "fountain", "statue",
    "beehive", "birdcage", "fishbowl", "dog house", "spider web", "cobweb", "birthday hat", "party popper", "fireworks",
    "guitar pick", "violin", "saxophone", "harp", "accordion", "xylophone", "microphone", "megaphone", "joystick", "game controller",
    "sunglasses", "bow tie", "top hat", "baseball cap", "sneaker", "high heels", "flip flops", "raincoat", "mittens", "pajamas",
    // nature
    "waterfall", "glacier", "iceberg", "cave", "desert", "oasis", "jungle", "swamp", "canyon", "coral reef",
    "sunflower", "rose", "tulip", "cherry blossom", "bonsai", "venus flytrap", "pine tree", "acorn", "four leaf clover", "full moon",
    "sunset", "thunderstorm", "hailstorm", "puddle", "campfire", "log cabin", "hammock", "sandstorm", "meteor",
  ],
  hard: [
    // scenes & situations
    "shooting star", "solar eclipse", "northern lights", "black hole", "meteor shower", "tidal wave", "avalanche", "quicksand", "tsunami", "earthquake",
    "time machine", "treasure map", "magic carpet", "genie lamp", "crystal ball", "dragon egg", "pirate ship", "ghost ship", "flying saucer", "alien abduction",
    "zombie apocalypse", "robot army", "haunted mirror", "wishing well", "secret door", "trap door", "escape room", "maze", "labyrinth", "tightrope",
    "loch ness monster", "sphinx", "trojan horse", "leaning tower", "statue of liberty", "eiffel tower", "great wall", "stonehenge", "totem pole", "space station",
    // actions (drawable as a figure doing a thing)
    "juggling", "sneezing", "snoring", "yawning", "hiccups", "sleepwalking", "skydiving", "surfing", "skiing", "ice skating",
    "fishing", "camping", "gardening", "knitting", "painting", "baking", "sunbathing", "stargazing", "tightrope walking", "bungee jumping",
    "hula hoop", "cartwheel", "moonwalk", "high five", "fist bump", "belly flop", "pillow fight", "snowball fight", "tug of war", "arm wrestling",
    "piggyback ride", "limbo", "karaoke", "headstand", "push ups", "jump rope", "hide and seek", "musical chairs", "rock paper scissors", "freeze tag",
    "taking a selfie", "walking the dog", "brushing teeth", "blowing bubbles", "catching a fish", "building a snowman", "chasing a bus", "slipping on a banana", "riding a unicorn", "walking on the moon",
    // funny but concrete combos
    "cat in a box", "dog in sunglasses", "frog in a tuxedo", "shark with a hat", "penguin on vacation", "snail race", "dancing banana", "flying pig", "sleepy sloth", "angry cloud",
    "haunted toaster", "sneaky pigeon", "dramatic hamster", "robot chef", "zombie cat", "vampire bat", "pizza delivery", "ice cream truck", "lemonade stand", "garage sale",
    "rubber duck army", "sock puppet", "paper crown", "melting clock", "broken umbrella", "leaky faucet", "flat tire", "burnt toast", "spilled milk",
    "brain freeze", "bad hair day", "traffic jam", "surprise party", "family photo", "photobomb",
    // single tricky nouns
    "periscope", "stethoscope", "catapult", "sundial", "gondola", "origami", "trebuchet", "kaleidoscope", "metronome", "pendulum",
    "scuba diver", "lumberjack", "ventriloquist", "mime", "magician", "archaeologist", "beekeeper", "lifeguard", "zookeeper", "referee",
    "hibernating bear", "migrating birds", "shedding snake", "hatching egg", "sprouting seed", "melting snowman", "exploding volcano", "sinking ship", "crash landing",
  ],
} as const;

export type WordDifficulty = keyof typeof WORDS_BY_DIFFICULTY;

export const WORD_LIST: string[] = Object.values(WORDS_BY_DIFFICULTY).flat();

const TIER_OF = new Map<string, WordDifficulty>();
for (const [tier, words] of Object.entries(WORDS_BY_DIFFICULTY) as [WordDifficulty, readonly string[]][]) {
  for (const w of words) if (!TIER_OF.has(w)) TIER_OF.set(w, tier);
}

/** The tier a prompt was filed under; unknown words fall back to a shape-based guess. */
export function wordDifficulty(word: string): WordDifficulty {
  const known = TIER_OF.get(word);
  if (known) return known;
  const words = promptWordCount(word);
  const letters = word.replace(/[^a-z]/gi, "").length;
  if (words >= 3 || letters >= 14) return "hard";
  if (words === 2 || letters >= 8) return "medium";
  return "easy";
}

/** How many words are in a prompt, e.g. "hula hoop" -> 2. */
export function promptWordCount(word: string): number {
  return word.trim().split(/\s+/).length;
}

function sample(source: readonly string[], count: number): string[] {
  const pool = [...source];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

/**
 * `difficulty`, when given, restricts choices to that tier (the host's chosen game
 * mode). `maxWords` caps how long a prompt's phrase can be (1/2/3 words); choices
 * naturally end up a mix of shorter and longer prompts up to that cap.
 *
 * `exclude` holds words this room has already seen (this game and recent games).
 * If excluding them leaves too few, recently-seen words are allowed back in before
 * the difficulty/length filters are relaxed — the host's settings matter more than
 * novelty. Difficulty wins over the length cap if the two can't both be satisfied.
 */
export function pickRandomWords(
  count: number,
  exclude: ReadonlySet<string> = new Set(),
  difficulty?: WordDifficulty,
  maxWords?: number,
): string[] {
  const tier: readonly string[] = difficulty ? WORDS_BY_DIFFICULTY[difficulty] : WORD_LIST;
  const lengthOk = maxWords ? tier.filter((w) => promptWordCount(w) <= maxWords) : tier;
  const candidates = lengthOk.length >= count ? lengthOk : tier;
  const fresh = candidates.filter((w) => !exclude.has(w));
  if (fresh.length >= count) return sample(fresh, count);
  // Top up with already-seen words so we still offer a full hand.
  return [...fresh, ...sample(candidates.filter((w) => exclude.has(w)), count - fresh.length)];
}
