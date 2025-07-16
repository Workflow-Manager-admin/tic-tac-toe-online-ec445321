import React, { useState, useEffect } from "react";
import "./App.css";

/*
PUBLIC_INTERFACE
A Tic Tac Toe game app supporting human vs. human and human vs. AI modes.
- Responsive, modern, minimalistic, light theme.
- Uses color palette: accent #FFC107, primary #1976D2, secondary #2196F3.
- Status messages display above the board, controls below.
- Supports reset, indicates win/draw/lose.
*/
const COLORS = {
  primary: "#1976D2",
  secondary: "#2196F3",
  accent: "#FFC107",
  squareHover: "#F3F7FD",
  x: "#1976D2",
  o: "#FFC107",
};

const BOARD_SIZE = 3;

function emptyBoard() {
  // Returns an empty 3x3 board
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
}

function flatBoard(board) {
  // Flattens a 2D board for easy checking
  return board.flat();
}

// Utility: check if all elements in array are the same (and not null)
function allSame(arr) {
  return arr.every((val) => val && val === arr[0]);
}

// PUBLIC_INTERFACE
function calculateWinner(board) {
  // Returns 'X', 'O', or null.
  for (let i = 0; i < BOARD_SIZE; i++) {
    // Check rows
    if (allSame(board[i])) return board[i][0];
    // Check cols
    const col = [board[0][i], board[1][i], board[2][i]];
    if (allSame(col)) return board[0][i];
  }
  // Check diagonals
  const diag1 = [board[0][0], board[1][1], board[2][2]];
  if (allSame(diag1)) return board[0][0];
  const diag2 = [board[0][2], board[1][1], board[2][0]];
  if (allSame(diag2)) return board[0][2];
  return null;
}

// PUBLIC_INTERFACE
function isDraw(board) {
  // True if all cells filled and no winner
  return flatBoard(board).every(Boolean) && !calculateWinner(board);
}

// PUBLIC_INTERFACE
function getAvailableMoves(board) {
  const moves = [];
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (!board[r][c]) moves.push([r, c]);
  return moves;
}

// PUBLIC_INTERFACE
function aiMove(board, aiMark, humanMark) {
  // Simple-minimax (depth 2) for unbeatable AI
  // Returns [row, col]
  const winner = calculateWinner(board);
  if (winner || isDraw(board)) return null;

  // Score: +1 win for AI, -1 win for human, 0 draw
  function score(b, turn) {
    const whoWon = calculateWinner(b);
    if (whoWon === aiMark) return 1;
    if (whoWon === humanMark) return -1;
    if (isDraw(b)) return 0;
    // Only look ahead one level, then do simple play
    let bestScore = turn === aiMark ? -Infinity : Infinity;
    for (const [r, c] of getAvailableMoves(b)) {
      const b2 = b.map((row) => [...row]);
      b2[r][c] = turn;
      const s = score(b2, turn === aiMark ? humanMark : aiMark);
      bestScore = turn === aiMark
        ? Math.max(bestScore, s)
        : Math.min(bestScore, s);
    }
    return bestScore;
  }

  // Pick best move
  let bestScore = -Infinity;
  let bestMove = null;
  for (const [r, c] of getAvailableMoves(board)) {
    const boardCopy = board.map((row) => [...row]);
    boardCopy[r][c] = aiMark;
    const s = score(boardCopy, humanMark);
    if (s > bestScore) {
      bestScore = s;
      bestMove = [r, c];
    }
  }
  // If all moves are equivalent, just pick the first
  return bestMove || getAvailableMoves(board)[0];
}

const MODES = [
  { value: "human", label: "Two Players" },
  { value: "ai", label: "Vs AI" },
];

// PUBLIC_INTERFACE
function App() {
  // state vars
  const [board, setBoard] = useState(emptyBoard());
  const [current, setCurrent] = useState("X");
  const [mode, setMode] = useState("ai");
  const [status, setStatus] = useState("");
  const [gameOver, setGameOver] = useState(false);

  // For mobile responsiveness, track window width
  // (Not strictly needed, just helps for style hints)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // For theme, always light
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Set status message on any move/game end
  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner) {
      setStatus(
        mode === "ai"
          ? winner === "X"
            ? "You win! 🎉"
            : "AI wins! 🤖"
          : `Player ${winner} wins! 🎉`
      );
      setGameOver(true);
    } else if (isDraw(board)) {
      setStatus("Draw 😐");
      setGameOver(true);
    } else {
      if (mode === "ai") {
        if (current === "X") setStatus("Your turn");
        else setStatus("AI thinking...");
      } else {
        setStatus(`Player ${current}'s turn`);
      }
      setGameOver(false);
    }
  }, [board, current, mode]);

  // If vs AI and it's AI's turn, compute move after short delay
  useEffect(() => {
    if (mode === "ai" && current === "O" && !gameOver) {
      // "AI thinking" delay for realism
      const timer = setTimeout(() => {
        const [r, c] = aiMove(board, "O", "X") || [];
        if (r !== undefined) handleSquareClick(r, c);
      }, 450);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [board, current, mode, gameOver]);

  // PUBLIC_INTERFACE
  function handleSquareClick(row, col) {
    if (board[row][col] || gameOver) return;
    if (mode === "ai" && current === "O") return; // Disallow clicking during AI turn
    const updated = board.map((r, i) =>
      r.map((cell, j) => (i === row && j === col ? current : cell))
    );
    setBoard(updated);
    setCurrent((prev) => (prev === "X" ? "O" : "X"));
  }

  // PUBLIC_INTERFACE
  function handleModeChange(e) {
    setMode(e.target.value);
    resetGame(e.target.value);
  }

  // PUBLIC_INTERFACE
  function resetGame(newMode = mode) {
    setBoard(emptyBoard());
    setCurrent("X");
    setStatus("");
    setGameOver(false);
  }

  // UI helpers
  function renderSquare(row, col) {
    const val = board[row][col];
    let color = "inherit";
    if (val === "X") color = COLORS.x;
    else if (val === "O") color = COLORS.o;
    return (
      <button
        className="ttt-square"
        style={{ color, borderColor: COLORS.primary }}
        aria-label={val || `Empty square at row ${row + 1}, col ${col + 1}`}
        key={`${row}-${col}`}
        onClick={() => handleSquareClick(row, col)}
        disabled={!!val || gameOver || (mode === "ai" && current === "O")}
        tabIndex={val ? -1 : 0}
      >
        {val}
      </button>
    );
  }

  function renderBoard() {
    return (
      <div
        className="ttt-board"
        role="grid"
        aria-label="Tic Tac Toe Board"
        style={{
          borderColor: COLORS.primary,
          background: "#fff",
        }}
      >
        {board.map((row, r) => (
          <div className="ttt-row" role="row" key={r}>
            {row.map((_, c) => renderSquare(r, c))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="App" style={{ minHeight: "100vh" }}>
      <div className="ttt-container">
        {/* Status message */}
        <div className="ttt-status" aria-live="polite">
          {status}
        </div>

        {/* Board */}
        {renderBoard()}

        {/* Controls */}
        <div className="ttt-controls">
          <select
            className="ttt-mode-select"
            value={mode}
            onChange={handleModeChange}
            disabled={flatBoard(board).some(Boolean) && !gameOver}
            aria-label="Select game mode"
          >
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            className="ttt-reset"
            style={{
              background: COLORS.primary,
              color: "#fff",
              marginLeft: "16px",
            }}
            onClick={() => resetGame()}
            aria-label="Reset game"
          >
            Reset
          </button>
        </div>

        <footer className="ttt-footer">
          <span>
            <span style={{ color: COLORS.primary, fontWeight: 700 }}>
              Tic Tac Toe
            </span>{" "}
            &bull; Web React App
          </span>
        </footer>
      </div>
      {/* Inline minimal styling */}
      <style>{`
        .ttt-container {
          max-width: 340px;
          margin: 0 auto;
          padding: 24px 8px 12px 8px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
        }
        .ttt-status {
          font-size: 1.28rem;
          font-weight: 600;
          margin-bottom: 24px;
          min-height: 32px;
          color: ${COLORS.primary};
          letter-spacing: 1px;
          text-align: center;
        }
        .ttt-board {
          display: flex;
          flex-direction: column;
          border: 2.5px solid ${COLORS.primary};
          border-radius: 1rem;
          background: #fff;
          padding: 10px;
          gap: 0.5rem;
          box-shadow: 0 4px 16px 0 rgb(25 118 210 / 10%);
        }
        .ttt-row {
          display: flex;
          gap: 0.5rem;
        }
        .ttt-square {
          width: 66px;
          height: 66px;
          font-size: 2.2rem;
          font-family: inherit;
          background: transparent;
          border-radius: 8px;
          border: 2px solid ${COLORS.primary};
          outline: none;
          cursor: pointer;
          box-shadow: 0 2px 8px 0 rgba(33,150,243,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.2s;
          font-weight: 700;
        }
        .ttt-square[disabled] {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .ttt-square:not([disabled]):hover {
          background: ${COLORS.secondary}18;
          box-shadow: 0 2px 16px 0 rgba(33,150,243,0.12);
        }
        .ttt-controls {
          margin-top: 2.3rem;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .ttt-mode-select {
          padding: 7px 15px;
          border-radius: 7px;
          border: 1.5px solid ${COLORS.secondary};
          font-size: 1rem;
          background: #fff;
          color: ${COLORS.primary};
          font-weight: 500;
          box-shadow: 0 2px 6px 0 #1976d220;
          outline: none;
          transition: border 0.2s;
        }
        .ttt-mode-select:focus {
          border-color: ${COLORS.accent};
        }
        .ttt-reset {
          padding: 7px 20px;
          border-radius: 7px;
          font-size: 1rem;
          margin: 0 6px;
          font-weight: 500;
          outline: none;
          border: none;
          box-shadow: 0 1px 3px 0 rgb(25 118 210 / 8%);
          letter-spacing: 1px;
          transition: background 0.18s;
        }
        .ttt-reset:hover {
          background: ${COLORS.accent};
          color: ${COLORS.primary};
        }
        .ttt-footer {
          margin-top: 24px;
          font-size: 0.99rem;
          opacity: 0.88;
          letter-spacing: 0.03em;
          text-align: center;
        }
        @media (max-width: 540px) {
          .ttt-container {
            max-width: 100vw;
            padding: 12px 2vw 4vw 2vw;
          }
          .ttt-board {
            padding: 4.5vw;
          }
          .ttt-row {
            gap: 1.8vw;
          }
          .ttt-square {
            width: 18vw;
            height: 18vw;
            font-size: 2.7rem;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
