"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import LoadingScreen from "@/components/screens/LoadingScreen";
import ErrorScreen from "@/components/screens/ErrorScreen";

type Definition = {
  definition: string;
  example?: string;
};

type Phonetic = {
  text: string;
  audio?: string;
};

type Meaning = {
  partOfSpeech: string;
  definitions: Definition[];
};

type ApiResponse = {
  word: string;
  meanings: Meaning[];
  phonetics: Phonetic[];
};

type SimplifiedDefinition = {
  partOfSpeech: string;
  definition: string;
};

const Wordle = () => {
  const [word, setWord] = useState<string>("");
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [definitions, setDefinitions] = useState<SimplifiedDefinition[] | null>(
    null
  );
  const [transcription, setTranscription] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [letterStatus, setLetterStatus] = useState<{
    [key: string]: "present" | "absent" | "correct" | undefined;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defError, setDefError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [invalidWord, setInvalidWord] = useState<boolean>(false);
  const [showDef, setShowDef] = useState<boolean>(false);
  const maxAttempts = 6;

  const fetchNewWord = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/word");
      if (!response.ok) throw new Error("Failed to fetch word");
      const data = await response.json();
      setWord(data.word.toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const checkWord = async (word: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://api.datamuse.com/words?sp=${word}&max=1`
      );
      const result = await response.json();

      // If the API returns an exact match for the word, it is valid
      return (
        result.length > 0 && result[0].word.toLowerCase() === word.toLowerCase()
      );
    } catch (error) {
      console.error("Error checking word:", error);
      return false;
    }
  };

  const submitGuess = useCallback(async () => {
    const isValidWord = await checkWord(currentGuess);
    // if(checkWord(currentGuess))
    if (currentGuess.length === 5) {
      if (isValidWord) {
        setGuesses((prev) => {
          const newGuesses = [...prev, currentGuess];

          // Update letter statuses
          const newStatus = { ...letterStatus };
          currentGuess.split("").forEach((letter, index) => {
            if (word[index] === letter) {
              newStatus[letter] = "correct";
            } else if (
              word.includes(letter) &&
              newStatus[letter] !== "correct"
            ) {
              newStatus[letter] = "present";
            } else if (!word.includes(letter)) {
              newStatus[letter] = "absent";
            }
          });

          setLetterStatus(newStatus);

          // Check game status
          if (currentGuess === word) {
            setGameStatus("won");
            setIsOpen(true);
          } else if (newGuesses.length === maxAttempts) {
            setGameStatus("lost");
            setIsOpen(true);
          }

          return newGuesses;
        });
        setCurrentGuess("");
        window.scrollTo(0, 0);
      } else {
        setInvalidWord(true);
      }
    }
  }, [currentGuess, word, letterStatus]);

  const getLetterStatus = useCallback(
    (letter: string, position: number, guess: string) => {
      if (guess[position] === word[position]) {
        return "bg-green-500";
      }
      if (word.includes(letter)) {
        return "bg-yellow-500";
      }
      return "bg-gray-500";
    },
    [word]
  );

  const handleVirtualKeyPress = (key: string) => {
    if (gameStatus !== "playing") return;

    if (key === "Enter" && currentGuess.length === 5) {
      submitGuess();
    } else if (key === "Backspace") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Za-z]$/.test(key)) {
      setCurrentGuess((prev) => (prev + key).toUpperCase());
    }
  };

  const renderKeyboard = () => {
    const rows = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["Z", "X", "C", "V", "B", "N", "M", "Backspace", "Enter"],
    ];

    return (
      <div className="flex flex-col gap-1">
        {rows.map((row, i) => (
          <div
            key={`keyboard-row-${i}`}
            className="flex justify-center gap-[0.5rem] md:gap-2"
          >
            {row.map((key) => {
              const status = letterStatus[key];
              const bgColor =
                status === "correct"
                  ? "bg-green-500"
                  : status === "present"
                  ? "bg-yellow-500"
                  : status === "absent"
                  ? "bg-gray-500"
                  : "bg-gray-700";

              return (
                <button
                  key={key}
                  className={`px-2 py-2 rounded font-bold text-white ${bgColor} hover:opacity-90`}
                  onClick={() => handleVirtualKeyPress(key)}
                >
                  {key === "Backspace" ? "⌫" : key === "Enter" ? "⏎" : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchNewWord();
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameStatus !== "playing") return;

      if (event.key === "Enter" && currentGuess.length === 5) {
        submitGuess();
      } else if (event.key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (currentGuess.length < 5 && /^[A-Za-z]$/.test(event.key)) {
        setCurrentGuess((prev) => (prev + event.key).toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentGuess, gameStatus, submitGuess]);

  const renderGrid = () => {
    const rows = [];

    // Previous guesses
    for (let i = 0; i < guesses.length; i++) {
      rows.push(
        <div key={`guess-${i}`} className="flex gap-2">
          {guesses[i].split("").map((letter, j) => (
            <div
              key={`guess-${i}-${j}`}
              className={`w-12 h-12 flex items-center justify-center font-bold text-white 
              ${getLetterStatus(letter, j, guesses[i])}`}
            >
              {letter}
            </div>
          ))}
        </div>
      );
    }

    // Current guess row (only show if game is still playing)
    if (gameStatus === "playing") {
      rows.push(
        <div key="current" className="flex gap-2">
          {Array(5)
            .fill("")
            .map((_, i) => (
              <div
                key={`current-${i}`}
                className="w-12 h-12 flex items-center justify-center font-bold border-2 border-gray-300"
              >
                {currentGuess[i] || ""}
              </div>
            ))}
        </div>
      );
    }

    // Empty rows
    const remainingRows =
      maxAttempts - guesses.length - (gameStatus === "playing" ? 1 : 0);
    for (let i = 0; i < remainingRows; i++) {
      rows.push(
        <div key={`empty-${i}`} className="flex gap-2">
          {Array(5)
            .fill("")
            .map((_, j) => (
              <div
                key={`empty-${i}-${j}`}
                className="w-12 h-12 flex items-center justify-center border-2 border-gray-300"
              />
            ))}
        </div>
      );
    }

    return rows;
  };

  const getDefinition = useCallback(async (): Promise<
    SimplifiedDefinition[] | null
  > => {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse[] = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];

        // Handle phonetics
        const phonetic = entry.phonetics.find((p) => p.text && p.audio);
        setTranscription(phonetic?.text || null);
        setAudioUrl(phonetic?.audio || null);

        // Handle definitions
        const meanings = entry.meanings || [];
        const definitions: SimplifiedDefinition[] = meanings.flatMap(
          (meaning) =>
            meaning.definitions.map((def) => ({
              partOfSpeech: meaning.partOfSpeech,
              definition: def.definition,
            }))
        );

        return definitions;
      } else {
        throw new Error("No definitions found.");
      }
    } catch (error) {
      console.error("Failed to fetch definition:", (error as Error).message);
      throw error;
    }
  }, [word]);

  useEffect(() => {
    (async () => {
      try {
        const defs = await getDefinition();
        setDefinitions(defs);
        setDefError(null);
      } catch (err) {
        setDefError((err as Error).message);
        setDefinitions(null);
      }
    })();
  }, [getDefinition]);

  const resetGame = async () => {
    setLoading(true);
    fetchNewWord();
    setCurrentGuess("");
    setGameStatus("playing");
    setGuesses([]);
    setLetterStatus({});
    setIsOpen(false);
  };

  if (loading) return <LoadingScreen />;
  if (error)
    return (
      <ErrorScreen
        message={
          "It seems like we couldn’t generate the word. This might be a connection issue or a glitch on our end. 🕵️‍♂️"
        }
        ctaBtn={
          <Button
            className="bg-teal-800 text-white hover:bg-teal-600 my-4 mx-auto"
            onClick={resetGame}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>{" "}
            Try Again
          </Button>
        }
      />
    );

  return (
    <main className="flex justify-center items-center">
      <div className="my-16 flex flex-col items-center">
        <h1 className="text-4xl font-satisfy text-center mb-4">Wordle</h1>

        {gameStatus !== "playing" && (
          <div className="mb-4 flex flex-col gap-1">
            <p className="text-xl font-bold text-center">
              {gameStatus === "won"
                ? "Congratulations!"
                : `Try better next time!`}
            </p>
            <p className="text-xs text-center">
              The hidden word was{" "}
              <span
                className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                onClick={() => setShowDef(true)}
              >
                {word}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                  />
                </svg>
              </span>
            </p>
          </div>
        )}

        <Dialog open={showDef} onOpenChange={setShowDef}>
          <DialogContent className="bg-black">
            <DialogHeader>
              <DialogTitle>
                {word}
                {transcription && (
                  <p className="text-sm font-normal mt-1">
                    <span>Transcription:</span> {transcription}
                  </p>
                )}
                {audioUrl && (
                  <Button
                    className="text-sm px-0 py-1 text-white"
                    variant={"link"}
                    onClick={() => new Audio(audioUrl).play()}
                  >
                    🔊 Play Pronunciation
                  </Button>
                )}
              </DialogTitle>
              <DialogDescription>
                {definitions ? (
                  <ul>
                    {definitions.map((def, index) => (
                      <li key={index}>
                        <strong>{def.partOfSpeech}</strong>: {def.definition}
                      </li>
                    ))}
                  </ul>
                ) : defError ? (
                  <span>
                    Sorry pal, we couldn&lsquo;t find definitions for the word
                    you were looking for. You can try the search again at later
                    time or head to the web instead.
                  </span>
                ) : (
                  <span>Loading...</span>
                )}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* <div>
          <h1>{word}</h1>
          {defError && <p>Error: {defError}</p>}
          {transcription && (
            <p>
              <strong>Transcription:</strong> {transcription}
            </p>
          )}
          {audioUrl && (
            <button onClick={() => new Audio(audioUrl).play()}>
              🔊 Play Pronunciation
            </button>
          )}
          {definitions ? (
            <ul>
              {definitions.map((def, index) => (
                <li key={index}>
                  <strong>{def.partOfSpeech}</strong>: {def.definition}
                </li>
              ))}
            </ul>
          ) : (
            !defError && <p>Loading...</p>
          )}
        </div> */}

        <div className="grid grid-rows-6 gap-2">{renderGrid()}</div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Type a 5-letter word and press Enter to submit</p>
          <p>🟩 Correct letter, correct position</p>
          <p>🟨 Correct letter, wrong position</p>
          <p>⬜️ Letter not in word</p>
        </div>
        <div className="flex gap-4">
          <Button
            className="bg-teal-800 text-white hover:bg-teal-600 my-4 mx-auto"
            onClick={resetGame}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>{" "}
            Reset word
          </Button>
          <Button
            className="bg-red-800 text-white hover:bg-red-600 my-4 mx-auto"
            onClick={() => {
              setGameStatus("lost");
              setIsOpen(true);
            }}
          >
            Give up
          </Button>
        </div>
        <div>{renderKeyboard()}</div>
      </div>

      <Dialog open={invalidWord} onOpenChange={setInvalidWord}>
        <DialogContent className="sm:max-w-[425px] bg-black">
          <DialogHeader>
            <DialogTitle>Invalid Word</DialogTitle>
            <DialogDescription>
              Oops! The word you entered isn’t valid. Make sure it’s a real word
              before submitting your guess.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {gameStatus === "won" ? (
          <DialogContent className="sm:max-w-[425px] bg-black">
            <Confetti />
            <DialogHeader>
              <DialogTitle>🎉 Congratulations! 🎉</DialogTitle>
              <DialogDescription>
                {`You guessed the word in ${guesses.length} attempts. Great job!`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div className="flex gap-2">
                <Button className="w-fit" onClick={resetGame}>
                  Play again
                </Button>
                <DialogClose>
                  <Button className="bg-red-800 text-white hover:bg-red-600">
                    Close
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        ) : (
          <DialogContent className="bg-black">
            <DialogHeader>
              <DialogTitle>😢 Better Luck Next Time!</DialogTitle>
              <DialogDescription>
                {`The word was ${word}. Don't worry, you'll get it next time!`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div className="flex gap-2">
                <Button className="w-fit" onClick={resetGame}>
                  Try another wordle
                </Button>
                <DialogClose>
                  <Button className="bg-red-800 text-white hover:bg-red-600">
                    Close
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
};

export default Wordle;
