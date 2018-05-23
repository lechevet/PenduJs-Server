export class Hangman {
    word: string;
    array: any;
    format: string;
    guesses: any;
    guessesCount: number;
    status: string;

    constructor() {
        this.word = "bonjour";
        this.array = [];
        for (let i = 0; i < this.word.length; i++) {
            this.array.push('_');
        }
        this.format = this.array.join(' ');
        this.guesses = [];
        this.guessesCount = 0;
        this.status = "player";
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
        let newGuesses = this.guesses.concat([letter]);
        this.guesses = newGuesses;
        let newGuessCount = this.wrongGuessCount(this.word, newGuesses);
        this.guessesCount = newGuessCount;
        let showLetter = this.showGuess(this.word, newGuesses);
        
        return {
            format: showLetter,
            guesses: this.guesses,
            wrongGuessCount: this.guessesCount,
            status: this.isWinner(this.word, this.guesses)
        }
    }
}