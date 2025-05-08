import { useState, useEffect, useRef } from 'react';
import Player from './components/Player';
import Enemy from './components/Enemy';
import Score from './components/Score';
import GameOver from './components/GameOver';
import Projectile from './components/Projectile';
import './Game.css'; // Importar o CSS

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 10; // Velocidade do jogador
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const PROJECTILE_SPEED = 15;
const PROJECTILE_WIDTH = 5;
const PROJECTILE_HEIGHT = 15;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;
const ENEMY_EXPLOSION_DURATION = 5; // Ticks de jogo para a explosão
const SHOOT_COOLDOWN = 300; // Millissegundos entre tiros

// Constantes para velocidade dinâmica dos inimigos
const BASE_ENEMY_SPEED = 1.5; // Velocidade inicial dos inimigos
const SCORE_THRESHOLD_FOR_SPEED_INCREASE = 100; // A cada X pontos, aumenta a velocidade
const ENEMY_SPEED_INCREMENT = 0.5; // Quanto a velocidade aumenta

// Efeitos Sonoros (certifique-se que os arquivos estão em public/sounds/)
const shootSound = new Audio('/sounds/tiro.mp3'); // Alterado para .mp3
const explosionSound = new Audio('/sounds/explosao.mp3'); // Alterado para .mp3
const gameOverSound = new Audio('/sounds/gameover.mp3'); // Alterado para .mp3

// Função auxiliar para tocar sons
const playSound = (sound) => {
  sound.currentTime = 0; // Permite que o som seja tocado novamente mesmo se já estiver tocando
  sound.play().catch(error => console.error("Erro ao tocar som:", error)); // Adiciona tratamento de erro
};

function App() {
  const [playerPos, setPlayerPos] = useState({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 20 });
  const [enemies, setEnemies] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [pressedKeys, setPressedKeys] = useState({});
  const [canShoot, setCanShoot] = useState(true);

  // Refs para acessar o estado mais recente nos event handlers sem causar re-hook
  const playerPosRef = useRef(playerPos);
  const canShootRef = useRef(canShoot);
  const isGameOverRef = useRef(isGameOver);
  const pressedKeysRef = useRef(pressedKeys); // Ref para pressedKeys
  const scoreRef = useRef(score); // Ref para o score para calcular velocidade dinamicamente

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
  }, [score]); // Manter scoreRef atualizado

  const restartGame = () => {
    setPlayerPos({ x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - PLAYER_HEIGHT - 20 });
    setEnemies([]);
    setProjectiles([]);
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
    if (isGameOver) return; // Usar o estado diretamente aqui é bom para controlar o loop

    const gameTick = () => {
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

      // Calcular velocidade atual dos inimigos com base no scoreRef
      const speedIncreases = Math.floor(scoreRef.current / SCORE_THRESHOLD_FOR_SPEED_INCREASE);
      const currentEnemySpeed = BASE_ENEMY_SPEED + (speedIncreases * ENEMY_SPEED_INCREMENT);

      // Mover, atualizar e criar inimigos
      setEnemies(prevEnemies => {
        let updatedEnemies = prevEnemies.map(enemy => {
          if (enemy.isExploding) {
            return { ...enemy, explosionTimer: enemy.explosionTimer - 1 };
          }
          // Só mover se não estiver explodindo
          return { ...enemy, y: enemy.y + currentEnemySpeed };
        }).filter(enemy => {
            // Manter inimigos que ainda estão explodindo ou que estão na tela
            if (enemy.isExploding) return enemy.explosionTimer > 0;
            return enemy.y < GAME_HEIGHT; // Remove inimigos normais que saíram da tela por baixo
        });

        if (Math.random() < 0.02 && updatedEnemies.filter(e => !e.isExploding).length < 7) {
          updatedEnemies.push({
            id: Date.now(),
            x: Math.random() * (GAME_WIDTH - ENEMY_WIDTH),
            y: 0 - ENEMY_HEIGHT,
            isExploding: false,
            explosionTimer: 0,
          });
        }
        return updatedEnemies;
      });
    };

    const intervalId = setInterval(gameTick, 50);
    return () => clearInterval(intervalId);
  }, [isGameOver]);

  // Detecção de colisão: Projétil -> Inimigo
  useEffect(() => {
    if (isGameOver) return;

    const projectilesToRemove = new Set();
    let scoreToAdd = 0;
    let explosionOccurred = false;
    // Cria uma cópia para mutação segura se necessário, ou para passar para setEnemies
    let nextEnemies = [...enemies]; 

    for (const projectile of projectiles) {
      if (projectilesToRemove.has(projectile.id)) continue;

      for (let i = 0; i < nextEnemies.length; i++) {
        const enemy = nextEnemies[i];
        if (enemy.isExploding) continue; // Ignorar inimigos já explodindo

        const projectileRect = { x: projectile.x, y: projectile.y, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT };
        const enemyRect = { x: enemy.x, y: enemy.y, width: ENEMY_WIDTH, height: ENEMY_HEIGHT };

        if (
          projectileRect.x < enemyRect.x + enemyRect.width &&
          projectileRect.x + projectileRect.width > enemyRect.x &&
          projectileRect.y < enemyRect.y + enemyRect.height &&
          projectileRect.y + projectileRect.height > enemyRect.y
        ) {
          projectilesToRemove.add(projectile.id);
          scoreToAdd += 10;
          explosionOccurred = true;
          // Marcar inimigo como explodindo em vez de removê-lo diretamente
          nextEnemies[i] = { ...enemy, isExploding: true, explosionTimer: ENEMY_EXPLOSION_DURATION };
          break; 
        }
      }
    }

    if (explosionOccurred) {
      playSound(explosionSound); // Tocar som de explosão
    }
    if (projectilesToRemove.size > 0) {
      setProjectiles(prev => prev.filter(p => !projectilesToRemove.has(p.id)));
    }
    // Atualizar a lista de inimigos se houve alguma explosão
    // Comparar por referência não é suficiente se apenas propriedades mudaram.
    // Uma maneira simples é verificar se algum inimigo agora está explodindo que não estava antes,
    // ou simplesmente chamar setEnemies se scoreToAdd > 0 (indicando uma colisão)
    if (scoreToAdd > 0 || explosionOccurred) { 
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
      {enemies.map(enemy => (
        <Enemy key={enemy.id} enemyPos={enemy} />
      ))}
    </div>
  );
}

export default App; 