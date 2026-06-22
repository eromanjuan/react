import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==========================================
// CONSTANTS & STYLES
// ==========================================
const GRID_SIZE = 20;

const styles = {
  hubContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a24',
    color: '#fff',
    fontFamily: '"Segoe UI", Roboto, sans-serif',
    padding: '20px',
  },
  header: { marginBottom: '40px', textAlign: 'center' },
  menuGrid: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#252538',
    borderRadius: '12px',
    width: '260px',
    padding: '25px',
    textAlign: 'center',
    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
    border: '2px solid #3f3f5c',
  },
  button: {
    padding: '12px 24px',
    fontSize: '1rem',
    backgroundColor: '#6200ea',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '15px',
    width: '100%',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '20px',
    alignSelf: 'flex-start',
  },
  gameWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  // Snake Specific
  snakeGrid: { position: 'relative', border: '4px solid #3a3a44', backgroundColor: '#111' },
  snakeRow: { display: 'flex' },
  snakeCell: { width: '20px', height: '20px', boxSizing: 'border-box', border: '1px solid #1a1a1a' },
  // Flappy Specific
  canvas: { backgroundColor: '#70c5ce', border: '4px solid #3a3a44', display: 'block' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  }
};

// ==========================================
// GAME 1: SNAKE
// ==========================================
function SnakeGame() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const dirRef = useRef(dir);
  dirRef.current = dir;

  const genFood = useCallback((s) => {
    while (true) {
      const f = { x: Math.floor(Math.random()*GRID_SIZE), y: Math.floor(Math.random()*GRID_SIZE) };
      if (!s.some(seg => seg.x === f.x && seg.y === f.y)) return f;
    }
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowUp' && dirRef.current.y === 0) setDir({ x: 0, y: -1 });
      if (e.key === 'ArrowDown' && dirRef.current.y === 0) setDir({ x: 0, y: 1 });
      if (e.key === 'ArrowLeft' && dirRef.current.x === 0) setDir({ x: -1, y: 0 });
      if (e.key === 'ArrowRight' && dirRef.current.x === 0) setDir({ x: 1, y: 0 });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const loop = setInterval(() => {
      setSnake((prev) => {
        const head = prev[0];
        const nextHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };
        if (nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE || prev.some(s => s.x === nextHead.x && s.y === nextHead.y)) {
          setGameOver(true);
          return prev;
        }
        const newSnake = [nextHead, ...prev];
        if (nextHead.x === food.x && nextHead.y === food.y) {
          setScore(s => s + 1);
          setFood(genFood(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 140);
    return () => clearInterval(loop);
  }, [food, gameOver, genFood]);

  return (
    <div style={styles.gameWrapper}>
      <h3>Score: {score}</h3>
      <div style={styles.snakeGrid}>
        {Array.from({ length: GRID_SIZE }).map((_, y) => (
          <div key={y} style={styles.snakeRow}>
            {Array.from({ length: GRID_SIZE }).map((_, x) => {
              const isHead = snake[0].x === x && snake[0].y === y;
              const isBody = snake.slice(1).some(s => s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;
              let bg = '#111';
              if (isHead) bg = '#4CAF50';
              else if (isBody) bg = '#81C784';
              else if (isFood) bg = '#E91E63';
              return <div key={x} style={{ ...styles.snakeCell, backgroundColor: bg }} />;
            })}
          </div>
        ))}
        {gameOver && <div style={styles.overlay}><h2>Game Over</h2><button style={styles.button} onClick={() => { setSnake([{ x: 10, y: 10 }]); setFood({ x: 5, y: 5 }); setDir({ x: 1, y: 0 }); setGameOver(false); setScore(0); }}>Restart</button></div>}
      </div>
    </div>
  );
}

// ==========================================
// GAME 2: FLAPPY BIRD
// ==========================================
function FlappyBird() {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  // Game state held in refs to prevent closure issues in standard canvas animation loops
  const stateRef = useRef({
    birdY: 200, velocity: 0, pipes: [], frame: 0, score: 0,
  });

  const jump = () => {
    if (gameOver) {
      stateRef.current = { birdY: 200, velocity: 0, pipes: [], frame: 0, score: 0 };
      setScore(0);
      setGameOver(false);
    } else {
      stateRef.current.velocity = -7;
    }
  };

  useEffect(() => {
    const handleSpace = (e) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      const state = stateRef.current;
      state.frame++;
      
      // Physics
      state.velocity += 0.4; // Gravity
      state.birdY += state.velocity;

      // Spawn pipes
      if (state.frame % 90 === 0) {
        const gap = 120;
        const topHeight = Math.floor(Math.random() * (canvas.height - gap - 60)) + 30;
        state.pipes.push({ x: canvas.width, top: topHeight, bottom: canvas.height - topHeight - gap });
      }

      // Move pipes
      state.pipes.forEach(p => p.x -= 3);

      // Score incrementing
      state.pipes.forEach(p => {
        if (p.x === 50) { state.score++; setScore(state.score); }
      });

      // Remove offscreen pipes
      if (state.pipes.length > 0 && state.pipes[0].x < -50) state.pipes.shift();

      // Collisions
      if (state.birdY > canvas.height - 20 || state.birdY < 0) setGameOver(true);
      state.pipes.forEach(p => {
        if (p.x < 80 && p.x + 50 > 60 && (state.birdY < p.top || state.birdY + 20 > canvas.height - p.bottom)) {
          setGameOver(true);
        }
      });

      // Draw Screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Bird
      ctx.fillStyle = '#FFEB3B';
      ctx.fillRect(60, state.birdY, 25, 20);

      // Draw Pipes
      ctx.fillStyle = '#4CAF50';
      state.pipes.forEach(p => {
        ctx.fillRect(p.x, 0, 50, p.top);
        ctx.fillRect(p.x, canvas.height - p.bottom, 50, p.bottom);
      });

      if (!gameOver) animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [gameOver]);

  return (
    <div style={styles.gameWrapper} onClick={jump}>
      <h3>Score: {score}</h3>
      <canvas ref={canvasRef} width="400" height="500" style={styles.canvas} />
      <p style={{color: '#aaa', fontSize: '0.9rem', marginTop: '10px'}}>Press SPACEBAR or CLICK Canvas to Jump</p>
      {gameOver && <div style={{...styles.overlay, width: 400, height: 500, top: 43}}><h2 style={{color:'#E91E63'}}>Game Over</h2><button style={{...styles.button, width:'50%'}} onClick={jump}>Restart</button></div>}
    </div>
  );
}

// ==========================================
// MAIN HUB COMPONENT
// ==========================================
export default function App() {
  const [activeGame, setActiveGame] = useState(null); // 'snake', 'flappy', or null

  return (
    <div style={styles.hubContainer}>
      {activeGame ? (
        <>
          <button style={styles.backButton} onClick={() => setActiveGame(null)}>← Back to Menu</button>
          {activeGame === 'snake' && <SnakeGame />}
          {activeGame === 'flappy' && <FlappyBird />}
        </>
      ) : (
        <>
          <div style={styles.header}>
            <h1>🕹️ React Arcade Hub</h1>
            <p style={{ color: '#888' }}>Select a mini-game to start playing instantly</p>
          </div>
          
          <div style={styles.menuGrid}>
            <div style={styles.card}>
              <h2 style={{ color: '#4CAF50' }}>🐍 Snake</h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Classic arcade experience. Eat apples, grow longer, and avoid hitting the walls or yourself.</p>
              <button style={styles.button} onClick={() => setActiveGame('snake')}>Launch Game</button>
            </div>

            <div style={styles.card}>
              <h2 style={{ color: '#FFEB3B' }}>🐦 Flappy Bird</h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Test your reflexes. Defy gravity, flap your wings, and navigate through the endless green pipes.</p>
              <button style={{ ...styles.button, backgroundColor: '#ff9800' }} onClick={() => setActiveGame('flappy')}>Launch Game</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}