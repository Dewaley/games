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
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import LoadingScreen from "@/components/screens/LoadingScreen";

const Wordle = () => {
  const [word, setWord] = useState<string>("");
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
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

  const submitGuess = useCallback(() => {
    if (currentGuess.length === 5) {
      setGuesses((prev) => {
        const newGuesses = [...prev, currentGuess];
        // Check game status synchronously
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
    }
  }, [currentGuess, word]);

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
  };

  if (loading) return <LoadingScreen />;
  if (error) return <div>Error: {error}</div>;

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
      </div>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        {gameStatus === "won" ? (
          <DrawerContent>
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
          <DrawerContent>
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
