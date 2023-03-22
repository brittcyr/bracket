

export class PlayerSelections {
    round_by_round_selections;
    username = '';
    profit = 0;
    wins = 0;

    constructor(round_by_round_selections: string[][], username: string) {
        this.round_by_round_selections = round_by_round_selections;
        this.username = username;
    }

    score_bracket(outcomes_by_round: string[][]) {
        // Hack in some random to make it easier to resolve ties.
        let score = Math.random();
        for (let round = 0; round < outcomes_by_round.length; round++) {
            let current_round_results = outcomes_by_round[round];
            let current_round_picks = this.round_by_round_selections[round];
            for (let index = 0; index < current_round_results.length; index++) {
                if (current_round_picks[index] === current_round_results[index]) {
                    score += 10 * 2 ** round;
                }
            }
        }
        return score;
    }
}