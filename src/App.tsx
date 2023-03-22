import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { createWorkerFactory, useWorker } from '@shopify/react-web-worker';
import React, { useState, useEffect } from 'react';
import './App.css';
import SimulationResultsTable, { PlayerData } from './SimulationResultsTable';
import { Simulator } from './simulator';

const createWorker = createWorkerFactory(() => import('./worker'));

function App() {
  const simulator = new Simulator();
  const worker = useWorker(createWorker);

  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [numSims, setNumSims] = useState<number>(0);
  const [rerun, setRerun] = useState<boolean>(false);

  const [projections, setProjections] = React.useState<string | null>('kenpom');

  const handleProjections = (
    event: React.MouseEvent<HTMLElement>,
    projections: string | null,
  ) => {
    if (projections) {
      simulator.reset().then();
      simulator.current_projections_type = projections;
      setRerun(!rerun);
      setProjections(projections);
    }
  };

  useEffect(() => {
    async function run_worker() {
      if (simulator.num_sims === 0) {
        await simulator.read_files();

        // TODO: set it to the
        await simulator.reset();
      }

      /*
        await worker.doSims(simulator);
        const webWorkerMessage = await worker.doSims(simulator);
        const { sims, player_data } = webWorkerMessage;
        setPlayerData(player_data);
        setNumSims(sims);
      */
      const sims_to_do = 100;
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
      setPlayerData(mostRecentPlayerData);
      setNumSims(num_sims);

      if (simulator.num_sims > 9_999) {
        return;
      }
      setTimeout(
        () => {
          run_worker().then();
        }, 1_000
      );
    }

    run_worker().then();
  }, [rerun]);

  return (
    <div className="App">
      <div>
        DK Onyx Bracket equity distribution.
      </div>
        Num sims: {numSims}
        <ToggleButtonGroup
          value={projections}
          exclusive
          onChange={handleProjections}
          aria-label="projection"
        >
          <ToggleButton value="kenpom" aria-label="left aligned">
            KenPom
          </ToggleButton>
          <ToggleButton value="sagarin" aria-label="centered">
            Sagarin
          </ToggleButton>
          <ToggleButton value="fivethirtyeight" aria-label="right aligned">
            FiveThirtyEight
          </ToggleButton>
        </ToggleButtonGroup>
        <SimulationResultsTable data={playerData} />
        Wait until 10,000 simulations finish. Then try switching projections.
        <div>
          Source code: 
          <a href="https://github.com/brittcyr/bracket"  target="_blank">
            https://github.com/brittcyr/bracket
          </a>

        </div>
    </div>
  );
}

export default App;
