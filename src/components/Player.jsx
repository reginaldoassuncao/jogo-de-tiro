import React from 'react';

function Player({ playerPos }) {
  const style = {
    left: `${playerPos.x}px`,
    top: `${playerPos.y}px`,
    position: 'absolute',
  };

  return (
    <div className="player" style={style}>
      {/* Visual da nave */}
    </div>
  );
}

export default Player; 