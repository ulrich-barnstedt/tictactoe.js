const readline = require("readline");

const msg = {
    pl1 : "Player 1 wins.",
    pl2 : "Player 2 wins.",
    tie : "Tie."
}
const chars = {
    "blank" : " ",
    "vertical" : "│",
    "joint" : "┼",
    "horizontal" : "─"
}
const playerIcons = ["XX", "OO"];

class Terminal {
    goto (x, y) {
        process.stdout.write('\u001B' + "[" + (y + 1) + ";" + (x + 1) + "H");
    }

    writeMultiple (str, count) {
        for (let i = 0; i < count; i++) {
            process.stdout.write(str + "\n");
        }
    }

    write (x, y, text) {
        this.goto(x, y);
        process.stdout.write(text);
    }

    assemble (arr) {
        if (!Array.isArray(arr)) return arr;

        let proc = arr.map((c) => {
            switch (typeof c) {
                case "string":
                    return c;
                case "object":
                    if (!Array.isArray(c)) break;
                    return this.assemble(c[0]).repeat(c[1]);
                default:
                    return "<obj>";
            }
        });

        return proc.join("");
    }

    playingField () {
        console.clear();

        let line = this.assemble([[[[chars.blank, 6], chars.vertical], 2], [chars.blank, 6]]);
        let junc = this.assemble([[[[chars.horizontal, 6], chars.joint], 2], [chars.horizontal, 6]]);
        let top = this.assemble([[[line, "\n"], 3], junc]);

        this.writeMultiple(top, 2);
        this.writeMultiple(line,3);
    }
}

class Logic {
    static calc (array) {
        let names = ["horizontal", "vertical", "diagonal", "tie"];
        for (let i = 0; i < names.length; i++) {
            let res = this[names[i]](array);
            if (res) return res;
        }

        return false;
    }

    static tie (array) {
        let udef = false;
        array.forEach(k => {
            k.forEach(l => {
                if (l === undefined) udef = true;
            })
        })

        if (!udef) return msg.tie;
        return false;
    }

    static vertical (array) {
        let win = false;

        array.forEach(l => {
            if (l.every(x => x === true)) win = msg.pl1;
            if (l.every(x => x === false)) win = msg.pl2;
        })

        return win;
    }

    static horizontal (array) {
        let tracker = Array(3).fill(0);

        for (let x = 0; x < array.length; x++) {
            for (let y = 0; y < array[x].length; y++) {
                if (array[x][y] === true) tracker[y]++;
                if (array[x][y] === false) tracker[y]--;
            }
        }

        for (let i = 0; i < tracker.length; i++) {
            if (tracker[i] === 3) return msg.pl1;
            if (tracker[i] === -3) return msg.pl2;
        }
        return false;
    }

    static diagonal (array) {
        let acc1 = 0;
        let acc2 = 0;

        for (let x = 0; x < array.length; x++) {
            if (array[x][x] === true) acc1++;
            if (array[x][x] === false) acc1--;
        }

        for (let x = 0; x < array.length; x++) {
            if (array[array.length - x - 1][x] === true) acc2++;
            if (array[array.length - x - 1][x] === false) acc2--;
        }

        if (acc1 === 3 || acc2 === 3) return msg.pl1;
        if (acc1 === -3 || acc2 === -3) return msg.pl2;
    }
}

class Game {
    constructor () {
        this.terminal = new Terminal();
        this.reset();
        this.initInput();
    }

    initInput () {
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);

        process.stdin.on("keypress", (str, key) => {
            if (key.sequence === '\u0003') {
                process.exit();
            }

            this.processInput(key);
        });
    }

    reset () {
        this.field = new Array(3).fill(undefined).map(() => new Array(3).fill(undefined));
        this.currentPlayer1 = true;

        this.terminal.playingField();
        this.updatePlayer();
    }

    endMsg (msg) {
        this.terminal.write(0, 13, msg);
    }

    updatePlayer () {
        this.terminal.write(
            0, 12,
            `Player: ${this.currentPlayer1 ? 1 : 2} (${this.currentPlayer1 ? playerIcons[0] : playerIcons[1]})`
        );
    }

    changeState (x, y) {
        if (this.field[x][y] !== undefined) return;
        this.field[x][y] = this.currentPlayer1;
        this.terminal.write(x * 7 + 2, y * 4 + 1, this.currentPlayer1 ? playerIcons[0] : playerIcons[1]);

        let result = Logic.calc(this.field);
        if (result) {
            this.endMsg(`Game result: ${result}`);
            return;
        }

        this.currentPlayer1 = !this.currentPlayer1;
        this.updatePlayer();
    }

    processInput (key) {
        let num = Number(key.name);
        if (isNaN(num)) return;
        num--;

        if (num === -1) {
            this.reset();
            return;
        }

        let y = Math.floor(num / 3);
        let x = num - y * 3;
        this.changeState(x, y);
    }
}

new Game();