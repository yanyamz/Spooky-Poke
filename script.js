const $canvas = document.querySelector('.canvas')
const ctx = $canvas.getContext('2d')
$canvas.width = window.innerWidth
$canvas.height = window.innerHeight

const $collision_canvas = document.querySelector('.collision_canvas')
const collision_ctx = $collision_canvas.getContext('2d')
$collision_canvas.width = window.innerWidth
$collision_canvas.height = window.innerHeight

let score = 0
let gameOver = false
ctx.font = '50px Impact'

let timeToNextRaven = 0
let ravenInterval = 500
let lastTime = 0
let ravens = []
class Raven {
	constructor() {
		this.spriteWidth = 271
		this.spriteHeight = 194
		this.sizeModifer = Math.random() * 0.6 + 0.4
		this.width = this.spriteWidth * this.sizeModifer //  Gives each Raven unique size while maintaining aspect ration
		this.height = this.spriteHeight * this.sizeModifer
		this.x = $canvas.width //  Start the raven on the edge of the screen
		this.y = Math.random() * ($canvas.height - this.height)
		this.directionX = Math.random() * 5 + 3
		this.directionY = Math.random() * 5 - 2.5
		this.markedForDeletion = false
		this.image = new Image()
		this.image.src = './assets/raven.png'
		this.frame = 0
		this.maxFrame = 4
		this.timeSinceFlap = 0
		this.flapInteraval = Math.random() * 50 + 50
		this.randomColors = [
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
		]
		this.color = `rgb(${this.randomColors[0]},${this.randomColors[1]},${this.randomColors[2]})`
	}
	update(deltaTime) {
		// Bounce the object on the screen in the opposite direction if they hit a vertical border so they dont fly off the scrren
		if (this.y < 0 || this.y > $canvas.height - this.height) {
			this.directionY = this.directionY * -1
		}
		this.x -= this.directionX
		this.y += this.directionY
		// If the ravens X value has flown off the screen, mark it for deletion
		if (this.x < 0 - this.width) this.markedForDeletion = true

		// Remember delta time is the rate at which we are requesting animation frames
		this.timeSinceFlap += deltaTime
		if (this.timeSinceFlap > this.flapInteraval) {
			if (this.frame > this.maxFrame) this.frame = 0
			else this.frame++
			// Reset so it can start counting again so it knows when to serve next frame
			this.timeSinceFlap = 0
		}
		if (this.x < 0 - this.width) gameOver = true
	}
	draw() {
		collision_ctx.fillStyle = this.color
		collision_ctx.fillRect(this.x, this.y, this.width, this.height)
		ctx.drawImage(
			this.image,
			this.frame * this.spriteWidth, //  Source X
			0, //  Source Y
			this.spriteWidth, //  Source Width
			this.spriteHeight, //  Source Height
			this.x,
			this.y,
			this.width,
			this.height
		)
	}
}

let explosions = []
class Explosion {
	constructor(x, y, size) {
		this.image = new Image()
		this.image.src = './assets/boom.png'
		this.spriteWidth = 200
		this.spriteHeight = 179
		this.size = size
		this.x = x
		this.y = y
		this.frame = 0
		this.sound = new Audio()
		this.sound.src = './assets/boom.wav'
		this.timeSinceLastFrame = 0
		this.frameInterval = 200
		this.markedForDeletion = false
	}
	update(deltaTime) {
		if (this.frame === 0) this.sound.play()
		this.timeSinceLastFrame += deltaTime
		if (this.timeSinceLastFrame > this.frameInterval) {
			this.frame++
			this.timeSinceLastFrame = 0
			if (this.frame > 5) this.markedForDeletion = true
		}
	}
	draw() {
		ctx.drawImage(
			this.image,
			this.frame * this.spriteWidth,
			0,
			this.spriteWidth,
			this.spriteHeight,
			this.x,
			this.y,
			this.size,
			this.size
		)
	}
}

function drawScore() {
	ctx.fillStyle = 'black'
	ctx.fillText('Score: ' + score, 150, 75) //  (x,y)
	ctx.fillStyle = 'white'
	ctx.fillText('Score: ' + score, 152, 80) //  (x,y)
}

function drawGameOver() {
	ctx.textAlign = 'center'
	ctx.fillStyle = 'black'
	ctx.fillText(
		`GAME OVER, your score is ${score}`,
		$canvas.width / 2,
		$canvas.height / 2
	)
	ctx.fillStyle = 'white'
	ctx.fillText(
		`GAME OVER, your score is ${score}`,
		$canvas.width / 2 + 2,
		$canvas.height / 2 + 5
	)
}

// When our user clicks on the screen
window.addEventListener('click', (e) => {
	const detectPixelColor = collision_ctx.getImageData(e.x, e.y, 1, 1) // Gets the single pixel data
	// console.log(detectPixelColor)
	const pc = detectPixelColor.data
	ravens.forEach((object) => {
		if (
			object.randomColors[0] === pc[0] &&
			object.randomColors[1] === pc[1] &&
			object.randomColors[2] === pc[2]
		) {
			object.markedForDeletion = true
			score++
			explosions.push(new Explosion(object.x, object.y, object.width))
			// console.log(explosions)
		}
	})
})

// Using timestamps to ensure the game runs at an optimal speed for both slow and fast computers
function animate(timestamp) {
	ctx.clearRect(0, 0, $canvas.width, $canvas.height)
	collision_ctx.clearRect(0, 0, $canvas.width, $canvas.height)
	let deltaTime = timestamp - lastTime
	lastTime = timestamp
	timeToNextRaven += deltaTime

	// Every set 500ms (because ravenInterval) a new Raven will be created
	if (timeToNextRaven > ravenInterval) {
		ravens.push(new Raven())
		timeToNextRaven = 0
		ravens.sort((a, b) => b.width - a.width)
	}
	drawScore()
	;[...ravens, ...explosions].forEach((object) => object.update(deltaTime))
	;[...ravens, ...explosions].forEach((object) => object.draw())

	// All ravens marked for deletion will be filtered out of the array
	ravens = ravens.filter((object) => !object.markedForDeletion)
	// Animate becomes a callback for requestAnimationFrame, what this means is that everytime we request a frame, this animate function will be called.
	if (!gameOver) requestAnimationFrame(animate)
	else drawGameOver()
}

// Timestamp only gets called on 2nd call so timestamp is undefined at first leading to NaN bugs
animate(0)
