import React from 'react';

function Enemy({ enemyPos }) {
  const style = {
    left: `${enemyPos.x}px`,
    top: `${enemyPos.y}px`,
    width: '40px',
    height: '40px',
    backgroundColor: enemyPos.isExploding ? 'orange' : 'red',
    position: 'absolute',
  };

  return (
    <div className="enemy" style={style}>
      {/* Visual do inimigo */}
    </div>
  );
}

export default Enemy; 