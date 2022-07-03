const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

// Передаём всё необходимое содержимое из HTML
const scoreEl = document.querySelector('#scoreEl');
const startGameBtn = document.querySelector('#startGame');
const modelEl = document.querySelector('#modelEl');
const bigScore = document.querySelector('#bigScore');

// Класс с игроком и его наборами данных
class Player {
	constructor(x, y, radius, color) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
	}

	// Функция отрисовки
	draw() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
	}
}

// Атакующий снаряд 
class Projectile {
	constructor(x, y, radius, color, velocity) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity;
	}

	draw() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
	}

	update() {
		this.draw();
		this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;
	}
}

// Враги
class Enemy {
	constructor(x, y, radius, color, velocity) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity;
	}

	draw() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
	}

	update() {
		this.draw();
		this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;
	}
}

// Эффекты разрушения от tailWindCss
class Particle {
	constructor(x, y, radius, color, velocity) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity;
		this.alpha = 1;
	}

	draw() {
		c.save();
		c.globalAlpha = this.alpha;
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.fillStyle = this.color;
		c.fill();
		c.restore();
	}

	update() {
		this.draw();
		this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;
		this.apha -= 0.01;
	}
}

// Координаты расположения игрока
const x = canvas.width / 2;
const y = canvas.height / 2;

// Создание игрока, и массивов для снарядов, врагов, эффектов
let player = new Player(x, y, 10, 'white');
let projectiles = [];
let enemies = [];
let particles = [];

// Прописываю функцию для рестарта
function init() {
	player = new Player(x, y, 10, 'white');
	projectiles = [];
	enemies = [];
	particles = [];
	score = 0;
	scoreEl.innerHTML = score;
	bigScore.innerHTML = score;
}

// Функция создания врагов
function spawnEnemies() {
	setInterval(() => {
		const radius = Math.random()* (30 - 4) + 4;

		let x;
		let y;

		if( Math.random() < 0.5) {
			x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
			y = Math.random() * canvas.height;
		} else {
			x = Math.random() * canvas.width;
			y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
		}

		const color = `hsl( ${Math.random() * 360}, 50%, 50%)`;
		
		const angle = Math.atan2(
			canvas.height / 2 - y,
			canvas.width / 2 - x
		)
		// Скорость
		const velocity = {
			x: Math.cos(angle),
			y: Math.sin(angle) 
		}


		enemies.push(new Enemy(x, y, radius, color, velocity))
	}, 1000)
}

let animationId;
let score = 0;

// Функция с игрой
function animate() {
	animationId = requestAnimationFrame(animate); // Прогрузка каждого фрейма игры
	c.fillStyle = 'rgba(0, 0, 0, 0.1)';
	c.fillRect(0, 0, canvas.width, canvas.height);

	player.draw();

	// Эффект распада
	particles.forEach((particle, index) => {
		if(particle.alpha <= 0) {
			particles.splice(index, 1);
		} else {
			particle.update();
		}
	})

	// Анимация движения снаряда
	projectiles.forEach((projectile, index) => {
		projectile.update();
		
		// Закрываем экран с игрой
		if(
			projectile.x + projectile.radius < 0 ||
			projectile.x - projectile.radius > canvas.width ||
			projectile.y + projectile.radius < 0 ||
			projectile.y - projectile.radius > canvas.height
		) {
			setTimeout(() => {
				projectiles.splice(index, 1);
			}, 0)
		}
	});

	enemies.forEach((enemy, index) => {
		enemy.update();

		// Проверка дистанции
		const dist = Math.hypot(player.x - enemy.x,
			player.y - enemy.y)

		// Конец игры когда враги соприкасаются с игроком
		if ( dist - enemy.radius - player.radius < 1) {
			cancelAnimationFrame(animationId);
			modelEl.style.display = 'flex';
			bigScore.innerHTML = score;
		};

		// Находим расстояние между снарядом и врагом
		projectiles.forEach((projectile, projectileIndex) => {
			const dist = Math.hypot(projectile.x - enemy.x,
				projectile.y - enemy.y)
			// Момент касания 
			if ( dist - enemy.radius - projectile.radius < 1) 
			{
				// Создание взрыва врагов
				for(let i = 0; i < enemy.radius * 2; i++) {
					particles.push(new Particle(projectile.x,
						projectile.y, Math.random() * 2, enemy.color,
						{
							x: (Math.random() - 0.5) * (Math.random() * 6),
							y: (Math.random() - 0.5) * (Math.random() * 6)
						})
					)
				}

				// Добавление очков если враг уничтожен
				if(enemy.radius - 10 > 5) {
					// Добавление очков 
					score += 100;
					scoreEl.innerHTML = score;

					// Эффект затухания
					gsap.to(enemy, {
						radius: enemy.radius - 10
					})
					setTimeout(() => {
						projectiles.splice(projectileIndex, 1)
					}, 0)
				} else {
					score += 250;
					scoreEl.innerHTML = score;
					setTimeout(() => {
						enemies.splice(index, 1);
						projectiles.splice(projectileIndex, 1);
					}, 0)
				}
			};
		});
	});
}

window.addEventListener('click', (event) => {
	const angle = Math.atan2(
		event.clientY - canvas.height / 2,
		event.clientX - canvas.width / 2
	)
	// Скорость атаки
	const velocity = {
		x: Math.cos(angle) * 5,
		y: Math.sin(angle) * 5
	}
	projectiles.push(
		new Projectile(canvas.width / 2,
			canvas.height / 2, 5, 'white', velocity)
	)
})

startGameBtn.addEventListener('click', () => {
	init()
	animate();
	spawnEnemies();
	modelEl.style.display = 'none';
})