import React from "react";
import "./App.css";

import { useState, useEffect } from "react";

// SETTINGS
const ROWS_COUNT = 6;
const COLS_COUNT = 6;
const TILES_COUNT =  ROWS_COUNT * COLS_COUNT;
const EMPTY_INDEX = TILES_COUNT - 1;
const MOVE_DIRECTIONS = ["^", "v", "<", ">"];

const TILE_SIZE = 100;
const TILE_SPACING = 5;
// SETTINGS

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}

function randomize(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

class GameState {
  static getNewBoard() {
    return Array(TILES_COUNT)
      .fill(0)
      .map((x, index) => [Math.floor(index /  ROWS_COUNT), index %  ROWS_COUNT]);
  }

  static winnerBoard = GameState.getNewBoard();
  static instance = null;

  static getInstance() {
    if (!GameState.instance) GameState.instance = new GameState();
    return GameState.instance;
  }

  constructor() {
    this.startNewGame();
  }

  isWinner() {
    for (let i = 0; i < TILES_COUNT; i++) {
      if (
        this.board[i][0] !== GameState.winnerBoard[i][0] ||
        this.board[i][1] !== GameState.winnerBoard[i][1]
      )
        return false;
    }
    return true;
  }

  startNewGame() {
    this.board = GameState.getNewBoard();
    this.stack = [];
    this.generateBoard();
  }

  generateBoard() {
    this.shuffling = true;
    let shuffleMoves = randomize(...[0, 1000]);
    while (shuffleMoves-- > 0) {
      this.moveInDirection(MOVE_DIRECTIONS[randomize(0, 3)]);
    }
    this.shuffling = false;
  }

  canMoveTile(index) {
    if (index < 0 || index >= TILES_COUNT) return false;

    const tilePos = this.board[index];
    const emptyPos = this.board[EMPTY_INDEX];
    if (tilePos[0] === emptyPos[0])
      return Math.abs(tilePos[1] - emptyPos[1]) === 1;
    else if (tilePos[1] === emptyPos[1])
      return Math.abs(tilePos[0] - emptyPos[0]) === 1;
    else return false;
  }

  moveTile(index) {
    if (!this.shuffling && this.isWinner()) return false;
    if (!this.canMoveTile(index)) return false;

    const emptyPos = [...this.board[EMPTY_INDEX]];
    const tilePosition = [...this.board[index]];

    let boardAfterMove = [...this.board];
    boardAfterMove[EMPTY_INDEX] = tilePosition;
    boardAfterMove[index] = emptyPos;

    if (!this.shuffling) this.stack.push(this.board);
        this.board = boardAfterMove;

    return true;
  }

  moveInDirection(direction) {
    const emptyPos = this.board[EMPTY_INDEX];
    const posToMove =
      direction === "^"
        ? [emptyPos[0] + 1, emptyPos[1]]
        : direction === "v"
        ? [emptyPos[0] - 1, emptyPos[1]]
        : direction === "<"
        ? [emptyPos[0], emptyPos[1] + 1]
        : direction === ">"
        ? [emptyPos[0], emptyPos[1] - 1]
        : emptyPos;
    let tileToMove = EMPTY_INDEX;
    for (let i = 0; i < TILES_COUNT; i++) {
      if (
        this.board[i][0] === posToMove[0] &&
        this.board[i][1] === posToMove[1]
      ) {
        tileToMove = i;
        break;
      }
    }
    this.moveTile(tileToMove);
  }

  getState() {
    const self = this;
    return {
      board: self.board,
      winner: self.isWinner()
    };
  }
}

function useGameState() {
  const gameState = GameState.getInstance();
  const [state, setState] = React.useState(gameState.getState());

  function newGame() {
    gameState.startNewGame();
    setState(gameState.getState());
  }

  function move(index) {
    return function() {
      gameState.moveTile(index);
      setState(gameState.getState());
    };
  }

  return [state.board, state.winner, newGame, move];
}

function Tile({ index, pos, onClick }) {
  const { height, width } = useWindowDimensions();
  const max_width = clamp(width /  ROWS_COUNT, 50, 100);
  const max_height = clamp(height / COLS_COUNT, 50, 100);
  const tile_size = Math.min(max_height, max_width) - TILE_SPACING;

  const top = pos[0] * TILE_SIZE + TILE_SPACING;
  const left = pos[1] * TILE_SIZE + TILE_SPACING;
  const tileNumber = index + 1;

  const tileStyle = {
    top,
    left,
    width: `${tile_size}px`,
    height: `${tile_size}px`,
    lineHeight: `${tile_size}px`,
    fontSize: `${(tile_size/2)}px`
  };

  return (
    <div className="tile" onClick={onClick} style={tileStyle}>
      <div>{tileNumber}</div>
    </div>
  );
}

function App() {
  const [board, winner, newGame, move] = useGameState();

  const width = TILE_SIZE *  ROWS_COUNT - 1 + TILE_SPACING;
  const height = TILE_SIZE * COLS_COUNT - 1 + TILE_SPACING;

  return (
    <div
      className="game-container"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div>
        <button className="reset-button" onClick={newGame}>
          {" "}
          RESET{" "}
        </button>
      </div>
      <div className="board">
        {board.slice(0, -1).map((pos, index) => (
          <Tile index={index} pos={pos} onClick={move(index)} />
        ))}
        {winner && (
          <div className="winner-overlay">
            <button className="reset-button" onClick={newGame}>
              You have won :)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
