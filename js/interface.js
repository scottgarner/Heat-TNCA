"use strict";

class UserInterface {

    constructor(sequence) {
        this.sequence = sequence;
        this.configureButtons();
    }

    //
    // Grid generation.
    //

    drawGrid(rowCount, columnCount) {

        //  Grid setup.
        this.sequence.container.innerHTML = '';

        for (let x = 0; x < columnCount; x++) {

            let column = document.createElement('div');
            column.classList.add('column');
            this.sequence.container.appendChild(column);

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

    refreshGrid(currentColumn) {
        for (let columnIndex = 0; columnIndex < config.steps; columnIndex++) {
            let column = this.sequence.container.childNodes[columnIndex]

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
    }

    refreshMeters() {
        for (let columnIndex = 0; columnIndex < config.steps; columnIndex++) {
            let column = this.sequence.container.childNodes[columnIndex]
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

                // Fade border based on click age.

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

    }

    //
    // Update button state.
    //

    updateButtons(type, value) {
        var buttons = document.querySelectorAll("[data-type='" + type + "']");

        if (buttons.length == 1) {
            if (value == true) {
                buttons[0].classList.add('btn-warning');
            } else {
                buttons[0].classList.remove('btn-warning');
            }
        } else {
            buttons.forEach(function (button) {
                if (button.dataset.value == value) {
                    button.classList.add('btn-warning');
                } else {
                    button.classList.remove('btn-warning');
                }
            });
        }
    }

    //
    // Configure buttons and shortcuts.
    //

    configureButtons() {
        let commands = [];

        const buttons = document.getElementsByTagName("button");
        Array.from(buttons).forEach((button) => {

            const dataType = button.dataset.type;
            const dataValue = parseInt(button.dataset.value);
            const dataShortcut = button.dataset.shortcut;

            if (dataShortcut != null) {
                commands[dataShortcut] = () => {
                    this.triggerCommand(dataType, dataValue);
                };
            }

            button.addEventListener('click', (event) => {
                this.triggerCommand(dataType, dataValue);
            }, false);
        });

        //

        document.addEventListener('keydown', (event) => {
            const keyName = event.key;

            if (commands[event.key]) {
                commands[event.key]();
            }

            if (event.key == 'g') {
                config.simulateClicks = !config.simulateClicks;
            }

            if (event.key === 'x') {
                for (let i = 0; i < 3000; i++) {

                    const x = parseInt(Math.random() * window.innerWidth);
                    const y = parseInt(Math.random() * window.innerHeight);

                    var element = document.elementFromPoint(x, y);
                    if (element != null && this.sequence.container.contains(element)) {
                        element.click();
                    }
                }
            }

        }, false);
    }

    triggerCommand(dataType, dataValue) {

        switch (dataType) {
            case 'setSynth':
                this.sequence.setSynth(dataValue);
                break;
            case 'setNotes':
                this.sequence.setNotes(dataValue);
                break;
            case 'setBPM':
                this.sequence.setBPM(dataValue);
                break;
            case 'setSteps':
                this.sequence.setSteps(dataValue);
                break;
            case 'toggleAutoTally':
                this.sequence.toggleAutoTally();
                break;
            case 'togglePlay':
                this.sequence.togglePlay();
                break;
            case 'clearGrid':
                this.sequence.clearGrid();
                break;
            case 'tallyNow':
                this.sequence.tallyNow();
                break;
        }
    }
}