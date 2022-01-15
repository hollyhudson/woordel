"use strict";
const rect_w = 175;
const rect_h = 336/2 - 15;

const x_coords = [0, 204, 504, 708, 1047, 1249, 1550, 1752];
const y_coords = [
	0,
	0 + 336/2 + 15,
	372,
	372 + 336/2 + 15,
	745,
	745 + 336/2 + 15,
];

let mat;
let font;
let pg;

function preload() {
	font = loadFont('cutive-mono.ttf');
}

function setup()
{
	// we're making this happen...
	in_charge = 1;

	reset_all();

	// hide the game board
	//document.getElementById('game').style.display = 'none';

 	mat = new ProjectionMatrix(null,null,"lites2021");
	const c = createCanvas(windowWidth, windowHeight, WEBGL);
	c.parent("display");

	background(0);

	pg = createGraphics(1920,1080);
}


function draw_game()
{
	background(0);

	textFont(font);
	textSize(rect_h * 0.8);
	textAlign(CENTER, CENTER);

	for(let i = 0 ; i < max_guesses ; i++)
	{
		for(let j = 0 ; j < word_length ; j++)
		{
			const r = rows[i][j];
			push();
			translate(x_coords[j+2], y_coords[i]);

			stroke(80);

			const style = window.getComputedStyle(r);
			const bg = style.backgroundColor;

			fill(bg);
			rect(0, 0, rect_w, rect_h);

			//noStroke();
			stroke(255);
			fill(255);

			text(r.innerText, rect_w/2, rect_h/3);

			pop();
		}
	}
}

function draw()
{
	if (!in_charge)
		return;

	const orig = background(0);
	const orig_renderer = orig._renderer;
	const orig_width = width;
	const orig_height = height;

	// draw into ag
	orig._renderer = pg._renderer;
	width = 1920;
	height = 1080;

	draw_game();

	// switch back to the webgl renderer and
	// apply the projection mapping matrix
	width = orig_width;
	height = orig_height;
	orig._renderer = orig_renderer;
	mat.apply();

	image(pg, 0, 0);

	if (mat.edit)
		mat.drawMouse();
}
