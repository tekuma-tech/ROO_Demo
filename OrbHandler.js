var mode = 0; //0 os and browser not supported, 1 use gamepad libary, 2 use serial , -1 failed state mainly due to google not following standards....
var ballConnected = false;
var ball = 0;
var orbOutput = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };  //range -1 to 1;
var buttonOutput = 0;  //16 bools
export { orbOutput };
export { buttonOutput };
var connectedToSerial = function temp() { };
var disconnectedToSerial = function temp() { };

window.addEventListener("gamepadconnected", (event) => {
	if (event.gamepad.id.includes("Tekuma") || event.gamepad.id.includes("ROV Control") || event.gamepad.id.includes("EMU")) {
		modeTest();
		clearFirstLoad();
		connectToBall();
	}
});

function canUseGame() {
	return ("getGamepads" in navigator);// && !(navigator.userAgent.includes("Android"));
}

function canUseSerial() {
	return "serial" in navigator;
}
var usingChrome;
function modeTest() {
	if (navigator.userAgent.includes("Chrome")) {
		usingChrome = true;
	} else {
		usingChrome = false;
	}
	if (!canUseGame() && !canUseSerial()) {
		mode = 0;
	}
	//known issue with chrome and windows not retrieving axis information correctly
	else if (false) { //if (navigator.userAgent.includes("Windows") && navigator.userAgent.includes("Chrome")) {
		if (canUseSerial()) {
			mode = 2;
		}
		else {
			mode = 0;
		}
	}
	else if (canUseGame()) {
		mode = 1;
	}
	else if (canUseSerial()) {
		mode = 2;
	}

	return mode;
}

var firstLoad = true;

function connectToBall() {
	switch (mode) {
		case 0:
			break;
		case 1:
			useGamepadAPI();
			break;
		case 2:
			if (!firstLoad) {
				loadConnectStatement();
			}
			break;
		default:
			break;
	}
	firstLoad = false;
}

function clearFirstLoad() {
	firstLoad = true;
}

var scanner;

function useGamepadAPI() {
	console.log("Using Gamepad API for demo");
	var gamePads = navigator.getGamepads();

	for (var i = 0; i < gamePads.length; i++) {
		if (gamePads[i].id.includes("Tekuma") || gamePads[i].id.includes("ROV Control") || gamePads[i].id.includes("EMU")) {
			console.log("Valid Controller found");
			ball = gamePads[i];
			ballConnected = true;
			i = gamePads.length;

			if (ball.axes.length != 6) {
				mode = -1;
				ballConnected = false;
			}
		}
	}

	if (ball == 0) {
		return;
	}

	//start going the thing
	console.log("Start demo");
	if (usingChrome) {
		scanner = setInterval(gamepadChromePolling, 1);
	} else {
		scanner = setInterval(gamepadConversion, 1);
	}
	document.getElementById("conDevice").style.visibility = "hidden";
	document.getElementById("displayHorizontal").style.visibility = "visible";

	window.addEventListener("gamepaddisconnected", (event) => {
		if (event.gamepad.id.includes("Tekuma") || event.gamepad.id.includes("ROV Control") || event.gamepad.id.includes("EMU")) {
			//stop doing the thing
			console.log("Stop demo");
			document.getElementById("displayHorizontal").style.visibility = "hidden";
			document.getElementById("conDevice").style.visibility = "visible";
			clearInterval(scanner);
			ballConnected = false;
		}
	});
}

function gamepadChromePolling() {
	ball = navigator.getGamepads()[ball.index];
	gamepadConversion();
}

function gamepadConversion() {
	if (ballConnected) {
		// this was originally ^3 but i felt this seemed smoother
		// orbOutput.x = convertAxisToPercent(Math.pow(ball.axes[0], 3));
		// orbOutput.y = convertAxisToPercent(Math.pow(ball.axes[1], 3));
		// orbOutput.z = convertAxisToPercent(Math.pow(ball.axes[2], 3));
		// orbOutput.rx = convertAxisToPercent(Math.pow(ball.axes[3], 3));
		// orbOutput.ry = convertAxisToPercent(Math.pow(ball.axes[4], 3));
		// orbOutput.rz = convertAxisToPercent(Math.pow(ball.axes[5], 3));

		orbOutput.x = convertAxisToPercent(ball.axes[0]);
		orbOutput.y = convertAxisToPercent(ball.axes[1]);
		orbOutput.z = convertAxisToPercent(ball.axes[2]);
		orbOutput.rx = convertAxisToPercent(ball.axes[3]);
		orbOutput.ry = convertAxisToPercent(ball.axes[4]);
		orbOutput.rz = convertAxisToPercent(ball.axes[5]);
		
		buttonOutput = 0;
		for(var i = 0; i < 16; i++){
			buttonOutput += (ball.buttons[i].value) << i;
		}
	}
	else {
		orbOutput.x = 0;
		orbOutput.y = 0;
		orbOutput.z = 0;
		orbOutput.rx = 0;
		orbOutput.ry = 0;
		orbOutput.rz = 0;

		buttonOutput = 0;
	}
}

function loadConnectStatement() {
	//todo, tell user they serial port must be used in this case
	//or not to do?

	//this is temp
	connectWithSerial();
}

// const filtersSerail = [{usbVendorId: 0x15DE, usbProductId: 0xAAAA}];
var port;

var lineReader;
var reader;
var serialScanner;
// var promisedPort;
function connectWithSerial() {

	var promisedPort = navigator.serial.requestPort();


	promisedPort.then(
		(successMessage) => {
			console.log("Device connected over serial port");
			port = successMessage;
			var connection = port.open({ baudRate: 115200 });
			connection.then(
				(successMessage) => {
					reader = port.readable.getReader();
					ballConnected = true;
					connectedToSerial();
					serialRead();

				},
				(failMessage) => {
					ballConnected = false;
					window.alert("This device is already being used somewhere else");
					console.log("Device failed to connect");
				}
			);
		},
		(failMessage) => {
			ballConnected = false;
			window.alert("You did not select a device");
			console.log("Failed to find or connect to device");
		}
	);

}

var passingArray = [];

var d = new Date();
var pastTime = d.getTime();

// var publicPromise;
async function serialRead() {
	try {
		// console.log("HERE1");
		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				// |reader| has been canceled.
				console.log("Done");
				break;
			}
			// console.log(value);
			var tempArray = value;
			tempArray.forEach(appendNewData);

			passSerialToBallData();
		}
		console.log("Exiting");
	} catch (error) {
		console.log(error);
	} finally {
		reader.releaseLock();
	}

	// try {
	// 	console.log("HERE1");

	// 	publicPromise = reader.read().then(
	// 		(successMessage) => {
	// 			console.log("HERE2");
	// 			var tempArray = successMessage.value;
	// 			tempArray.forEach(appendNewData);

	// 			if (port.readable) {
	// 				serialRead();
	// 			}

	// 			passSerialToBallData();
	// 		},
	// 		(failMessage) => {
	// 			ballConnected = false;
	// 			disconnectedToSerial();
	// 			console.log("Device has either been disconnected or an error occured");
	// 		}
	// 	);
	// } catch (error) {
	// 	console.log(error);
	// }
}

function appendNewData(data, index, array) {
	passingArray.push(data);
}

function convertAxisToPercent(axis) {
	var ax = Math.round((axis) * 10000) / 10000;
	if (ax < 0.01 && ax > -0.01) {
		ax = 0;
	}
	return ax;
}

function passSerialToBallData() {
	while (passingArray.length >= 13) {

		var splitArray = new Uint8Array(13);
		console.log(splitArray);
		for (var i = 0; i < 12; i++) {
			splitArray[i] = passingArray.shift();
		}
		console.log(splitArray);

		var convertArray = new Int16Array(6);
		if (splitArray[12] == 0) {
			console.log("its not this one");
			for (var i = 0; i < 12; i += 2) {
				convertArray[i / 2] = (splitArray[i + 1] << 8) + splitArray[i];
			}
		}

		orbOutput.x = convertAxisToPercent(convertArray[0] / 32766);
		orbOutput.y = convertAxisToPercent(convertArray[1] / 32766);
		orbOutput.z = convertAxisToPercent(convertArray[2] / 32766);
		orbOutput.rx = convertAxisToPercent(convertArray[3] / 32766);
		orbOutput.ry = convertAxisToPercent(convertArray[4] / 32766);
		orbOutput.rz = convertAxisToPercent(convertArray[5] / 32766);
	}
}



var mode = modeTest();

if (mode == 0) {
	document.getElementById("unsupported").style.visibility = "visible";
}
else if (mode == 1) {
	document.getElementById("conDevice").style.visibility = "visible";
}
else if (mode == 2) {
	document.getElementById("conDevice").style.visibility = "visible";
}

document.getElementById("demo").style.visibility = "visible";

function serialConnected() {
	document.getElementById("serialCon").style.visibility = "hidden";
	//document.getElementById("displayHorizontal").style.visibility = "visible";
	showDisplay();
}

function serialDisonnected() {
	//document.getElementById("displayHorizontal").style.visibility = "hidden";
	//document.getElementById("displayVertical").style.visibility = "hidden";
	hideDisplays();
	document.getElementById("conDevice").style.visibility = "visible";
}

connectedToSerial = serialConnected;

disconnectedToSerial = serialDisonnected;

window.addEventListener("gamepadconnected", (event) => {
	var gamepadData = event.gamepad;
	console.log("A gamepad was connected:");
	console.log("Gamepad Object");
	console.log(gamepadData);
	console.log("Gamepad Axes");
	console.log(gamepadData.axes);
});


var numberFormat = new Intl.NumberFormat(navigator.language, { minimumIntegerDigits: 1, minimumFractionDigits: 1, maximumFractionDigits: 1 });
var domX = document.getElementsByName("X");
var domY = document.getElementsByName("Y");
var domZ = document.getElementsByName("Z");
var domRX = document.getElementsByName("RX");
var domRY = document.getElementsByName("RY");
var domRZ = document.getElementsByName("RZ");
var interval;

function loadOrbValues(object, index, array) {
	// console.log(this);
	object.innerHTML = numberFormat.format(this * 100);
}

function pollGamepads() {
	var gamepads = navigator.getGamepads();
	// console.log(mode);
	// console.log(gamepads.length);
	if (mode == -1) {
		clearInterval(interval);
		hideDisplays();
		document.getElementById("serialCon").style.visibility = "hidden";
		document.getElementById("conDevice").style.visibility = "hidden";
		document.getElementById("unkownError").style.visibility = "visible";
	}

	if (gamepads.length != 0) {
		domX.forEach(loadOrbValues, orbOutput.x);
		domY.forEach(loadOrbValues, orbOutput.y);
		domZ.forEach(loadOrbValues, orbOutput.z);
		domRX.forEach(loadOrbValues, orbOutput.rx);
		domRY.forEach(loadOrbValues, orbOutput.ry);
		domRZ.forEach(loadOrbValues, orbOutput.rz);
	}
}

if (mode > 0) {
	interval = setInterval(pollGamepads, 10);
}
window.addEventListener("gamepadconnected", (event) => {
	if (mode == 1) {
		if (event.gamepad.id.includes("Tekuma") || event.gamepad.id.includes("ROV Control")) {
			document.getElementById("conDevice").style.visibility = "hidden";
			//document.getElementById("displayHorizontal").style.visibility = "visible";
			showDisplay();
		}
	}
	else if (mode == 2) {
		document.getElementById("serialCon").style.visibility = "visible";
		document.getElementById("conDevice").style.visibility = "hidden";
	}
});
window.addEventListener("gamepaddisconnected", (event) => {
	if (mode == 1) {
		if (event.gamepad.id.includes("Tekuma") || event.gamepad.id.includes("ROV Control")) {
			document.getElementById("conDevice").style.visibility = "visible";
			//document.getElementById("displayHorizontal").style.visibility = "hidden";
			hideDisplays();
		}
	}
	if (mode == 2) {
		document.getElementById("conDevice").style.visibility = "visible";
		document.getElementById("serialCon").style.visibility = "hidden";
		//document.getElementById("displayHorizontal").style.visibility = "hidden";
		hideDisplays();
	}
});

window.matchMedia("(orientation: landscape)").addListener(showDisplay);

function showDisplay() {
	if (ballConnected) {
		if (window.matchMedia("(orientation: landscape)").matches) {
			showHorizontalDisplay();
		}
		else {
			showVerticalDisplay();
		}
	}
}

function showHorizontalDisplay() {
	document.getElementById("displayHorizontal").style.visibility = "visible";
	document.getElementById("displayVertical").style.visibility = "hidden";
}

function showVerticalDisplay() {
	document.getElementById("displayHorizontal").style.visibility = "hidden";
	document.getElementById("displayVertical").style.visibility = "visible";
}

function hideDisplays() {
	document.getElementById("displayHorizontal").style.visibility = "hidden";
	document.getElementById("displayVertical").style.visibility = "hidden";
}