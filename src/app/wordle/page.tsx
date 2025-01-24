"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import LoadingScreen from "@/components/screens/LoadingScreen";
import ErrorScreen from "@/components/screens/ErrorScreen";

const Wordle = () => {
  const [word, setWord] = useState<string>("");
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [letterStatus, setLetterStatus] = useState<{
    [key: string]: "present" | "absent" | "correct" | undefined;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [invalidWord, setInvalidWord] = useState<boolean>(false);
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
          <div className="text-xl font-bold mb-4 text-center">
            {gameStatus === "won" ? "Congratulations!" : `The word was ${word}`}
          </div>
        )}

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

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        {gameStatus === "won" ? (
          <DrawerContent className="bg-black">
            <Confetti />
            <DrawerHeader>
              <DrawerTitle>🎉 Congratulations! 🎉</DrawerTitle>
              <DrawerDescription>
                {`You guessed the word in ${guesses.length} attempts. Great job!`}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <div className="flex gap-2">
                <Button className="w-fit" onClick={resetGame}>
                  Play again
                </Button>
                <DrawerClose>
                  <Button className="bg-red-800 text-white hover:bg-red-600">
                    Close
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        ) : (
          <DrawerContent className="bg-black">
            <DrawerHeader>
              <DrawerTitle>😢 Better Luck Next Time!</DrawerTitle>
              <DrawerDescription>
                {`The word was ${word}. Don't worry, you'll get it next time!`}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <div className="flex gap-2">
                <Button className="w-fit" onClick={resetGame}>
                  Try another wordle
                </Button>
                <DrawerClose>
                  <Button className="bg-red-800 text-white hover:bg-red-600">
                    Close
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>
    </main>
  );
};

export default Wordle;
