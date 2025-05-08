import React from 'react';

function EnemyProjectile({ projectilePos }) {
  const style = {
    left: `${projectilePos.x}px`,
    top: `${projectilePos.y}px`,
    position: 'absolute',
    // Estilos definidos em Game.css via className
  };

  return <div className="enemy-projectile" style={style} />;
}

export default EnemyProjectile; 