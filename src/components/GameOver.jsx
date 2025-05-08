import React from 'react';

function GameOver({ score, onRestart }) {
  return (
    <div className="game-over">
      <h2>Game Over</h2>
      <p>Final Score: {score}</p>
      <button onClick={onRestart}>Restart Game</button>
    </div>
  );
}

export default GameOver; 