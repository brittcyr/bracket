import { PlayerData } from "./SimulationResultsTable";
import { Simulator } from "./simulator";

export function doSims(simulator: Simulator) {
  const sims_to_do = simulator.num_sims < 1_000 ? 100 : 1_000;
  for (let i = 0; i < sims_to_do; i++) {
    simulator.do_sim_and_score();
  }

  const num_sims = simulator.num_sims;
  const mostRecentPlayerData = simulator.player_selections.map(
    (player_selection: any) => {
      return ({
        name: player_selection.username,
        ev: Math.floor(player_selection.profit / num_sims * 1_000) / 1_000,
        winrate: Math.floor(player_selection.wins / num_sims * 100_000) / 100_000,
      } as PlayerData);
    }
  );

  return { sims: num_sims, player_data: mostRecentPlayerData};
}