const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
const ratio = Math.ceil(window.devicePixelRatio)
canvas.width = window.innerWidth * ratio;
canvas.height = window.innerHeight * ratio;
let particlesArray;

let mouse = {
    x: null,
    y: null,
    radius: (canvas.height/80) * (canvas.width/80),
}

let timer;
function debounce(func, timeout = 300) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { func() }, timeout);
  }

function _onResize() {
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    mouse.radius = (canvas.height/80)**2;
    init();
}

window.addEventListener('resize', function() {
    this.debounce(() => this._onResize());
});

window.addEventListener('mouseout', function() {
    mouse.x = undefined;
    mouse.y = undefined;
});


window.addEventListener('mousemove', 
    function({x,y}) {
        mouse.x = x;
        mouse.y = y;
    }
);


function clamp(v, l, h) {
    return l < h ? Math.max(l, Math.min(h, v)) : Math.max(h, Math.min(l, v));
};

class Particle {
    constructor(x, y, dirX, dirY, size, image) {
        this.x = x;
        this.y = y;
        this.initDirX = dirX;
        this.initDirY = dirY;
        this.dirX = dirX;
        this.dirY = dirY;
        this.size = size;
        this.image = new Image(size, size);
        this.image.src = image;
    }

    getFullSpeed = () => 1.5;
    getMinSpeed = () => .15;

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }

    update() {
        if (this.x + this.size > canvas.width || this.x < 0) {
            this.dirX = -this.dirX;
        }
        if (this.y + this.size > canvas.height || this.y < 0) {
            this.dirY = -this.dirY;
        }

        if (mouse.x !== undefined && mouse.y !== undefined){
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let maxDistance = mouse.radius + this.size;
            let distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < maxDistance){
                this.dirX = (this.dirX <= 0 ? -1 : 1) * window.clamp(distance/maxDistance * this.getFullSpeed(), this.getMinSpeed(), this.initDirX);
                this.dirY = (this.dirY <= 0 ? -1 : 1) * window.clamp(distance/maxDistance * this.getFullSpeed(), this.getMinSpeed(), this.initDirY);
            }
        }
        this.x += this.dirX;
        this.y += this.dirY;
        this.draw();
    }
}

const files = ["ADA", "ARK", "BAT", "BCC", "BCH", "BNB", "BTC", "DASH", "DOGE", "EOS", "ETC", "ETH", "GAS", "GNO", "GNT", "IOT", "KNC", "LSK", "LTC", "NEO", "OMG", "QTUM", "REP", "SC", "STEEM", "STORJ", "TRX", "USDT", "XEM", "XLM", "XMR", "XRP", "ZEC", "ZEN"];

function _isPortrait() { return ctx.width < ctx.height; }

function init() {
    particlesArray = [];
    let numberOfParticles = window.clamp(canvas.height*canvas.width / 25000, 10, 60);
    console.log(`numberOfParticles: ${numberOfParticles}`);
    for (let i=0; i<numberOfParticles; i++) {
        
        let size = Math.random() < .7 ? (Math.random() * 20) + 25 : (Math.random() * 30) + 40 ;
        let doubleSize = size*2;
        let fourthSize = 2*doubleSize;
        let x = (Math.random() * (innerWidth * ratio - fourthSize) + doubleSize);
        let y = (Math.random() * (innerHeight * ratio - fourthSize) + doubleSize);
        
        let randomFactor = 1.5;
        let dirX = 3*Math.random() - randomFactor;
        let dirY = 3*Math.random() - randomFactor;

        let image = `/static/icons/tokens/${files[Math.floor(Math.random() * files.length)]}.svg`
        //console.log(`Randomly picked image: ${image} at [${x}, ${y}]`);

        particlesArray.push(new Particle(x, y, dirX, dirY, size, image))
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    connect();
    for (let i=0; i<particlesArray.length; i++) {
        particlesArray[i].update();
    }
    
}

function connect() {
    let opacityValue = 1;
    for (let a=0; a<particlesArray.length; a++) {
        for (let b=a; b<particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x)**2) + ((particlesArray[a].y - particlesArray[b].y)**2 );
            if (distance < (canvas.width/3) * (canvas.height/3)) {
                opacityValue = 1 - (distance/20000);
                ctx.strokeStyle = 'rgba(140, 85, 31,' + opacityValue + ')'  ;
                ctx.lineWidth = 1.5;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x+particlesArray[a].size/2, particlesArray[a].y+particlesArray[a].size/2);
                ctx.lineTo(particlesArray[b].x+particlesArray[b].size/2, particlesArray[b].y+particlesArray[b].size/2);
                ctx.stroke();
            }
        }
    }
}

init();
animate();