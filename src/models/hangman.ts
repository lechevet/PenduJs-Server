export class Hangman {
    word: string;
    array: any;
    format: string;
    guesses: any;
    guessesCount: number;
    status: string;
    io: any;

    constructor(io: any) {
        this.word = "bonjour";
        this.array = [];
        for (let i = 0; i < this.word.length; i++) {
            this.array.push('_');
        }
        this.format = this.array.join(' ');
        this.guesses = [];
        this.guessesCount = 0;
        this.status = "player";
        this.io = io;
    }

    async startGame(): Promise<any> {
        this.io.on('connection', (socket) => {
            this.io.emit('game', this.getAttributes());
            socket.on('guessLetter', (letter) => {
              console.log(letter);
              this.io.emit('game', this.guessLetter(letter));
            });
          });
        return this.word;
    }

    getAttributes() {
        return {
            format: this.format,
            guesses: this.guesses,
            wrongGuessCount: this.guessesCount,
            status: this.isWinner(this.word, this.guesses)        }
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
        this.guesses = this.guesses.concat([letter]);
        this.guessesCount = this.wrongGuessCount(this.word, this.guesses);
        this.format = this.showGuess(this.word, this.guesses);
        
        return {
            format: this.format,
            guesses: this.guesses,
            wrongGuessCount: this.guessesCount,
            status: this.isWinner(this.word, this.guesses)
        }
    }
}