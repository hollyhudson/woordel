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

let long_type_timeout = 60; // seconds after they have typed anything
let short_type_timeout = 15; // seconds after attract mode has typed
let type_timeout = short_type_timeout;
let type_speed = 1; // char per second
let mat;
let font;
let pg;

let mode = 0;

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


let new_guesses = [];
let last_synthetic = 0;
let last_real_time = 0;

function attract_mode()
{
	const now = new Date().getTime();
	if (last_time == 0)
		last_time = last_real_time = now;

	if (last_time != last_real_time)
	{
		// they have typed something! immediately exit attract mdoe
		console.log("EXITING ATTRACT MODE");
		mode = 0;
		last_real_time = last_time;
		type_timeout = long_type_timeout;
		return;
	}

	// if we've won, then don't do anything and go back to waiting
	if (success)
	{
		if (mode != 0)
			console.log("SUCCESS! Exiting attract mode for a while");
		mode = 0;
		type_timeout = long_type_timeout;
		return;
	}

	if (mode == 0)
	{
		// if they have typed something recently, then stay in manual mode
		if (now - last_real_time < type_timeout*1000)
			return;

		// we've entered attract mode, see if we can use what they've typed
		console.log("ENTERING ATTRACT MODE");
		let partial = '';
		new_guesses = [];
		for(let i = 0 ; i < guess_col ; i++)
		{
			partial += rows[guess_row][i].innerText;
			new_guesses.push("Delete");
		}

		const possible = possible_words.filter((w) => w.startsWith(partial));
		console.log("possible extentsions", partial, possible);
		if (possible.length > 0)
		{
			let new_guess = possible[Math.floor(Math.random()*possible.length)];
			new_guess = new_guess.substring(guess_col);
			new_guesses = [];
			for(let c of new_guess)
				new_guesses.push(c);
			new_guesses.push("Enter");
		}

		mode = 1;
	}

	// type in the guesses and the typing speed
	if (now - last_synthetic < (type_speed + Math.random()/2) * 1000)
		return;

	// if we have typed everything, then we're done
	if (new_guesses.length == 0)
	{
		mode = 0;
		last_time = last_real_time = now;
		type_timeout = short_type_timeout;
		return;
	}

	const new_guess = new_guesses.shift();
	place_letter(new_guess, 'synthetic');
	last_synthetic = now;
}

function draw_game()
{
	attract_mode();

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
