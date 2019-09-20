"use strict";

let simulateClicks = false;

let notesDatas = [

    ["C3", "E3", "G3", "C4", "E4", "G4"],
    ["C3", "D#3", "G3", "C4", "D#4", "G4"],
    ["C3", "D#3", "F#3", "C4", "D#4", "F#4"],
    ["C3", "E3", "G#3", "C4", "E4", "G#4"],
]

let synthDatas = [
    {
        oscillator: {
            type: "sine"
        },
        envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 1
        },
        volume: -12
    },
    {
        oscillator: {
            type: "square"
        },
        envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 1
        },
        volume: -12
    },
    {
        oscillator: {
            type: "triangle"
        },
        envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 1
        },
        volume: -12
    },
    {
        oscillator: {
            type: "sawtooth"
        },
        envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 1
        },
        volume: -12
    }
];

(function () {

    // Parameters

    const params = (new URL(document.location)).searchParams;

    let paddingTop = params.get("paddingTop") || 10;
    let paddingBottom = params.get("paddingBottom") || 10;

    let bpm = params.get("bpm") || 128;
    let columns = params.get("columns") || 8;
    let rows = 7;


    let clickTally = 0;
    let clickTallyContainer = document.getElementById('clickTally');


    // Container Setup.

    const container = document.getElementById('container');
    container.style.top = paddingTop + "%";
    container.style.bottom = paddingBottom + "%";

    // Event listeners.

    heat.addEventListener('grid', (e) => {
        console.log(e.detail);
    });

    heat.addEventListener('click', (e) => {
        const x = parseInt(e.detail.x * window.innerWidth);
        const y = parseInt(e.detail.y * window.innerHeight);

        var element = document.elementFromPoint(x, y);
        if (element != null) {
            element.click();
            clickTally++;
            clickTallyContainer.innerHTML = clickTally;
        }
    });

    // Synth setup.

    let notes = SetNotes(0);
    let synth = SetSynth(0);

    // Sequence setup.

    let currentColumn;
    let sequence = new Tone.Sequence(function (time, columnIndex) {
        currentColumn = container.childNodes[columnIndex];

        let rowWinnerIndex = null;
        let rowWinner = null;
        let rowVotes = 0;

        for (let rowIndex = 0; rowIndex < currentColumn.childNodes.length; rowIndex++) {
            let currentRow = currentColumn.childNodes[rowIndex];

            if (currentRow.dataset.clickCount > rowVotes) {
                rowVotes = currentRow.dataset.clickCount;
                rowWinnerIndex = rowIndex;
                rowWinner = currentRow;
            }

            currentRow.dataset.clickCount = 0;
        }

        if (rowWinnerIndex != null) {
            if (rowWinnerIndex < currentColumn.childNodes.length - 1) {
                synth.triggerAttackRelease(notes[rowWinnerIndex], "4n");
            }
            rowWinner.dataset.clickCount = 1;
        }

        Tone.Draw.schedule(function () {
            for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
                let column = container.childNodes[columnIndex]

                if (column == currentColumn) {
                    column.classList.add('columnActive');
                } else {
                    column.classList.remove('columnActive');
                }

                //

                for (let rowIndex = 0; rowIndex < column.childNodes.length; rowIndex++) {
                    let row = column.childNodes[rowIndex];

                    if (row.dataset.clickCount > 0) {
                        //row.classList.add('rowActive');
                    } else {
                        row.classList.remove('rowActive');
                    }
                }
            }
        }, time);

    }, [], "8n");

    // Grid setup.

    SetSteps(columns);

    // Start sequence.

    sequence.start(0);
    sequence.probability = 1; //.5;

    // Tone setup.

    SetBPM(bpm);
    Tone.Transport.start();

    // Commands

    document.addEventListener('keydown', (event) => {
        const keyName = event.key;

        if (event.key === '1') {
            if (synth != null) synth.dispose();
            synth = SetSynth(0);
        }
        if (event.key === '2') {
            if (synth != null) synth.dispose();
            synth = SetSynth(1);
        }
        if (event.key === '3') {
            if (synth != null) synth.dispose();
            synth = SetSynth(2);
        }
        if (event.key === '4') {
            if (synth != null) synth.dispose();
            synth = SetSynth(4);
        }

        if (event.key === 'q') {
            notes = SetNotes(0);
        }
        if (event.key === 'w') {
            notes = SetNotes(1);
        }
        if (event.key === 'e') {
            notes = SetNotes(2);
        }
        if (event.key === 'r') {
            notes = SetNotes(3);
        }

        if (event.key === 'a') {
            SetBPM(30);
        }
        if (event.key === 's') {
            SetBPM(60);
        }
        if (event.key === 'd') {
            SetBPM(90);
        }
        if (event.key === 'f') {
            SetBPM(120);
        }

        if (event.key === 'j') {
            SetSteps(8);
        }
        if (event.key === 'k') {
            SetSteps(16);
        }
        if (event.key === 'l') {
            SetSteps(32);
        }

        if (event.key == 'g') {
            simulateClicks = !simulateClicks;
        }

        if (event.key === 'p') {
            console.log("Play/Pause");

            if (Tone.Transport.state == 'paused') {
                Tone.Transport.start();
            } else {
                Tone.Transport.pause();
            }
        }

        if (event.key === 'c') {

            for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
                let column = container.childNodes[columnIndex];
                column.classList.remove('columnActive');

                //

                for (let rowIndex = 0; rowIndex < column.childNodes.length; rowIndex++) {
                    let row = column.childNodes[rowIndex];
                    row.dataset.clickCount = 0;
                    row.classList.remove('rowActive');
                }
            }

        }

        if (event.key === 'x') {
            for (let i = 0; i < 3000; i++) {


                const x = parseInt(Math.random() * window.innerWidth);
                const y = parseInt(Math.random() * window.innerHeight);

                var element = document.elementFromPoint(x, y);

                element.click();

            }
        }

    }, false);

    function SetSynth(synthIndex) {
        console.log("Setting synth " + synthIndex);
        let synthData = synthDatas[synthIndex];
        //return new Tone.MembraneSynth().toMaster();
        return new Tone.MonoSynth(synthData).toMaster();
    }

    function SetNotes(notesIndex) {
        return notesDatas[notesIndex];
    }

    function SetBPM(bpm) {
        Tone.Transport.bpm.value = bpm;
    }

    function SetSteps(newColumnCount) {
        columns = newColumnCount;

        //

        sequence.removeAll();
        for (let i = 0; i < columns; i++) {
            sequence.add(i, i);
        }

        sequence.loopEnd = sequence.subdivision * columns;

        //

        DrawGrid(rows, columns);
    }

    function DrawGrid(rowCount, columnCount) {

        //  Grid setup.
        container.innerHTML = '';

        for (let x = 0; x < columnCount; x++) {

            let column = document.createElement('div');
            column.classList.add('column');
            container.appendChild(column);

            for (let y = 0; y < rowCount; y++) {

                let cell = document.createElement('div');
                cell.classList.add('row');
                cell.classList.add('rowInactive');
                column.appendChild(cell);

                cell.dataset.clickCount = 0;
                cell.dataset.clickTime = 0;

                let meter = document.createElement('div');
                meter.classList.add('meter');
                cell.appendChild(meter);

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

    // Meter refresh loop.

    function update(timestamp) {

        // Simulate clicks.

        if (simulateClicks) {
            const x = parseInt(Math.random() * window.innerWidth);
            const y = parseInt(Math.random() * window.innerHeight);

            var element = document.elementFromPoint(x, y);

            element.click();
        }

        // Update meters;

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
                let percentage = row.dataset.clickCount / totalClicks;
                let meter = row.childNodes[0];
                meter.style.height = (percentage * 100) + "%";

                //

                let clickAge = Date.now() - row.dataset.clickTime;
                if (clickAge < 250) {
                    let decay = 1 - (clickAge / 250);
                    row.style.borderColor = "rgba(255,255,255," + decay + ")";
                } else {
                    row.style.borderColor = "#666666";
                }
            }
        }

        window.requestAnimationFrame(update);
    }
    window.requestAnimationFrame(update);

})();