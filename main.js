// get all the keyboard keys and attach click event listeners
"use strict";

for(let k of document.querySelectorAll('.key'))
	k.addEventListener('click', (e) => place_letter(k,e))

let word = "frank";

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
			document.getElementById(c).classList.add('correct-location');
			fail = 1;
		}
	}

	return !fail;
}

const rows = [];
let guess_row = 0;
let guess_col = 0;


function place_letter(k,e) {
	const key = k.id;
	console.log(key);
	e.preventDefault();

	if (key == 'delete')
	{
		if (guess_col == 0)
			return;

		guess_col--;
		rows[guess_row][guess_col].classList.remove('visible');
		return;
	}

	if (key == 'enter')
	{
		// todo: actually check it
		if (guess_row == 6)
			return;
		if (validate(word, rows[guess_row]))
		{
			console.log('success!');
		}
			
		guess_col = 0;
		guess_row++;
		return;
	}

	if(guess_col == 5)
	{
		// too many!
		return;
	}

	const sq = rows[guess_row][guess_col++];
	sq.innerText = key;
	sq.classList.add('visible');
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
		e.innerText = '0';
		row.appendChild(e);
		rows[i].push(e);
	}

	rows_div.appendChild(row);
}

