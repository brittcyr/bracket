import forecast_init from './forecast_init.json';
import * as Papa from 'papaparse';
import { normalcdf, parse_row } from './utils';
import { PlayerSelections } from './player_selections';


export class Simulator {
    num_sims = 0;

    current_projections_type = "kenpom";
    kenpom = {};
    sagarin = {};
    bpi = {};
    fivethirtyeight = {};

    // A map that maps (team_a, team_b) to the current projection's odds of winning for team_a
    current_h2h_odds = {};

    player_selections: PlayerSelections[] = [];

    // A list of by round node locked games which are used in simulations.
    node_locked_rounds = [];

    // Hardcoded teams before the first round.
    round_0 = [
        'Purdue', 'Fairleigh Dickinson', 'Memphis', 'Florida Atlantic', 'Duke', 'Oral Roberts', 'Tennessee', 'Louisiana-Lafayette', 'Kentucky', 'Providence', 'Kansas State', 'Montana State', 'Michigan State', 'Southern California', 'Marquette', 'Vermont',
        'Alabama', 'Texas A&M-Corpus Christi', 'Maryland', 'West Virginia', 'San Diego State', 'College of Charleston', 'Virginia', 'Furman', 'Creighton', 'North Carolina State', 'Baylor', 'UC-Santa Barbara', 'Missouri', 'Utah State', 'Arizona', 'Princeton',
        'Houston', 'Northern Kentucky', 'Iowa', 'Auburn', 'Miami (FL)', 'Drake', 'Indiana', 'Kent State', 'Iowa State', 'Pittsburgh', 'Xavier', 'Kennesaw State', 'Texas A&M', 'Penn State', 'Texas', 'Colgate',
        'Kansas', 'Howard', 'Arkansas', 'Illinois', "Saint Mary's (CA)", 'Virginia Commonwealth', 'Connecticut', 'Iona', 'Texas Christian', 'Arizona State', 'Gonzaga', 'Grand Canyon', 'Northwestern', 'Boise State', 'UCLA', 'North Carolina-Asheville',
    ];
    payouts = [100000, 50000, 25000, 15000, 10000, 5000, 3000, 3000, 2500, 2500, 1000, 1000, 1000, 1000, 1000, 750, 750, 750, 750, 750, 750, 750, 750, 750, 750, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200]

    async read_files() {
        this.bpi = Object.fromEntries( forecast_init["genders"]["mens"]["teams"].map( x => [x.team, x.bpi]) );
        this.sagarin = Object.fromEntries( forecast_init["genders"]["mens"]["teams"].map( x => [x.team, x.sagarin]) );
        this.kenpom = Object.fromEntries( forecast_init["genders"]["mens"]["teams"].map( x => [x.team, x.pomeroy]) );
        this.fivethirtyeight = Object.fromEntries( forecast_init["genders"]["mens"]["teams"].map( x => [x.team, x.elo]) );

        const response = await fetch(`./leaderboard.csv`);
        const responseText = await response.text();
        let all_selections = [];
        const data = Papa.parse(responseText);

        for (const line of data.data) {
            const parsed = line as string[];
            const [Rank,EntryId,Username,Score,MaxPossibleScore,Winnings,Rd64,Rd32,Rd16,Rd8,Last4,Championship,Tiebreaker] = parsed;
            if (Rank === 'Rank' || parsed[0] === '' || !line) {
                continue;
            }

            const player_selection = new PlayerSelections(
                [
                    parse_row(Rd64),
                    parse_row(Rd32),
                    parse_row(Rd16),
                    parse_row(Rd8),
                    parse_row(Last4),
                    parse_row(Championship),
                ],
                Username
            );
            all_selections.push(player_selection);
        }
        this.player_selections = all_selections;
    }

    // Resets the number of sims and all of the profits and winrate on all of the player selections
    async reset() {
        this.num_sims = 0;
        this.current_h2h_odds = {};

        let current_projections = this.kenpom;
        if (this.current_projections_type == 'kenpom') {
          current_projections = this.kenpom;
        }
        if (this.current_projections_type == 'sagarin') {
          current_projections = this.sagarin;
        }
        if (this.current_projections_type == 'bpi') {
          current_projections = this.bpi;
        }
        if (this.current_projections_type == 'fivethirtyeight') {
          current_projections = this.fivethirtyeight;
        }

        for (let team_a of this.round_0) {
            for (let team_b of this.round_0) {
                // @ts-ignore
                let proj_a = current_projections[team_a];
                // @ts-ignore
                let proj_b = current_projections[team_b];

                const winrate = normalcdf(0, 11, proj_a - proj_b);
                // @ts-ignore
                this.current_h2h_odds[team_a + ' ' + team_b] = winrate;
            }
        }
    }

    do_sim_and_score() {
        // Run a simulation of the tournament
        const round_of_64_results = this.sim_round(this.round_0);
        const round_of_32_results = this.sim_round(round_of_64_results);
        const round_of_16_results = this.sim_round(round_of_32_results);
        const round_of_8_results = this.sim_round(round_of_16_results);
        const round_of_4_results = this.sim_round(round_of_8_results);
        const round_of_2_results = this.sim_round(round_of_4_results);

        const all_rounds = [
            round_of_64_results,
            round_of_32_results,
            round_of_16_results,
            round_of_8_results,
            round_of_4_results,
            round_of_2_results,
        ]
        // Get all of the scores from all of the brackets and store locally in a tuple
        const scores_by_user = this.player_selections.map((player_selection) => {
            return {username: player_selection.username, score: player_selection.score_bracket(all_rounds)};
        });

        // Rank the scores
        const scores = scores_by_user.map((score_by_user) => { return score_by_user.score});
        const sorted_scores = scores.sort((n1,n2) => n2 - n1);

        const pay_by_score = {};
        for (let i = 0; i < sorted_scores.length; i++) {
            let payout_for_score = i < this.payouts.length ? this.payouts[i] : 0;
            // @ts-ignore
            pay_by_score[sorted_scores[i]] = payout_for_score;
        }

        // Do payouts
        for (let i = 0; i < scores_by_user.length; i++) {
            const score_by_user = scores_by_user[i];
            // @ts-ignore
            const payout_for_user = pay_by_score[score_by_user.score];

            this.player_selections[i].profit += payout_for_user;
            this.player_selections[i].wins += payout_for_user === 100_000 ? 1 : 0;
        }

        this.num_sims += 1;
    }

    // Returns True if team_a wins and False if team_b wins
    sim_matchup(team_a: string, team_b: string) {
        // @ts-ignore
        const odds = this.current_h2h_odds[team_a + ' ' + team_b];

        return Math.random() < odds;
    }

    sim_round(previous_round: string[]) {
        let result: string[] = [];
        for (let i = 0; i < previous_round.length; i += 2) {
            const team_a = previous_round[i];
            const team_b = previous_round[i + 1];
            if (this.sim_matchup(team_a, team_b)) {
                result.push(team_a);
            } else {
                result.push(team_b);
            }
        }
        return result;
    }
}