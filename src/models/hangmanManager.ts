class HangmanManager {
    hangmanArray: any;

    constructor() {
        this.hangmanArray = [];
    }

    push(hangman: any) {
        this.hangmanArray.push(hangman);
    }
    
    get() {
        return this.hangmanArray;
    }
}

export default new HangmanManager();