// get all the keyboard keys and attach click event listeners
const keys = document.getElementByClassName('key');

for (let i = 0; i < keys.length; i++) {
	keys[i].addEventListener('click', place_letter.bind(keys[i], i));
}

function place_letter() {
	
}
