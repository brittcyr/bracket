import React, { FC, useMemo } from 'react';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';

export type PlayerData = {
    name: string;
    ev: number;
    winrate: number;
}

interface SimulationResultsTableProps {
    data: PlayerData[];
}

const SimulationResultsTable: FC<SimulationResultsTableProps> = (props: SimulationResultsTableProps) => {
  const { data } = props;
  const columns = useMemo<MRT_ColumnDef<PlayerData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'ev',
        header: 'EV',
      },
      {
        accessorKey: 'winrate',
        header: 'Winrate',
      },
    ],
    [],
  );

  return (
    <MaterialReactTable
        columns={columns}
        data={data}
        enableFullScreenToggle={false}
        enableDensityToggle={false}
        enableHiding={false}
        initialState={{
          density: 'compact',
        }}
        muiTablePaginationProps={{
            showFirstButton: false,
            showLastButton: false,
        }}
    />
  );
};

export default SimulationResultsTable;