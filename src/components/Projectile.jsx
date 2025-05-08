import React from 'react';

function Projectile({ projectilePos }) {
  const style = {
    left: `${projectilePos.x}px`,
    top: `${projectilePos.y}px`,
    position: 'absolute',
  };

  return <div className="projectile" style={style} />;
}

export default Projectile; 