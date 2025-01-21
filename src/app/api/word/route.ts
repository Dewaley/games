const BASE_URL = "https://api.datamuse.com/words";

interface DataMuseWord {
  word: string;
  score: number;
  tags: string[];
}

// Get random element from array
const getRandomElement = (array: string[] | DataMuseWord[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Get random word starting with random letter
const getRandomWord = async () => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const randomLetter = getRandomElement(alphabet.split(""));

  try {
    const response = await fetch(
      `${BASE_URL}?sp=${randomLetter}????&md=p&max=100`
    );
    const words = await response.json();

    const validWords = words
      .filter(
        (word: DataMuseWord) =>
          word.tags &&
          !word.tags.includes("n") &&
          !word.tags.includes("prop") &&
          !word.tags.includes("pl")
      )
      .map((word: DataMuseWord) => word.word.toLowerCase())
      .filter((word: string) => word.length === 5);

    if (validWords.length > 0) {
      return getRandomElement(validWords);
    }
    return getRandomWord();
  } catch (error) {
    console.error("Error fetching word:", error);
    throw error;
  }
};

// API Route handler
export async function GET() {
  try {
    const word = await getRandomWord();
    return Response.json({ word });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Failed to fetch word" }, { status: 500 });
  }
}
