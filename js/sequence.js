"use strict";

let config = {
    synthIndex: 0,
    scaleIndex: 0,
    bpm: 90,
    steps: 16,
    rows: 7,
    simulateClicks: false,
    autoTally: true,
    paddingTop: 0,
    paddingBottom: 0
}

class Sequence {

    constructor() {
        this.sequence = this;

        this.synths = [];
        this.scales = [
            ["C3", "E3", "G3", "C4", "E4", "G4"],
            ["C3", "D#3", "G3", "C4", "D#4", "G4"],
            ["C3", "D#3", "F#3", "C4", "D#4", "F#4"],
            ["C3", "E3", "G#3", "C4", "E4", "G#4"],
        ]

        this.synth;
        this.notes;

        this.currentColumnIndex = 0;
        this.clickCount = 0;

        this.userInterface = new UserInterface(this);

        // Override config parameters from URL.
        const params = (new URL(document.location)).searchParams;

        Object.keys(config).forEach(configItem => {
            let value = params.get(configItem);
            if (value != null) {
                config[configItem] = value;
            }
        });

        // Click counter.

        this.info = document.getElementById('info');
        setInterval(() => {
            this.info.innerHTML = this.clickCount;
            this.clickCount = 0;
        }, 1000);

        // Container Setup.

        this.container = document.getElementById('main');
        this.container.style.top = config.paddingTop + "%";
        this.container.style.bottom = config.paddingBottom + "%";

        // Event listeners.

        heat.addEventListener('grid', (e) => {
            let gridX = ((parseInt(e.detail.x) + currentColumnIndex + 1) % config.steps);
            let gridY = parseInt(e.detail.y);

            let column = this.container.childNodes[gridX];
            let row = column.childNodes[gridY];

            if (row != null) {
                row.click();
                this.clickCount++;
            }
        });

        heat.addEventListener('click', (e) => {
            const x = parseInt(e.detail.x * window.innerWidth);
            const y = parseInt(e.detail.y * window.innerHeight);

            var element = document.elementFromPoint(x, y);
            if (element != null && this.container.contains(element)) {
                element.click();
                this.clickCount++;
            }
        });

        // Sequence setup.
        this.sequence = new Tone.Sequence((time, index) => { this.triggerColumn(time, index); }, [], "8n");

        // Synth setup.
        this.createSynths()

        this.setNotes(config.scaleIndex);
        this.setSynth(config.synthIndex);

        // Grid setup.
        this.setSteps(config.steps);

        // Tone setup.
        this.setAutoTally(config.autoTally);
        this.setBPM(config.bpm);

        // Start sequence.
        this.sequence.start(0);
        this.togglePlay();

        // Main animation loop.
        window.requestAnimationFrame((timestamp) => { this.update(timestamp) });
    }

    //
    // Trigger sequencer column.
    //

    tallyColumn(currentColumn) {

        // Vote for new active row.

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

    }

    tallyColumns() {
        for (let columnIndex = 0; columnIndex < config.steps; columnIndex++) {
            let column = this.container.childNodes[columnIndex]
            this.tallyColumn(column);
        }
    }

    triggerColumn(time, columnIndex) {
        let currentColumn = this.container.childNodes[columnIndex];
        this.currentColumnIndex = columnIndex;

        if (config.autoTally) {
            this.tallyColumn(currentColumn);
        }

        // Trigger active row.

        for (let rowIndex = 0; rowIndex < currentColumn.childNodes.length; rowIndex++) {
            let currentRow = currentColumn.childNodes[rowIndex];
            if (parseInt(currentRow.dataset.active) == 1) {
                let note = this.notes[rowIndex];
                if (note) this.synth.triggerAttackRelease(note, "4n");
                break;
            }
        }

        //

        Tone.Draw.schedule(() => { this.userInterface.refreshGrid(currentColumn) }, time);

    }

    togglePlay() {
        console.log("Play/Pause");

        if (Tone.Transport.state != 'started') {
            Tone.Transport.start();
        } else {
            Tone.Transport.pause();
        }

        this.userInterface.updateButtons("togglePlay", Tone.Transport.state != 'paused');
    }

    clearGrid() {
        for (let columnIndex = 0; columnIndex < config.steps; columnIndex++) {
            let column = this.container.childNodes[columnIndex];
            for (let rowIndex = 0; rowIndex < column.childNodes.length; rowIndex++) {
                let row = column.childNodes[rowIndex];
                row.dataset.clickCount = 0;
                row.dataset.active = 0;
            }
        }
    }

    setAutoTally(value) {
        config.autoTally = value;
        this.userInterface.updateButtons("toggleAutoTally", config.autoTally);
    }

    toggleAutoTally() {
        this.setAutoTally(!config.autoTally);
    }

    tallyNow() {
        this.tallyColumns();
    }

    setSynth(synthIndex) {
        this.userInterface.updateButtons("setSynth", synthIndex);
        this.synth = this.synths[synthIndex];
    }

    setNotes(notesIndex) {
        this.userInterface.updateButtons("setNotes", notesIndex);
        this.notes = this.scales[notesIndex];
    }

    setBPM(bpm) {
        this.userInterface.updateButtons("setBPM", bpm);
        Tone.Transport.bpm.value = bpm;
    }

    setSteps(newColumnCount) {
        this.userInterface.updateButtons("setSteps", newColumnCount);
        config.steps = newColumnCount;

        //

        this.sequence.removeAll();
        for (let i = 0; i < config.steps; i++) {
            this.sequence.add(i, i);
        }

        this.sequence.loopEnd = this.sequence.subdivision * config.steps;

        //

        this.userInterface.drawGrid(config.rows, config.steps);
    }

    //
    // Main loop.
    //

    update(timestamp) {
        ``
        // Simulate clicks.

        if (config.simulateClicks) {
            const x = parseInt(Math.random() * window.innerWidth);
            const y = parseInt(Math.random() * window.innerHeight);

            var element = document.elementFromPoint(x, y);

            if (element != null && this.container.contains(element)) {
                element.click();
            }
        }

        // update meters;
        this.userInterface.refreshMeters();

        window.requestAnimationFrame((timestamp) => { this.update(timestamp) });
    }


    //
    // Create synths.
    //

    createSynths() {

        this.synths = [];

        this.synths[0] = new Tone.MonoSynth({
            volume: -12,
            oscillator: {
                type: "sine"
            },
            envelope: {
                "attack": 0.01,
                "decay": 0.1,
                "sustain": 0.2,
                "release": 0.6
            }
        }).toMaster();

        this.synths[1] = new Tone.MonoSynth({
            volume: -12,
            oscillator: {
                type: "triangle"
            },
            envelope: {
                "attack": 0.01,
                "decay": 0.1,
                "sustain": 0.2,
                "release": 0.6
            }
        }).toMaster();

        this.synths[2] = new Tone.MonoSynth({
            volume: -24,
            oscillator: {
                type: "square"
            },
            envelope: {
                "attack": 0.01,
                "decay": 0.1,
                "sustain": 0.2,
                "release": 0.6
            }
        }).toMaster();


        this.synths[3] = new Tone.MembraneSynth({
            "volume": -12,
            "envelope": {
                "attack": 0.01,
                "decay": 0.1,
                "sustain": 0.2,
                "release": 0.6
            },
            "octaves": 5,
            oscillator: {
                "detune": -1200
            }
        }).toMaster();

    }

}

(function () {
    window.sequence = new Sequence();
})();