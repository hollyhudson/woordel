"use strict";
// contact the server
//const sock = io.connect(document.location.origin);
let in_charge = 0;
const word_length = 5;
const max_guesses = 6;
const success_timeout = 30; // seconds to leave a success on screen
const failure_timeout = 10; // seconds to leave a failure on screen

// create the guess rows
const rows = [];
let failure_row = [];
let guess_row = 0;
let guess_col = 0;
let selected;
let success = 0;
let last_time = 0;

const rows_div = document.getElementById('rows');
for(let i = 0 ; i < max_guesses + 1; i++)
{
	const row_div = document.createElement('div');
	row_div.classList.add('row');
	row_div.id = 'row-' + i;
	rows_div.appendChild(row_div);

	const row = []
	if (i < max_guesses)
	{
		rows[i] = row;
	} else {
		failure_row = row;
		row_div.style.display = 'none';
		row_div.id = 'row-failure';
	}

	for(let j = 0 ; j < word_length ; j++)
	{
		const e = document.createElement('span');
		e.classList.add('failure');
		e.classList.add('guessbox');
		e.id = i + "," + j;
		e.innerHTML = '&nbsp;';

		//if (i == max_guesses)

		row[j] = e;
		row_div.appendChild(e);
	}

}

// create the keyboard
const key_div = document.getElementById('keyboard');

const keys = [
	["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
	["a", "s", "d", "f", "g", "h", "j", "k", "l"],
	["Enter:&#9166;", "z", "x", "c", "v", "b", "n", "m", "Delete:&#9003;" ],
];
for(let row of keys)
{
	const r = document.createElement('div');
	r.classList.add('keysrow');
	for(let key of row)
	{
		const k = document.createElement('span');
		const v = key.split(":");
		k.classList.add("key");
		k.id = v[0];
		k.innerHTML = v.length == 1 ? v[0].toUpperCase() : v[1];
		if (k.id.length > 1)
			k.classList.add("key-big");

		k.addEventListener('click', (e) => {
			e.preventDefault();
			place_letter(k.id,e);
		})
		r.appendChild(k);
	}
	key_div.appendChild(r);
}

selected = rows[0][0];
selected.classList.add('selected');

// also bind to the keyboard event, but don't prevent default
document.addEventListener('keydown', (e) => place_letter(e.key,e))

const sock = io.connect("https://paint.v.st/");

sock.on('message', (msg) => console.log(msg));
sock.on('connect', () => {
        // ask for an info dump
        sock.emit('room', 'woordle');
        sock.emit('info', sock.id);
});
sock.on('keypress', (src,row,col,key) => receive_letter(src,row,col,key));

let word = "aaien";
let words = {};
for(let w of wordlist)
	words[w] = 1;

let possible_words = [];
let possible_word = '.....';
let impossible_letters = ['','','','',''];
let possible_letters = '';
let banned_letters = '';

function serialize()
{
	let keyboard = {};
	for(let k of "abcdefghijklmnopqrstuvwxyz")
		keyboard[k] = document.getElementById(k).classList

	return {
		guesses: rows.map((row) => row.map((g) => [ g.innerText, g.classList ])),
		keyboard: keyboard,
		guess: [ guess_row, guess_col ],
		word: word,
		success: success,
	};
}

function resync(sockid)
{
	if (!in_charge)
		return;

	let msg = serialize();
	console.log(sockid, msg);
	sock.emit('to', sockid, 'state', msg);
}

sock.on('info', resync);

sock.on('state', (src,msg) => {
	const guesses = msg.guesses;
	console.log("received new state", msg);
	for(let i = 0 ; i < max_guesses ; i++)
	{
		for(let j = 0 ; j < word_length ; j++)
		{
			const g = msg.guesses[i][j];
			const r = rows[i][j];
			r.innerText = g[0];
			r.classList.value = '';
			for(let c in g[1])
				r.classList.add(g[1][c]);
		}
	}

	for(let k in msg.keyboard)
	{
		const d = document.getElementById(k);
		if (!d)
			console.log("ERROR:", k);
		d.classList.value = '';
		for(let c in msg.keyboard[k])
			d.classList.add(msg.keyboard[k][c]);
	}

	success = msg.success;
	guess_row = msg.guess[0];
	guess_col = msg.guess[1];
	word = msg.word;

	failure_update();

	if (selected)
		selected.classList.remove('selected');
	selected = rows[guess_row][guess_col];
	if (selected)
		selected.classList.add('selected');
});


function failure_update()
{
	// restore the failure box
	const failure_div = document.getElementById('row-failure');
	if (failure_div)
		failure_div.style.display = 'none';

	for(let i = 0 ; i < word_length ; i++)
	{
		failure_row[i].classList.add('failure');
		failure_row[i].innerText = word[i];
	}
}

function reset_all()
{
	for(let g of document.querySelectorAll('.guessbox'))
	{
		g.innerHTML = '&nbsp;';
		g.classList.value = 'guessbox';
	}

	for(let k of document.querySelectorAll('.key'))
	{
		k.classList.remove('wrong');
		k.classList.remove('correct-letter');
		k.classList.remove('correct-location');
	}

	guess_row = 0;
	guess_col = 0;
	success = 0;

	selected = rows[0][0];
	selected.classList.add('selected');

	// pick a new word!
	word = wordlist[Math.floor(Math.random()*wordlist.length)];
	console.log("NEW WORD", word);

	failure_update();

	// update the possible word list to be a copy
	possible_words = wordlist.slice();
	possible_word = '.....';
	impossible_letters = ['','','','',''];
	possible_letters = '';
	banned_letters = '';

	if (in_charge)
	{
		const msg = serialize();
		console.log('sending', msg);
		sock.emit('state', msg);
	}
}


function check_word(guesses)
{
	// build the guessed word
	const guess = guesses.map((g) => g.innerText).join('');
	return guess in words;
}

function validate(word, guesses)
{
	let fail = 0;

	for(let i = 0 ; i < word_length ; i++)
	{
		const g = guesses[i];
		const c = g.innerText;
		//console.log('checking', i, c);
		if (word[i] == c)
		{
			// sucess!
			g.classList.add('correct-location');
			possible_word = possible_word.substring(0,i) + c + possible_word.substring(i+1);
			document.getElementById(c).classList.add('correct-location');
		} else
		if (word.includes(c))
		{
			// partial success! but still a failure
			fail = 1;
			g.classList.add('correct-letter');
			possible_letters += c;
			impossible_letters[i] += c;
			document.getElementById(c).classList.add('correct-letter');
		} else {
			fail = 1;
			banned_letters += c;
			document.getElementById(c).classList.add('wrong');
		}
	}

	// filter possible list to remove banned letters and
	// only match possible words, using all the info from
	// previous guesses
	if (in_charge)
	{
		const banned_reg = impossible_letters.map((c) => "[^" + c + banned_letters + "]").join('')
		//console.log(banned_reg);
		const banned = new RegExp("^" + banned_reg + "$");
		const possible = new RegExp("^" + possible_word + "$");
		possible_words = possible_words.filter((w) => {
			if (!banned.exec(w))
				return false;
			if (!possible.exec(w))
				return false;
			// make sure all known letters are used
			for(let c of possible_letters)
				if (!w.includes(c))
					return false;
			return true;
		})

		console.log(word, possible_words);
	}

	return !fail;
}


function receive_letter(src,row,col,key)
{
	if (row == guess_row && col == guess_col)
		place_letter(key, null);
	else
	if (in_charge)
		resync(src);
}

function place_letter(key,e) {
	// if this is not a synthetic event, record the time
	if (e != 'synthetic')
		last_time = new Date().getTime();

	//console.log(key, e);

	if (key == 'Escape')
	{
		reset_all();
		return;
	}

	// if there isn't a matching keyboard element, discard this
	if (!document.getElementById(key) && key != "Backspace")
		return;

	// if this is a local event, broadcast it
	if (e != null)
		sock.emit('keypress', guess_row, guess_col, key);

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
		if (guess_row == max_guesses)
			return;
		if (guess_col != word_length)
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
			for(let g of rows[guess_row])
				g.classList.add('success');
			guess_row = max_guesses;
			guess_col = 0;
			success = 1;
			if (in_charge)
				window.setTimeout(reset_all, success_timeout*1000);
			return;
		}

		if (selected)
			selected.classList.remove('selected');
			
		guess_col = 0;
		guess_row++;

		if (guess_row == max_guesses)
		{
			console.log("YOU FAILED", word);
			success = -1;
			const failure_div = document.getElementById('row-failure');
			if (failure_div)
				failure_div.style.display = null;

			if (in_charge)
				window.setTimeout(reset_all, failure_timeout*1000);
			return;
		}

		selected = rows[guess_row][guess_col];
		if (selected)
			selected.classList.add('selected');
		return;
	}

	if (key.length > 1)
		return;

	//e.preventDefault();

	if(guess_col == word_length)
	{
		// too many!
		return;
	}

	// nothing is actually ready to receive a character
	if (!selected)
		return;

	selected.innerText = key;
	selected.classList.add('visible');
	selected.classList.remove('selected');
	
	selected = rows[guess_row][++guess_col];
	if (selected)
		selected.classList.add('selected');
}

// trigger a reset to choose a random word
reset_all();

