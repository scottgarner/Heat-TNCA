"use strict";

let simulateClicks = false;

let notesDatas = [
    ["C3", "E3", "G3", "C4", "E4", "G4"],
    ["C3", "D#3", "G3", "C4", "D#4", "G4"],
    ["C3", "D#3", "F#3", "C4", "D#4", "F#4"],
    ["C3", "E3", "G#3", "C4", "E4", "G#4"],
]

let synths = [];

let container;
let columns, rows;

let sequence;
let synth, notes;

let currentColumnIndex = 0;

let info;
let clickCount = 0;

(function () {

    // Parameters
    const params = (new URL(document.location)).searchParams;

    let paddingTop = params.get("paddingTop") || 10;
    let paddingBottom = params.get("paddingBottom") || 10;

    let bpm = params.get("bpm") || 128;

    columns = params.get("columns") || 16;
    rows = 7;

    // Click counter.

    info = document.getElementById('info');
    setInterval(() => {
        info.innerHTML = clickCount;
        clickCount = 0;
    }, 1000);

    // Container Setup.

    container = document.getElementById('main');
    container.style.top = paddingTop + "%";
    container.style.bottom = paddingBottom + "%";

    // Event listeners.

    heat.addEventListener('grid', (e) => {
        let gridX = ((parseInt(e.detail.x) + currentColumnIndex + 1) % columns);
        let gridY = parseInt(e.detail.y);

        let column = container.childNodes[gridX];
        let row = column.childNodes[gridY];

        if (row != null) {
            row.click();
            clickCount++;
        }
    });

    heat.addEventListener('click', (e) => {
        const x = parseInt(e.detail.x * window.innerWidth);
        const y = parseInt(e.detail.y * window.innerHeight);

        var element = document.elementFromPoint(x, y);
        if (element != null && container.contains(element)) {
            element.click();
            clickCount++;
        }
    });

    // Synth setup.
    createSynths()

    setNotes(0);
    setSynth(0);

    // Sequence setup.
    sequence = new Tone.Sequence(triggerColumn, [], "8n");

    // Grid setup.
    setSteps(columns);

    // Start sequence.

    sequence.start(0);
    sequence.probability = 1; //.5;

    // Tone setup.

    setBPM(bpm);
    Tone.Transport.start();

    // Commands
    configureShortcuts();

    // Draw config.
    drawConfig();

    // Main animation loop.
    window.requestAnimationFrame(update);
})();


//
// Trigger sequencer column.
//

function triggerColumn(time, columnIndex) {
    let currentColumn = container.childNodes[columnIndex];
    currentColumnIndex = columnIndex;

    // Vote for new active column.

    let rowWinnerIndex = null;
    let rowVotes = 0;

    for (let rowIndex = 0; rowIndex < currentColumn.childNodes.length; rowIndex++) {
        let currentRow = currentColumn.childNodes[rowIndex];

        if (currentRow.dataset.clickCount > rowVotes) {
            rowVotes = currentRow.dataset.clickCount;
            rowWinnerIndex = rowIndex;
        }

        currentRow.dataset.clickCount = 0;
    }

    // Update active row based on vote.

    if (rowWinnerIndex != null) {
        for (let rowIndex = 0; rowIndex < currentColumn.childNodes.length; rowIndex++) {
            let currentRow = currentColumn.childNodes[rowIndex];
            if (rowIndex == rowWinnerIndex) {
                currentRow.dataset.active = 1;
            } else {
                currentRow.dataset.active = 0;
            }
        }
    }

    // Trigger active row.

    for (let rowIndex = 0; rowIndex < currentColumn.childNodes.length; rowIndex++) {
        let currentRow = currentColumn.childNodes[rowIndex];
        if (parseInt(currentRow.dataset.active) == 1) {
            let note = notes[rowIndex];
            if (note) synth.triggerAttackRelease(note, "4n");
            break;
        }
    }

    //

    Tone.Draw.schedule(function () {
        for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
            let column = container.childNodes[columnIndex]

            if (column == currentColumn) {
                column.classList.add('columnActive');
            } else {
                column.classList.remove('columnActive');
            }

            for (let rowIndex = 0; rowIndex < column.childNodes.length; rowIndex++) {
                let row = column.childNodes[rowIndex];
                if (parseInt(row.dataset.active) == 1) {
                    row.classList.add('cellActive');
                } else {
                    row.classList.remove('cellActive');
                }
            }
        }
    }, time);

}

//
// Config drawing and methods.
//

function drawConfig() {

    const buttons = document.getElementsByTagName("button");
    Array.from(buttons).forEach(function (button) {
        button.addEventListener('click', function () {
            const dataType = button.dataset.type;
            const dataValue = parseInt(button.dataset.value);

            switch (dataType) {
                case 'setSynth':
                    setSynth(dataValue);
                    break;
                case 'setNotes':
                    setNotes(dataValue);
                    break;
                case 'setBPM':
                    setBPM(dataValue);
                    break;
                case 'setSteps':
                    setSteps(dataValue);
                    break;
                case 'togglePlay':
                    togglePlay();
                    break;
                case 'clearGrid':
                    clearGrid();
                    break;
            }
        });
    });
}

function togglePlay() {
    console.log("Play/Pause");

    if (Tone.Transport.state == 'paused') {
        Tone.Transport.start();
    } else {
        Tone.Transport.pause();
    }
}

function clearGrid() {
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        let column = container.childNodes[columnIndex];
        for (let rowIndex = 0; rowIndex < column.childNodes.length; rowIndex++) {
            let row = column.childNodes[rowIndex];
            row.dataset.clickCount = 0;
            row.dataset.active = 0;
        }
    }
}

function setSynth(synthIndex) {
    console.log("Setting synth: " + synthIndex);
    synth = synths[synthIndex];
}

function setNotes(notesIndex) {
    notes = notesDatas[notesIndex];
}

function setBPM(bpm) {
    Tone.Transport.bpm.value = bpm;
}

function setSteps(newColumnCount) {
    columns = newColumnCount;

    //

    sequence.removeAll();
    for (let i = 0; i < columns; i++) {
        sequence.add(i, i);
    }

    sequence.loopEnd = sequence.subdivision * columns;

    //

    drawGrid(rows, columns);
}

//
// Grid generation.
//

function drawGrid(rowCount, columnCount) {

    //  Grid setup.
    container.innerHTML = '';

    for (let x = 0; x < columnCount; x++) {

        let column = document.createElement('div');
        column.classList.add('column');
        container.appendChild(column);

        for (let y = 0; y < rowCount; y++) {

            let cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add('cellInactive');
            column.appendChild(cell);

            cell.dataset.clickCount = 0;
            cell.dataset.clickTime = 0;
            cell.dataset.active = 0;

            let meter = document.createElement('div');
            meter.classList.add('meter');
            cell.appendChild(meter);

            let border = document.createElement('div');
            border.classList.add('cellBorder');
            cell.appendChild(border);

            cell.addEventListener('click', function () {
                if (Tone.context.state !== 'running') {
                    Tone.context.resume();
                }

                cell.dataset.clickCount++;
                cell.dataset.clickTime = Date.now();
            });
        }
    }
}

//
// Main loop.
//

function update(timestamp) {

    // Simulate clicks.

    if (simulateClicks) {
        const x = parseInt(Math.random() * window.innerWidth);
        const y = parseInt(Math.random() * window.innerHeight);

        var element = document.elementFromPoint(x, y);

        if (element != null && container.contains(element)) {
            element.click();
        }
    }

    // update meters;

    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        let column = container.childNodes[columnIndex]
        let totalClicks = 0;

        // Total tally.
        for (let rowIndex = 0; rowIndex < column.childNodes.length; rowIndex++) {
            let row = column.childNodes[rowIndex];
            totalClicks = totalClicks + parseInt(row.dataset.clickCount);
        }

        // Set percentages.
        for (let rowIndex = 0; rowIndex < column.childNodes.length; rowIndex++) {

            let row = column.childNodes[rowIndex];
            let percentage;

            if (totalClicks > 0) {
                percentage = row.dataset.clickCount / totalClicks;
            }
            else {
                percentage = 0;
            }

            let meter = row.childNodes[0];
            meter.style.height = (percentage * 100) + "%";


            //

            let border = row.childNodes[1];
            let clickAge = Date.now() - row.dataset.clickTime;
            if (clickAge < 250) {
                let decay = 1 - (clickAge / 250);
                border.style.opacity = 1;
            } else {
                border.style.opacity = null;
            }
        }
    }

    window.requestAnimationFrame(update);
}


//
// Create synths.
//

function createSynths() {

    synths = [];

    synths[0] = new Tone.MonoSynth({
        "volume": -1,
        "portamento": 0,
        "oscillator": {
            "type": "sawtooth"
        },
        "filter": {
            "Q": 2,
            "type": "bandpass",
            "rolloff": -24
        },
        "envelope": {
            "attack": 0.01,
            "decay": 0.1,
            "sustain": 0.2,
            "release": 0.6
        },
        "filterEnvelope": {
            "attack": 0.02,
            "decay": 0.4,
            "sustain": 1,
            "release": 0.7,
            "releaseCurve": "linear",
            "baseFrequency": 20,
            "octaves": 5
        }
    }).toMaster();

    synths[1] = new Tone.MonoSynth({
        "volume": -12,
        "portamento": 0,
        "oscillator": {
            "type": "fmsquare5",
            "modulationType": "triangle",
            "modulationIndex": 2,
            "harmonicity": 0.501
        },
        "filter": {
            "Q": 1,
            "type": "lowpass",
            "rolloff": -24
        },
        "envelope": {
            "attack": 0.01,
            "decay": 0.1,
            "sustain": 0.4,
            "release": 2
        },
        "filterEnvelope": {
            "attack": 0.01,
            "decay": 0.1,
            "sustain": 0.8,
            "release": 1.5,
            "baseFrequency": 50,
            "octaves": 4.4
        }
    }).toMaster();

    synths[2] = new Tone.MonoSynth({
        "volume": -12,
        "portamento": 0,
        "oscillator": {
            "type": "custom",
            "partials": [
                2,
                1,
                3,
                2,
                0.4
            ]
        },
        "filter": {
            "Q": 4,
            "type": "lowpass",
            "rolloff": -48
        },
        "envelope": {
            "attack": 0.04,
            "decay": 0.06,
            "sustain": 0.4,
            "release": 1
        },
        "filterEnvelope": {
            "attack": 0.01,
            "decay": 0.1,
            "sustain": 0.6,
            "release": 1.5,
            "baseFrequency": 50,
            "octaves": 3.4
        }
    }).toMaster();

    synths[3] = new Tone.MembraneSynth({
        "volume": -12,
        "envelope": {
            "sustain": 0.1,
            "attack": 0.005,
            "decay": 0.8
        },
        "octaves": 5,
        oscillator: {
            "detune": -1200
        }
    }).toMaster();

}

//
// Keyboard shorcuts.
//

function configureShortcuts() {
    document.addEventListener('keydown', (event) => {
        const keyName = event.key;

        if (event.key === '1') {
            setSynth(0);
        }
        if (event.key === '2') {
            setSynth(1);
        }
        if (event.key === '3') {
            setSynth(2);
        }
        if (event.key === '4') {
            setSynth(3);
        }

        if (event.key === 'q') {
            setNotes(0);
        }
        if (event.key === 'w') {
            setNotes(1);
        }
        if (event.key === 'e') {
            setNotes(2);
        }
        if (event.key === 'r') {
            setNotes(3);
        }

        if (event.key === 'a') {
            setBPM(30);
        }
        if (event.key === 's') {
            setBPM(60);
        }
        if (event.key === 'd') {
            setBPM(90);
        }
        if (event.key === 'f') {
            setBPM(120);
        }

        if (event.key === 'j') {
            setSteps(8);
        }
        if (event.key === 'k') {
            setSteps(16);
        }
        if (event.key === 'l') {
            setSteps(32);
        }

        if (event.key == 'g') {
            simulateClicks = !simulateClicks;
        }

        if (event.key === 'p') {
            togglePlay();
        }

        if (event.key === 'c') {
            clearGrid();
        }

        if (event.key === 'x') {
            for (let i = 0; i < 3000; i++) {

                const x = parseInt(Math.random() * window.innerWidth);
                const y = parseInt(Math.random() * window.innerHeight);

                var element = document.elementFromPoint(x, y);
                if (element != null && container.contains(element)) {
                    element.click();
                }
            }
        }

    }, false);
}