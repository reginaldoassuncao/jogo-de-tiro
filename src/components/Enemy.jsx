import React from 'react';

// Mapeamento do tipo do inimigo para o nome do arquivo de imagem
// (Assumindo que os arquivos estão em /public/assets/images/ e foram renomeados para .png)
const ENEMY_SPRITES = {
  normal: '/assets/images/enemyRed.png',
  fast: '/assets/images/enemyYellow.png',
  tank: '/assets/images/tank.png',
  default: '/assets/images/enemyRed.png' // Fallback para um inimigo padrão
};

// URL do sprite de explosão
const EXPLOSION_SPRITE_URL = '/assets/images/explosion.png';

function Enemy({ enemyData }) { 
  const spriteUrl = ENEMY_SPRITES[enemyData.type] || ENEMY_SPRITES.default;

  const style = {
    left: `${enemyData.x}px`,
    top: `${enemyData.y}px`,
    width: '60px',
    height: '60px',
    position: 'absolute',
    backgroundImage: enemyData.isExploding ? `url(${EXPLOSION_SPRITE_URL})` : `url(${spriteUrl})`,
    backgroundColor: 'transparent', // Sempre transparente
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    // Remover a borda que adicionamos para o amarelo, pois o sprite deve resolver
    // border: enemyData.type === 'fast' && !enemyData.isExploding ? '1px solid black' : 'none',
  };

  return (
    <div className="enemy" style={style}>
      {/* Visual agora vem do background */} 
    </div>
  );
}

export default Enemy; 