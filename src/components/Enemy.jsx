import React from 'react';

// Mapeamento do tipo do inimigo para o nome do arquivo de imagem
// (Assumindo que os arquivos estão em /public/assets/images/ e foram renomeados para .png)
const ENEMY_SPRITES = {
  normal: '/assets/images/enemyRed.png',
  fast: '/assets/images/enemyYellow.png',
  tank: '/assets/images/tank.png',
  default: '/assets/images/enemyRed.png' // Fallback para um inimigo padrão
};

// Cores para explosão ainda podem ser usadas ou substituídas por um sprite de explosão
const ENEMY_EXPLOSION_COLORS = {
  normal: 'darkred',
  fast: 'orange',
  tank: 'indigo',
  default: 'black'
};

function Enemy({ enemyData }) { 
  const spriteUrl = ENEMY_SPRITES[enemyData.type] || ENEMY_SPRITES.default;
  const explosionColor = ENEMY_EXPLOSION_COLORS[enemyData.type] || ENEMY_EXPLOSION_COLORS.default;

  const style = {
    left: `${enemyData.x}px`,
    top: `${enemyData.y}px`,
    width: '40px', // Manter 40px por enquanto, ajustar se necessário
    height: '40px',
    position: 'absolute',
    backgroundImage: !enemyData.isExploding ? `url(${spriteUrl})` : 'none', // Usar sprite se não explodindo
    backgroundColor: enemyData.isExploding ? explosionColor : 'transparent', // Cor de explosão ou transparente
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