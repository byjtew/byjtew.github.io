// this class describes the properties of a single particle.
const files = [
	"ADA",
	"ARK",
	"BAT",
	"BCC",
	"BCH",
	"BNB",
	"BTC",
	"DASH",
	"DOGE",
	"EOS",
	"ETC",
	"ETH",
	"GNT",
	"KNC",
	"LSK",
	"LTC",
	"OMG",
	"REP",
	"STEEM",
	"TRX",
	"USDT",
	"XLM",
	"XMR",
	"XRP",
	"ZEC",
	"ZEN",
];

class Particle {
	// setting the co-ordinates, radius and the
	// speed of a particle in both the co-ordinates axes.
	constructor() {
		this.x = random(0, width);
		this.y = random(0, height);
		this.r = random(20, 60);
		this.half_r = this.r / 2;
		this.xSpeed =
			Math.random() >= 0.5 ?
			random(-this.maxSpeed(), -this.minSpeed()) :
			random(this.minSpeed(), this.maxSpeed());
		this.ySpeed =
			Math.random() >= 0.5 ?
			random(-this.maxSpeed(), -this.minSpeed()) :
			random(this.minSpeed(), this.maxSpeed());
		this.img = loadImage(
			`/static/icons/tokens/${files[random(0, files.length - 1) | 0]}.svg`
		);
	}

	minSpeed = () => 0.1;
	maxSpeed = () => 0.7;

	// creation of a particle.
	createParticle() {
		noStroke();
		image(this.img, this.x, this.y, this.r, this.r);
	}

	// setting the particle in motion.
	moveParticle() {
		if (this.x < 0 || this.x > width) this.xSpeed *= -1;
		if (this.y < 0 || this.y > height) this.ySpeed *= -1;
		this.x += this.xSpeed;
		this.y += this.ySpeed;
	}

	// this function creates the connections(lines)
	// between particles which are less than a certain distance apart
	max_distance = 150;
	joinParticles(particles) {
		particles.forEach((element) => {
			let dis = dist(this.x, this.y, element.x, element.y);
			if (dis < this.max_distance) {
				stroke(`rgba(255,255,255,${(1 - dis / this.max_distance).toString()})`);
				line(
					this.x + this.half_r,
					this.y + this.half_r,
					element.x + element.half_r,
					element.y + element.half_r
				);
			}
		});
	}
}
// an array to add multiple particles

let canvas;
let particles = [];

function setup() {
	this.canvas = createCanvas(windowWidth, windowHeight);
	this.canvas.style("overflow", "hidden");
	for (let i = 0; i < width / 30; i++) {
		particles.push(new Particle());
	}
}

let timer;

function debounce(func, timeout = 300) {
	clearTimeout(this.timer);
	this.timer = setTimeout(() => {
		func();
	}, timeout);
}

function windowResized() {
	this.debounce(() => resizeCanvas(windowWidth, windowHeight));
}

function draw() {
	background("#0f0f0f");
	for (let i = 0; i < particles.length; i++) {
		particles[i].moveParticle();
		particles[i].joinParticles(particles.slice(i));
		particles[i].createParticle();
	}
}