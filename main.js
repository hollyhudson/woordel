"use strict";
// contact the server
//const sock = io.connect(document.location.origin);
let in_charge = 0;
const sock = io.connect("https://paint.v.st/");

sock.on('message', (msg) => console.log(msg));
sock.on('connect', () => {
        // ask for an info dump
        sock.emit('room', 'woordle');
        sock.emit('info', sock.id);
});
sock.on('keypress', (args) => receive_letter(...args));


// get all the keyboard keys and attach click event listeners
for(let k of document.querySelectorAll('.key'))
	k.addEventListener('click', (e) => place_letter(k.id,e))
// also bind to the keyboard event
document.addEventListener('keydown', (e) => place_letter(e.key,e))

let word = "frank";
let words = {};
for(let w of wordlist)
	words[w] = 1;

sock.on('info', (sockid) => {
	console.log(sockid);
	if (!in_charge)
		return;

	let keyboard = {};
	for(let k of "abcdefghijklmnopqrstuvwxyz")
		keyboard[k] = document.getElementById(k).classList

	sock.emit('to', {
		dest: sockid,
		topic: 'state',
		guesses: rows.map((row) => row.map((g) => [ g.innerText, g.classList ])),
		keyboard: keyboard,
		guess: [ guess_row, guess_col ],
	});
});

sock.on('state', (msg) => {
	const guesses = msg.guesses;
	console.log(msg);
	for(let i = 0 ; i < 6 ; i++)
	{
		for(let j = 0 ; j < 5 ; j++)
		{
			const g = msg.guesses[i][j];
			const r = rows[i][j];
			r.innerText = g[0];
			for(let c in g[1])
				r.classList.add(g[1][c]);
		}
	}

	for(let k in msg.keyboard)
		for(let c in msg.keyboard[k])
			document.getElementById(k).classList.add(msg.keyboard[k][c]);

	guess_row = msg.guess[0];
	guess_col = msg.guess[1];

	if (selected)
		selected.classList.remove('selected');
	selected = rows[guess_row][guess_col];
	if (selected)
		selected.classList.add('selected');
});


function check_word(guesses)
{
	// build the guessed word
	const guess = guesses.map((g) => g.innerText).join('');
	return guess in words;
}

function validate(word, guesses)
{
	let fail = 0;

	for(let i = 0 ; i < 5 ; i++)
	{
		const g = guesses[i];
		const c = g.innerText;
		console.log('checking', i, c);
		if (word[i] == c)
		{
			// sucess!
			g.classList.add('correct-location');
			document.getElementById(c).classList.add('correct-location');
		} else
		if (word.includes(c))
		{
			// partial success!
			g.classList.add('correct-letter');
			document.getElementById(c).classList.add('correct-letter');
			fail = 1;
		} else {
			document.getElementById(c).classList.add('wrong');
		}
	}

	return !fail;
}

const rows = [];
let guess_row = 0;
let guess_col = 0;
let selected;

function receive_letter(row,col,key)
{
	if (row == guess_row && col == guess_col)
		place_letter(key, null);
	else
		console.log("mismatch!");
}

function place_letter(key,e) {
	console.log(key, e);

	// if this is a local event, broadcast it
	if (e != null)
		sock.emit('keypress', [guess_row, guess_col, key]);

	if (key == 'Delete' || key == 'Backspace')
	{
		if (guess_col == 0)
			return;

		if (selected)
			selected.classList.remove('selected');

		selected = rows[guess_row][--guess_col];
		selected.classList.remove('visible');
		selected.classList.add('selected');
		selected.innerHTML = '&nbsp;';
		return;
	}

	if (key == 'Enter')
	{
		if (guess_row == 6)
			return;
		if (guess_col != 5)
			return;
		if (!check_word(rows[guess_row]))
		{
			console.log("invalid word!");
			for(let g of rows[guess_row])
			{
				g.classList.add('badword');
				window.setTimeout(() => g.classList.remove('badword'), 2000);
			}
			return;
		}

		if (validate(word, rows[guess_row]))
		{
			console.log('success!');
		}

		if (selected)
			selected.classList.remove('selected');
			
		guess_col = 0;
		guess_row++;

		selected = rows[guess_row][guess_col];
		if (selected)
			selected.classList.add('selected');
		return;
	}

	if (key.length > 1)
		return;

	//e.preventDefault();

	if(guess_col == 5)
	{
		// too many!
		return;
	}

	console.log(selected);
	selected.innerText = key;
	selected.classList.add('visible');
	selected.classList.remove('selected');
	
	selected = rows[guess_row][++guess_col];
	if (selected)
		selected.classList.add('selected');
}

// create the guess rows
const rows_div = document.getElementById('rows');
for(let i = 0 ; i < 6 ; i++)
{
	const row = document.createElement('div');
	row.classList.add('row');

	rows[i] = [];

	for(let j = 0 ; j < 5 ; j++)
	{
		const e = document.createElement('span');
		e.classList.add('guessbox');
		e.id = i + "," + j;
		e.innerHTML = '&nbsp;';
		row.appendChild(e);
		rows[i].push(e);
	}

	rows_div.appendChild(row);
}

selected = rows[0][0];
selected.classList.add('selected');
