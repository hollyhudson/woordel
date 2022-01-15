"use strict";

// get all the keyboard keys and attach click event listeners
for(let k of document.querySelectorAll('.key'))
	k.addEventListener('click', (e) => place_letter(k.id,e))
// also bind to the keyboard event
document.addEventListener('keydown', (e) => place_letter(e.key,e))

let word = "frank";
let words = {};
for(let w of wordlist)
	words[w] = 1;

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

function place_letter(key,e) {
	console.log(key, e);

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
