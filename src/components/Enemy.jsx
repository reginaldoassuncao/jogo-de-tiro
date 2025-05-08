import React from 'react';

// Para acesso fácil aos detalhes do tipo, poderíamos importar ENEMY_TYPES de App.jsx
// ou definir um mapeamento simples aqui se App.jsx não exportar ENEMY_TYPES.
// Por simplicidade, vamos mapear cores aqui baseado no nome do tipo.
const ENEMY_TYPE_DETAILS = {
  normal: {
    color: 'red',
    explosionColor: 'darkred',
  },
  fast: {
    color: 'yellow',
    explosionColor: 'orange',
  },
  tank: {
    color: 'purple',
    explosionColor: 'indigo',
  },
  default: { // Fallback
    color: 'grey',
    explosionColor: 'black',
  }
};

function Enemy({ enemyData }) { // Renomeado para enemyData
  const typeDetails = ENEMY_TYPE_DETAILS[enemyData.type] || ENEMY_TYPE_DETAILS.default;
  
  const style = {
    left: `${enemyData.x}px`,
    top: `${enemyData.y}px`,
    width: '40px',
    height: '40px',
    backgroundColor: enemyData.isExploding ? typeDetails.explosionColor : typeDetails.color,
    position: 'absolute',
    // Adicionar uma borda sutil para inimigos amarelos para melhor visibilidade
    border: enemyData.type === 'fast' && !enemyData.isExploding ? '1px solid black' : 'none',
  };

  return (
    <div className="enemy" style={style}>
      {/* {enemyData.type.charAt(0).toUpperCase()}  Poderia exibir a inicial do tipo */}
    </div>
  );
}

export default Enemy; 