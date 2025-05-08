import { useState, useEffect, useRef } from 'react';
import Player from './components/Player';
import Enemy from './components/Enemy';
import Score from './components/Score';
import GameOver from './components/GameOver';
import Projectile from './components/Projectile';
import EnemyProjectile from './components/EnemyProjectile'; // Importar projétil inimigo
import './Game.css'; // Importar o CSS

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 10; // Velocidade do jogador
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const PROJECTILE_SPEED = 15;
const PROJECTILE_WIDTH = 10;
const PROJECTILE_HEIGHT = 30;
const ENEMY_WIDTH = 60;
const ENEMY_HEIGHT = 60;
const ENEMY_EXPLOSION_DURATION = 5; // Ticks de jogo para a explosão
const SHOOT_COOLDOWN = 300; // Millissegundos entre tiros
const ENEMY_AIM_TOLERANCE = 50; // Tolerância (pixels) para o inimigo atirar no jogador alinhado

// Constantes para Projéteis Inimigos
const ENEMY_PROJECTILE_SPEED = 3; 
const ENEMY_PROJECTILE_WIDTH = 20;
const ENEMY_PROJECTILE_HEIGHT = 40;

// Constantes para velocidade dinâmica dos inimigos
const BASE_ENEMY_SPEED = 1.0; // Ajustado para melhor balanceamento com modificadores
const SCORE_THRESHOLD_FOR_SPEED_INCREASE = 100; // A cada X pontos, aumenta a velocidade
const ENEMY_SPEED_INCREMENT = 0.25; // Ajustado

// Efeitos Sonoros (certifique-se que os arquivos estão em public/sounds/)
const shootSound = new Audio('/sounds/tiro.mp3'); // Alterado para .mp3
const explosionSound = new Audio('/sounds/explosao.mp3'); // Alterado para .mp3
const gameOverSound = new Audio('/sounds/gameover.mp3'); // Alterado para .mp3

// Definição dos Tipos de Inimigos
const ENEMY_TYPES = {
  normal: {
    color: 'red',
    explosionColor: 'darkred',
    speedModifier: 1.0,
    canShoot: false,
    maxHealth: 1, // Vida para normais
  },
  fast: {
    color: 'yellow',
    explosionColor: 'orange',
    speedModifier: 1.5,
    canShoot: false,
    maxHealth: 1, // Vida para rápidos
  },
  tank: {
    color: 'purple',
    explosionColor: 'indigo',
    speedModifier: 0.7,
    canShoot: true,
    shootCooldownMillis: 2500,
    maxHealth: 3, // <<<< TANQUE AGORA TEM 3 DE VIDA
  },
};
const ENEMY_TYPE_KEYS = Object.keys(ENEMY_TYPES);

// Função auxiliar para tocar sons
const playSound = (sound) => {
  sound.currentTime = 0; // Permite que o som seja tocado novamente mesmo se já estiver tocando
  sound.play().catch(error => console.error("Erro ao tocar som:", error)); // Adiciona tratamento de erro
};

function App() {
  const [playerPos, setPlayerPos] = useState({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 20 });
  const [enemies, setEnemies] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [enemyProjectiles, setEnemyProjectiles] = useState([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [pressedKeys, setPressedKeys] = useState({});
  const [canShoot, setCanShoot] = useState(true);

  // Refs
  const playerPosRef = useRef(playerPos);
  const canShootRef = useRef(canShoot);
  const isGameOverRef = useRef(isGameOver);
  const pressedKeysRef = useRef(pressedKeys);
  const scoreRef = useRef(score);
  const projectilesToSpawnBufferRef = useRef([]);
  const enemiesRef = useRef(enemies); // <<< NOVA REF PARA INIMIGOS

  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    canShootRef.current = canShoot;
  }, [canShoot]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
    if (isGameOver) {
      playSound(gameOverSound);
    }
  }, [isGameOver]);

  useEffect(() => {
    pressedKeysRef.current = pressedKeys; // Manter a ref atualizada
  }, [pressedKeys]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]); // <<< ATUALIZAR enemiesRef

  const restartGame = () => {
    setPlayerPos({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 20 });
    setEnemies([]);
    setProjectiles([]);
    setEnemyProjectiles([]); // Limpar projéteis inimigos
    setScore(0);
    setIsGameOver(false);
    setPressedKeys({});
    setCanShoot(true);
  };

  // Controle do jogador e tiros
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isGameOverRef.current) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        // Atualiza o estado, que por sua vez atualizará pressedKeysRef.current
        setPressedKeys(prev => ({ ...prev, [e.key]: true }));
      }

      if (e.code === 'Space' && canShootRef.current) {
        e.preventDefault();
        playSound(shootSound); // Tocar som de tiro
        setProjectiles(prev => [
          ...prev,
          {
            id: Date.now(),
            x: playerPosRef.current.x + PLAYER_WIDTH / 2 - PROJECTILE_WIDTH / 2,
            y: playerPosRef.current.y,
          },
        ]);
        setCanShoot(false);
        setTimeout(() => setCanShoot(true), SHOOT_COOLDOWN);
      }
    };

    const handleKeyUp = (e) => {
      if (isGameOverRef.current) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
         setPressedKeys(prev => ({ ...prev, [e.key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Este useEffect roda apenas uma vez para configurar os listeners

  // Game Loop principal para movimento e criação
  useEffect(() => {
    console.log("SETUP gameTick useEffect: isGameOver =", isGameOver); // <<< NOVO LOG AQUI

    if (isGameOver) {
        console.log("SETUP gameTick useEffect: Jogo terminado, não iniciando loop.");
        return; // Não iniciar o loop se o jogo já acabou
    }

    console.log("SETUP gameTick useEffect: Iniciando setInterval..."); // <<< NOVO LOG AQUI

    const gameTick = () => {
      // console.log("--- gameTick EXECUTANDO ---");

      // Mover jogador usando pressedKeysRef.current
      setPlayerPos(prevPos => {
        let newX = prevPos.x;
        let newY = prevPos.y;
        if (pressedKeysRef.current['ArrowLeft']) newX -= PLAYER_SPEED;
        if (pressedKeysRef.current['ArrowRight']) newX += PLAYER_SPEED;
        if (pressedKeysRef.current['ArrowUp']) newY -= PLAYER_SPEED;
        if (pressedKeysRef.current['ArrowDown']) newY += PLAYER_SPEED;
        newX = Math.max(0, Math.min(newX, GAME_WIDTH - PLAYER_WIDTH));
        newY = Math.max(GAME_HEIGHT / 2, Math.min(newY, GAME_HEIGHT - PLAYER_HEIGHT - 10));
        return { x: newX, y: newY };
      });

      // Mover projéteis
      setProjectiles(prev =>
        prev
          .map(p => ({ ...p, y: p.y - PROJECTILE_SPEED }))
          .filter(p => p.y > -PROJECTILE_HEIGHT) // Remove se saiu completamente do topo
      );

      // Mover projéteis inimigos existentes
      setEnemyProjectiles(prev => 
        prev
          .map(p => ({ ...p, y: p.y + ENEMY_PROJECTILE_SPEED }))
          .filter(p => p.y < GAME_HEIGHT + ENEMY_PROJECTILE_HEIGHT)
      );

      const speedIncreases = Math.floor(scoreRef.current / SCORE_THRESHOLD_FOR_SPEED_INCREASE);
      const globalEnemySpeed = BASE_ENEMY_SPEED + (speedIncreases * ENEMY_SPEED_INCREMENT);
      
      // --- Processamento Síncrono de Inimigos e Projéteis ---
      let nextEnemiesList = [];
      let projectilesToSpawn = [];
      
      // console.log(`Tick: Processing ${enemiesRef.current.length} enemies from ref.`);

      for (const enemy of enemiesRef.current) {
          let updatedEnemy = {...enemy};
          // console.log(`Processing enemy ${enemy.id} at y=${enemy.y}`); 

          if (updatedEnemy.isExploding) {
            updatedEnemy.explosionTimer -= 1;
            if (updatedEnemy.explosionTimer > 0) {
              // console.log(`Keeping exploding enemy ${updatedEnemy.id}, timer=${updatedEnemy.explosionTimer}`);
              nextEnemiesList.push(updatedEnemy); 
            } else {
              // console.log(`Removing exploded enemy ${updatedEnemy.id}`);
            }
          } else {
            const enemyTypeDetails = ENEMY_TYPES[updatedEnemy.type];
            const individualSpeed = globalEnemySpeed * (enemyTypeDetails?.speedModifier || 1.0);
            updatedEnemy.y += individualSpeed;

            if (updatedEnemy.y >= GAME_HEIGHT) {
              // console.log(`Filtering out enemy ${updatedEnemy.id} - Off screen: y=${updatedEnemy.y}`);
              continue; 
            } else {
               // console.log(`Keeping non-exploding enemy ${updatedEnemy.id}, new y=${updatedEnemy.y}`);
            }

            if (enemyTypeDetails?.canShoot) {
              // Checar Cooldown
              const isCooldownOver = Date.now() - (updatedEnemy.lastShotTime || 0) > enemyTypeDetails.shootCooldownMillis;
              // Checar Alinhamento Horizontal
              const playerXCenter = playerPosRef.current.x + PLAYER_WIDTH / 2;
              const enemyXCenter = updatedEnemy.x + ENEMY_WIDTH / 2;
              const isAligned = Math.abs(playerXCenter - enemyXCenter) < ENEMY_AIM_TOLERANCE;

              if (isCooldownOver && isAligned) { // <<<< CONDIÇÃO DE MIRA ADICIONADA
                console.log(`!!! INIMIGO ATIRANDO (Alinhado): ${updatedEnemy.id} (tipo ${updatedEnemy.type})`);
                projectilesToSpawn.push({ 
                  id: Date.now() + Math.random(), 
                  x: updatedEnemy.x + ENEMY_WIDTH / 2 - ENEMY_PROJECTILE_WIDTH / 2,
                  y: updatedEnemy.y + ENEMY_HEIGHT, 
                });
                updatedEnemy.lastShotTime = Date.now();
              }
            }
            nextEnemiesList.push(updatedEnemy); 
          }
      }
      
      // console.log(`Finished processing existing. nextEnemiesList size: ${nextEnemiesList.length}`);

      // Criar novos inimigos com probabilidade restaurada (ex: 0.05)
      if (Math.random() < 0.05 && nextEnemiesList.filter(e => !e.isExploding).length < 8) { 
        const randomTypeKey = ENEMY_TYPE_KEYS[Math.floor(Math.random() * ENEMY_TYPE_KEYS.length)];
        const newEnemy = {
          id: Date.now() + Math.random(),
          x: Math.random() * (GAME_WIDTH - ENEMY_WIDTH),
          y: 0 - ENEMY_HEIGHT,
          isExploding: false,
          explosionTimer: 0,
          type: randomTypeKey,
          lastShotTime: 0, 
          currentHealth: ENEMY_TYPES[randomTypeKey].maxHealth || 1, // <<<< INICIALIZA VIDA
        };
        // console.log("Creating new enemy:", newEnemy);
        nextEnemiesList.push(newEnemy);
      }

      // console.log(`Final nextEnemiesList size before setEnemies: ${nextEnemiesList.length}`);
      setEnemies(nextEnemiesList); 

      if (projectilesToSpawn.length > 0) {
        // console.log("Adicionando projéteis inimigos ao estado:", projectilesToSpawn.length, JSON.parse(JSON.stringify(projectilesToSpawn))); // Log mantido comentado
        setEnemyProjectiles(prev => [...prev, ...projectilesToSpawn]);
      }
    };

    const intervalId = setInterval(gameTick, 50);
    console.log(`SETUP gameTick useEffect: Intervalo iniciado com ID: ${intervalId}`); // <<< NOVO LOG AQUI

    return () => {
        console.log(`CLEANUP gameTick useEffect: Limpando intervalo ID: ${intervalId}`); // <<< NOVO LOG AQUI
        clearInterval(intervalId);
    };
  }, [isGameOver]);

  // Detecção de colisão: Projétil do Jogador -> Inimigo
  useEffect(() => {
    if (isGameOver) return;

    const projectilesToRemove = new Set();
    let scoreToAdd = 0;
    let nextEnemies = [...enemies]; 
    let explosionOccurred = false;

    for (const projectile of projectiles) {
      if (projectilesToRemove.has(projectile.id)) continue;

      for (let i = 0; i < nextEnemies.length; i++) {
        let enemy = nextEnemies[i]; // Usar let para permitir reatribuição

        if (enemy.isExploding) continue; // Ignorar inimigos já explodindo

        // Verificar se o projétil já foi marcado para remoção neste loop interno
        if (projectilesToRemove.has(projectile.id)) break; 

        const projectileRect = { x: projectile.x, y: projectile.y, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT };
        const enemyRect = { x: enemy.x, y: enemy.y, width: ENEMY_WIDTH, height: ENEMY_HEIGHT };

        if (
          projectileRect.x < enemyRect.x + enemyRect.width &&
          projectileRect.x + projectileRect.width > enemyRect.x &&
          projectileRect.y < enemyRect.y + enemyRect.height &&
          projectileRect.y + projectileRect.height > enemyRect.y
        ) {
          // Marcar projétil para remoção sempre que atinge algo
          projectilesToRemove.add(projectile.id);

          // Decrementar vida do inimigo
          const newHealth = (enemy.currentHealth || 1) - 1;

          if (newHealth <= 0) {
            // Inimigo destruído
            scoreToAdd += 10; // Poderia dar mais pontos por tanques?
            explosionOccurred = true;
            // Atualizar o objeto inimigo na lista nextEnemies
            nextEnemies[i] = { ...enemy, currentHealth: 0, isExploding: true, explosionTimer: ENEMY_EXPLOSION_DURATION };
          } else {
            // Apenas atualizar a vida
            // Poderia tocar um som de "hit" aqui?
            nextEnemies[i] = { ...enemy, currentHealth: newHealth };
          }

          // Projétil só atinge um inimigo por vez
          break; 
        }
      }
    }

    if (explosionOccurred) playSound(explosionSound);
    if (projectilesToRemove.size > 0) {
      setProjectiles(prev => prev.filter(p => !projectilesToRemove.has(p.id)));
    }
    // Sempre atualizar inimigos se houve colisão (vida pode ter mudado)
    if (projectilesToRemove.size > 0) { 
        setEnemies(nextEnemies);
    }
    if (scoreToAdd > 0) {
      setScore(s => s + scoreToAdd);
    }
  }, [projectiles, enemies, isGameOver]);

  // Detecção de colisão: Jogador -> Inimigo
  useEffect(() => {
    if (isGameOver) return;
    enemies.forEach(enemy => {
      if (enemy.isExploding) return; // Jogador não colide com inimigos explodindo

      const playerRect = { x: playerPos.x, y: playerPos.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
      const enemyRect = { x: enemy.x, y: enemy.y, width: ENEMY_WIDTH, height: ENEMY_HEIGHT };
      if (
        playerRect.x < enemyRect.x + enemyRect.width &&
        playerRect.x + playerRect.width > enemyRect.x &&
        playerRect.y < enemyRect.y + enemyRect.height &&
        playerRect.y + playerRect.height > enemyRect.y
      ) {
        setIsGameOver(true);
      }
    });
  }, [playerPos, enemies, isGameOver]);

  // Detecção de colisão: Projétil Inimigo -> Jogador (NOVO)
  useEffect(() => {
    if (isGameOver) return;
    for (const enemyProjectile of enemyProjectiles) {
      const projRect = {
        x: enemyProjectile.x, y: enemyProjectile.y,
        width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT
      };
      const playerRect = {
        x: playerPos.x, y: playerPos.y,
        width: PLAYER_WIDTH, height: PLAYER_HEIGHT
      };

      if (
        projRect.x < playerRect.x + playerRect.width &&
        projRect.x + projRect.width > playerRect.x &&
        projRect.y < playerRect.y + playerRect.height &&
        projRect.y + projRect.height > playerRect.y
      ) {
        setIsGameOver(true);
        // Não precisa remover o projétil inimigo aqui, o jogo vai reiniciar
        break; // Um projétil é suficiente para o game over
      }
    }
  }, [enemyProjectiles, playerPos, isGameOver]);

  if (isGameOver) {
    return (
      <div className="game-container" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        <GameOver score={score} onRestart={restartGame} />
      </div>
    );
  }

  return (
    <div className="game-container" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      <Score score={score} />
      <Player playerPos={playerPos} />
      {projectiles.map(p => (
        <Projectile key={p.id} projectilePos={p} />
      ))}
      {enemyProjectiles.map(p => { // Renderizar projéteis inimigos
        // console.log("Renderizando EnemyProjectile:", p); // LOG DE RENDERIZAÇÃO
        return <EnemyProjectile key={p.id} projectilePos={p} />;
      })}
      {enemies.map(enemy => (
        <Enemy key={enemy.id} enemyData={enemy} />
      ))}
    </div>
  );
}

export default App; 