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
    // more animals
    "goat", "donkey", "puppy", "kitten", "hamster", "goldfish", "otter", "polar bear", "seagull", "crow",
    "pigeon", "lamb", "chick", "rooster", "turkey", "ostrich", "bull", "pony", "fly", "beetle",
    "moth", "tadpole", "clam", "oyster", "mole",
    // more food
    "tomato", "potato", "onion", "garlic", "chili", "cucumber", "eggplant", "peach", "plum", "kiwi",
    "mango", "blueberry", "lime", "olive", "peanut", "honey", "jam", "butter", "soup", "salad",
    "rice", "steak", "sausage", "bacon", "pie", "muffin", "brownie", "jelly", "pudding", "cereal",
    "juice", "coffee", "lemonade", "marshmallow", "toast", "chicken leg", "apple pie", "banana split", "ice cube", "cup of tea",
    "pizza box", "candy bar",
    // around the house
    "pillow", "blanket", "towel", "soap", "sponge", "box", "basket", "jar", "bowl", "pot",
    "pan", "kettle", "oven", "stove", "remote", "keyboard", "laptop", "watch", "wallet", "purse",
    "belt", "tie", "dress", "skirt", "pants", "jacket", "coat", "boot", "sandal", "glove",
    "mask", "helmet", "wig", "crayon", "marker", "eraser", "ruler", "notebook", "envelope", "stamp",
    "paper clip", "tape", "glue", "easel", "globe", "desk", "shelf", "stairs", "fence", "gate",
    "roof", "chimney", "brick", "rope", "chain", "nail", "screw", "wrench", "drill", "wheel",
    "tire", "van", "ship", "raft", "wagon", "cart", "dice", "puzzle", "marble", "whistle",
    "flute", "doorbell", "doorknob", "toothpaste", "lipstick", "teacup", "spaceship", "flower pot", "rain boots", "beach ball",
    "soccer ball", "basketball", "tennis ball", "baseball bat", "race car", "toy car", "magic wand", "witch hat", "water gun", "train track",
    "bus stop", "fish hook", "christmas tree", "music note", "baby bottle",
    // outdoors
    "grass", "bush", "rock", "hill", "lake", "pond", "planet", "earth", "comet", "icicle",
    "branch", "log", "pine cone", "daisy", "rain cloud", "sunrise", "forest", "pebble", "sandbox",
    // body & people
    "mouth", "lips", "tongue", "hair", "beard", "mustache", "finger", "thumb", "arm", "leg",
    "knee", "toe", "brain", "skeleton", "footprint", "baby", "princess", "prince", "angel", "devil",
    "monster", "giant", "elf", "school", "hospital", "farm", "zoo", "park", "road", "hut",
    "garage", "question mark", "peace sign", "dollar sign", "check mark", "thumbs up",
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
    // more creatures
    "hummingbird", "woodpecker", "platypus", "anteater", "lemur", "meerkat", "badger", "bison", "yak", "hyena",
    "orangutan", "iguana", "salamander", "piranha", "eel", "manatee", "orca", "swordfish", "hammerhead shark", "clownfish",
    "sea urchin", "sea turtle", "hermit crab", "slug", "centipede", "grasshopper", "firefly", "wasp", "praying mantis", "cockroach",
    "dalmatian", "poodle", "guinea pig", "puffin", "dodo", "phoenix", "griffin", "centaur", "pegasus", "cyclops",
    "kraken", "goblin", "troll", "ogre", "gnome", "leprechaun", "tooth fairy", "easter bunny", "santa claus", "grim reaper",
    "frankenstein", "cupid", "t-rex", "stegosaurus", "pterodactyl", "woolly mammoth", "sabertooth tiger", "mosquito bite", "sea monster",
    // people & jobs
    "pilot", "nurse", "dentist", "farmer", "baker", "plumber", "scientist", "detective", "spy", "judge",
    "sailor", "cheerleader", "ballerina", "goalie", "waiter", "barber", "photographer", "construction worker", "caveman", "viking",
    "samurai", "gladiator", "pharaoh", "rock star", "bride", "jester", "sumo wrestler", "bodybuilder", "shepherd", "blacksmith",
    "acrobat", "puppeteer", "juggler", "tourist", "hitchhiker", "babysitter", "mail truck", "paramedic", "janitor",
    // more food
    "pickle", "cabbage", "celery", "radish", "asparagus", "chili pepper", "pomegranate", "dragon fruit", "kebab", "samosa",
    "lasagna", "ravioli", "omelette", "churro", "cheesecake", "macaron", "gummy bear", "caramel apple", "spring roll", "fried chicken",
    "chicken nugget", "fish sticks", "hot chocolate", "bubble gum", "ketchup", "mustard", "sugar cube", "wedding cake", "food truck", "vending machine",
    "gumball machine", "cash register", "shopping cart", "price tag", "cupcake tower", "popcorn bucket", "tea bag", "ice pop", "pizza oven", "sushi roll",
    // things
    "suitcase", "briefcase", "padlock", "keyhole", "hanger", "clothespin", "ironing board", "washing machine", "vacuum cleaner", "can opener",
    "corkscrew", "whisk", "ladle", "spatula", "grater", "cutting board", "chopsticks", "oven mitt", "apron", "chef hat",
    "screwdriver", "pliers", "chainsaw", "toolbox", "tape measure", "paint roller", "pickaxe", "rake", "pitchfork", "watering can",
    "garden hose", "lawn mower", "sprinkler", "birdhouse", "bird feeder", "greenhouse", "printer", "smartwatch", "plug", "satellite",
    "satellite dish", "antenna", "drone", "vr headset", "selfie stick", "floppy disk", "cassette tape", "vinyl record", "record player", "walkie talkie",
    "rotary phone", "jukebox", "arcade machine", "pinball machine", "slot machine", "robot vacuum", "light switch", "ceiling fan", "air conditioner", "fire extinguisher",
    "first aid kit", "band aid", "thermometer", "crutches", "wheelchair", "hair dryer", "perfume", "nail polish", "bubble bath", "laundry basket",
    "clothesline", "sewing machine", "needle", "ball of yarn", "button", "zipper", "safety pin", "curtain", "bookshelf", "wardrobe",
    "cuckoo clock", "grandfather clock", "picture frame", "vase", "lantern", "pencil sharpener", "stapler", "sticky note", "thumbtack", "clipboard",
    "filing cabinet", "abacus", "test tube", "beaker", "report card", "diploma", "graduation cap", "locker", "chalkboard", "spray paint",
    "paint palette", "tripod", "quill", "scroll", "cauldron", "potion", "dreamcatcher", "wind chime", "rocking horse", "music box",
    // getting around
    "limousine", "pickup truck", "monster truck", "tow truck", "garbage truck", "cement mixer", "bulldozer", "excavator", "forklift", "steamroller",
    "tank", "jet ski", "speedboat", "rowboat", "kayak", "cruise ship", "steam train", "bullet train", "cable car", "ski lift",
    "unicycle", "tricycle", "tandem bike", "go kart", "golf cart", "chariot", "blimp", "jetpack", "rickshaw", "double decker bus",
    // places
    "kitchen", "library", "gas station", "car wash", "airport", "pier", "aquarium", "stadium", "jail", "factory",
    "dam", "tunnel", "crosswalk", "movie theater", "bowling alley", "ice rink", "skate park", "water park", "graveyard", "drawbridge",
    "moat", "pagoda", "colosseum", "tree stump", "campsite", "train station", "rooftop", "attic",
    // sports & play
    "football", "tennis racket", "ping pong", "hockey stick", "golf club", "baseball glove", "boxing gloves", "bowling ball", "target", "trophy",
    "medal", "podium", "finish line", "hurdle", "dumbbell", "treadmill", "yoga mat", "punching bag", "scoreboard", "frisbee",
    "boomerang", "pogo stick", "slingshot", "water balloon", "life jacket", "snorkel", "flippers", "pinata", "confetti",
    // clothes & music
    "tuxedo", "wedding dress", "tiara", "cape", "overalls", "hoodie", "sweater", "poncho", "sombrero", "beanie",
    "beret", "cowboy hat", "hard hat", "earmuffs", "bandana", "eye patch", "monocle", "suspenders", "tutu", "swimsuit",
    "slippers", "electric guitar", "banjo", "ukulele", "cello", "tuba", "harmonica", "bagpipes", "maracas", "tambourine",
    "gong", "drum kit", "conductor", "music stand", "boxing ring", "crowbar", "sledgehammer", "spinning top",
    // nature & seasons
    "blizzard", "flood", "crescent moon", "saturn", "asteroid", "cliff", "bamboo", "maple leaf", "pearl", "seaweed",
    "lily pad", "dandelion", "tumbleweed", "sand dune", "geyser", "hot spring", "crystal", "gold bar", "fossil", "anthill",
    "cocoon", "snow angel", "jack o lantern", "easter egg", "gingerbread house", "stocking", "wreath", "solar panel", "wind turbine",
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
    // tricky nouns
    "weathervane", "anvil", "gargoyle", "aqueduct", "gramophone", "inkwell", "wax seal", "hieroglyphics", "sarcophagus", "battering ram",
    "suit of armor", "crossbow", "cannon", "spellbook", "marionette", "chimney sweep", "trapeze artist", "human cannonball", "lion tamer", "fire breather",
    "sword swallower", "mad scientist", "lab coat", "robot arm", "dinosaur skeleton", "mars rover", "moon base", "space shuttle", "solar system", "rocket launch",
    "atom", "dna", "lightning rod", "food chain", "water cycle", "evolution", "recycling", "oil rig", "hologram", "x-ray",
    "shadow", "reflection", "mirage", "eclipse", "orbit", "constellation", "galaxy", "stalactite",
    // landmarks
    "taj mahal", "big ben", "mount rushmore", "mount everest", "niagara falls", "grand canyon", "easter island", "sydney opera house", "golden gate bridge",
    // scenes
    "birthday party", "road trip", "bank robbery", "alien invasion", "space walk", "moon landing", "desert island", "shipwreck", "treasure hunt", "sleepover",
    "pillow fort", "food fight", "rush hour", "fire drill", "fashion show", "talent show", "magic show", "puppet show", "rock concert", "marching band",
    "air guitar", "flash mob", "conga line", "red carpet", "standing ovation", "game show", "weather forecast", "paparazzi", "autograph", "video call",
    "low battery", "computer virus", "power outage", "dead end", "u-turn", "speed bump", "speeding ticket", "empty fridge", "messy room", "broken heart",
    "love letter", "brainstorm", "sunburn", "goosebumps", "haunted castle", "underwater city", "floating island", "upside down house", "two headed dragon", "ghost town",
    // actions
    "laughing", "crying", "whispering", "tiptoeing", "sweating", "shivering", "daydreaming", "eavesdropping", "meditating", "stretching",
    "sprinting", "jogging", "climbing", "rowing", "swimming", "diving", "paragliding", "rock climbing", "horse riding", "bowling",
    "boxing", "fencing", "weightlifting", "archery", "yoga", "breakdancing", "ballet", "whistling", "singing", "ironing",
    "vacuuming", "sweeping", "washing dishes", "doing laundry", "mowing the lawn", "raking leaves", "planting a tree", "watering plants", "feeding the ducks", "milking a cow",
    "flying a kite", "riding a horse", "riding a camel", "climbing a tree", "skipping stones", "making a wish", "blowing out candles", "opening a present", "wrapping a gift", "popping a balloon",
    "carving a pumpkin", "reading a book", "writing a letter", "taking a nap", "taking a bath", "getting a haircut", "losing a tooth", "stubbing a toe", "missing the bus", "waiting in line",
    "hailing a taxi", "changing a tire", "parallel parking", "painting a fence", "digging a hole", "burying treasure", "walking the plank", "sword fighting", "casting a spell", "counting sheep",
    "wheelie", "kickflip", "slam dunk", "hole in one", "home run", "penalty kick", "touchdown", "photo finish", "relay race", "sack race",
    "three legged race", "duck duck goose", "leapfrog", "hopscotch", "cat nap", "bear hug", "chicken dance", "crocodile tears", "sneezing elephant", "sleeping giant",
    // funny combos
    "cat burglar", "couch potato", "hot potato", "night owl", "early bird", "bookworm", "copycat", "dog walker", "dancing robot", "robot dog",
    "alien tourist", "pirate parrot", "space cowboy", "tiny elephant", "snail mail", "octopus chef", "shark attack", "cow jumping", "skateboarding dog", "surfing cat",
    "nervous ghost", "lazy dragon", "flying carpet", "singing fish", "invisible man", "headless horseman", "sleepy owl", "vampire dentist", "superhero cape", "villain laugh",
    "evil twin", "secret agent", "getaway car", "crime scene", "footprints in snow", "rain dance",
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
 * `seen` lists words this room has already shown, oldest first. Unseen words are
 * always preferred; if there aren't enough, the *longest-ago* seen words come back
 * before anything recent — the host's settings matter more than novelty. Difficulty
 * wins over the length cap if the two can't both be satisfied.
 */
export function pickRandomWords(
  count: number,
  seen: readonly string[] = [],
  difficulty?: WordDifficulty,
  maxWords?: number,
): string[] {
  const tier: readonly string[] = difficulty ? WORDS_BY_DIFFICULTY[difficulty] : WORD_LIST;
  const lengthOk = maxWords ? tier.filter((w) => promptWordCount(w) <= maxWords) : tier;
  const candidates = lengthOk.length >= count ? lengthOk : tier;
  const age = new Map<string, number>();
  seen.forEach((w, i) => age.set(w, i));
  const fresh = candidates.filter((w) => !age.has(w));
  if (fresh.length >= count) return sample(fresh, count);
  // Top up from the oldest-seen half so the hand never repeats something from a few turns ago.
  const stale = candidates.filter((w) => age.has(w)).sort((a, b) => age.get(a)! - age.get(b)!);
  const need = count - fresh.length;
  return [...fresh, ...sample(stale.slice(0, Math.max(need, Math.ceil(stale.length / 2))), need)];
}

/** Keeps only real prompts from an untrusted list (e.g. a client's seen-words history). */
export function knownWords(words: unknown, max: number): string[] {
  if (!Array.isArray(words)) return [];
  return words.filter((w): w is string => typeof w === "string" && TIER_OF.has(w)).slice(-max);
}
