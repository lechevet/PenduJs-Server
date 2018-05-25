import words from '../helpers/words';

export class Hangman {
    word: string;
    array: any;
    format: string;
    guesses: any;
    guessesCount: number;
    status: string;
    room: string;
    id: string;

    constructor(id: string) {
        this.initGame();
        this.id = id;
    }

    initGame() {
        this.word = words[Math.floor(Math.random() * words.length)];
        this.array = [];
        for (let i = 0; i < this.word.length; i++) {
            this.array.push('_');
        }
        this.format = this.array.join(' ');
        this.guesses = [];
        this.guessesCount = 0;
        this.status = "player";
    }

    async startGame(io, socket): Promise<any> {
        console.log(this.id);
        socket.join(this.id);
        this.emitGame(io, this.getAttributes());
        socket.on('guessLetter', (letter) => {
            this.emitGame(io, this.guessLetter(letter));
        });
        socket.on('start', () => {
            this.initGame();
            this.emitGame(io, this.getAttributes());
        });
        return this.word;
    }

    emitGame(io, res) {
        io.in(this.id).emit('game', res);
    }

    getAttributes() {
        let res:any = {
            format: this.format,
            guesses: this.guesses,
            wrongGuessCount: this.guessesCount,
            status: this.isWinner(this.word, this.guesses)
        }
        if (res.wrongGuessCount === 8) {
            res = {...res, word: this.word };
        }
        return res;
    }

    wrongGuessCount(word: string, guesses: any) {
        let failedGuess: any = [];
        for (let i = 0; i < guesses.length; i++) {
            let wrongGuess: any = guesses[i];
            if (word.indexOf(guesses[i]) === -1) {
                failedGuess.push(wrongGuess);
            }
        }
        return failedGuess.length;
    }

    showGuess(word: string, guesses: any) {
        let guessed: any = [];
        let letters: any = word.split("");
        for (let i = 0; i < letters.length; i++) {
            if (guesses.indexOf(letters[i]) !== -1) {
                guessed.push(letters[i]);
            } else {
                guessed.push("_");
            }
        }
        return guessed.join(" ");
    }

    isWinner(word: string, guesses: any) {
        let countWrong = this.wrongGuessCount(word, guesses);
        let secretWord = word.split("").join(" ");
        let correct = this.showGuess(word, guesses);
        if (countWrong < 8 && secretWord === correct) {
            return 'winner';
        } else if (countWrong < 8) {
            return 'player';
        } else {
            return 'loser';
        }
    }

    guessLetter(letter) {
        let res: any = {};
        if (this.guessesCount < 8) {
            this.guesses = this.guesses.concat([letter]);
            this.guessesCount = this.wrongGuessCount(this.word, this.guesses);
            this.format = this.showGuess(this.word, this.guesses); 
        }
        res = {
            format: this.format,
            guesses: this.guesses,
            wrongGuessCount: this.guessesCount,
            status: this.isWinner(this.word, this.guesses)
        }
        if (this.guessesCount === 8) {
            res = {...res, word: this.word};
        }

        return res;
    }
}
