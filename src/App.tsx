import React, { ChangeEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type CellElementProps = {
    id: number
    coordinates: {
        x: number
        y: number
    }
    isInitialAlive: boolean
    readonly: boolean
}

export type CellElementDataProps = CellElementProps & {
    isAlive: boolean
    setIsAlive: (alive: boolean) => void
}

export type CellElementRef = {
    getData: () => CellElementDataProps
}

const CELL_SIZE = 50

const DEFAULT_GRID_SIZE = 5

const CellElement = forwardRef<CellElementRef, CellElementProps>(({ readonly, id, coordinates, isInitialAlive }, ref) => {
    const [isAlive, setIsAlive] = useState(isInitialAlive)

    const toggleAlive = () => setIsAlive((prev) => !prev)

    useImperativeHandle(ref, () => {
        return {
            getData: () => ({
                coordinates,
                isInitialAlive,
                id,
                isAlive,
                setIsAlive,
                readonly,
            }),
        };
    }, [isAlive, readonly]);

    return (
        <div
            style={{
                height: `${CELL_SIZE}px`,
                width: `${CELL_SIZE}px`,
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: `${isAlive ? '#a15' : '#ddd'}`,
                cursor: readonly ? 'default' : 'pointer',
            }}
            onClick={readonly ? undefined : toggleAlive}
        >
            {coordinates.x}:{coordinates.y}
        </div>
    )
})

const App = () => {
    const [size, setSize] = useState(DEFAULT_GRID_SIZE)
    const [gridSize, setGridSize] = useState(0)
    const [cells, setCells] = useState<CellElementProps[]>([])
    const [executionTime, setExecutionTime] = useState(0)
    const [readonly, setReadonly] = useState(false)

    const cellRefs = useRef<(CellElementRef | null)[]>([])
    const callback = useRef<NodeJS.Timer>()

    const handleChangeSize = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
        setSize(parseInt(value))
    }

    const handleGenerate = (length: number) => {
        const cells: CellElementProps[] = [];

        for (let x = 0; x < length; x++) {
            for (let y = 0; y < length; y++) {
                cells.push({
                    isInitialAlive: false,
                    id: cells.length + 1,
                    coordinates: {
                        x,
                        y,
                    },
                    readonly: false,
                });
            }
        }

        setCells(cells)
        setGridSize(length * CELL_SIZE)
    }

    const makeCountAliveNeighbors = (cells: CellElementDataProps[]) => (x: number, y: number) => {
        let count = 0;
        const neighbors = [
            [-1, -1], // top left
            [-1, 0], // top
            [-1, 1], // top right
            [0, -1], // left
            [0, 1], // right
            [1, -1], // bottom left
            [1, 0], // bottom
            [1, 1] // bottom right
        ];
        for (let i = 0; i < neighbors.length; i++) {
            const [dx, dy] = neighbors[i];
            const nX = (x + dx + size) % size;
            const nY = (y + dy + size) % size;

            count += cells.find(({ coordinates: { x, y } }) => x === nX && y === nY)?.isAlive ? 1 : 0;
        }
        return count;
    };

    const handleNewGeneration = useCallback(() => {
        const start = new Date().getTime()
        const cells = cellRefs.current.map((cell) => cell?.getData()) as CellElementDataProps[]
        const countAliveNeighbors = makeCountAliveNeighbors(cells)

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const neighbors = countAliveNeighbors(i, j);
                const currentCell = cells.find(({ coordinates: { x, y } }) => x === i && y === j)

                if (currentCell?.isAlive) {
                    currentCell?.setIsAlive(neighbors === 2 || neighbors === 3)
                } else {
                    currentCell?.setIsAlive(neighbors === 3)
                }
            }
        }

        const end = new Date().getTime()

        setExecutionTime(end - start)
    }, [size])

    const handleStart = useCallback(() => {
        setReadonly(true)

        callback.current = setInterval(handleNewGeneration, 1000)
    }, [handleNewGeneration])

    const handleStop = () => {
        setReadonly(false)
        clearInterval(callback.current)
    }

    const handleReset = () => {
        cellRefs.current.forEach((cell) => cell?.getData()?.setIsAlive(false))
    }

    const handleRandomSelect = () => {
        cellRefs.current.forEach((cell) => cell?.getData()?.setIsAlive(Math.random() <= 0.5))
    }

    useEffect(() => {
        handleGenerate(DEFAULT_GRID_SIZE)
    }, [])

    useEffect(() => {
        return () => clearInterval(callback.current)
    }, [])

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ marginRight: '8px', display: 'flex', flexDirection: 'column' }}>
                    <small style={{ fontSize: '12px', display: 'inline-block', marginBottom: '4px' }}>Grid Size</small>
                    <input
                        type="number"
                        name="size"
                        onChange={handleChangeSize}
                        value={size}
                        min={1}
                        disabled={readonly}
                    />
                </div>
                <div style={{ alignSelf: 'self-end', marginRight: '8px', }}>
                    <button disabled={readonly} onClick={() => handleGenerate(size)}>Generate</button>
                </div>
                <div style={{ alignSelf: 'self-end', marginRight: '8px', }}>
                    <button disabled={readonly} onClick={handleRandomSelect}>Random Select</button>
                </div>
                <div style={{ alignSelf: 'self-end', marginRight: '8px', }}>
                    <button disabled={readonly} onClick={handleReset}>Reset</button>
                </div>
                <div style={{ alignSelf: 'self-end' }}>
                    <button onClick={readonly ? handleStop : handleStart}>{readonly ? 'Stop' : 'Start'}</button>
                </div>
            </div>
            <div style={{ marginTop: '16px' }}>Execution Time: {executionTime}ms.</div>
            <div style={{ marginTop: '24px', height: '100%', width: `${gridSize}px` }}>
                {cells.map(({ id, ...rest }, i) => (
                    <CellElement
                        ref={el => cellRefs.current[i] = el}
                        key={id}
                        id={id}
                        {...rest}
                        readonly={readonly}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;
