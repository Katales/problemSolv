'use strict';

import { WriteStream, createWriteStream } from "fs";
process.stdin.resume();
process.stdin.setEncoding('utf-8');

let inputString: string = '';
let inputLines: string[] = [];
let currentLine: number = 0;

process.stdin.on('data', function(inputStdin: string): void {
    inputString += inputStdin;
});

process.stdin.on('end', function(): void {
    inputLines = inputString.split('\n');
    inputString = '';

    main();
});

function readLine(): string {
    return inputLines[currentLine++];
}

/*
 * Complete the 'hanoi' function below.
 *
 * The function is expected to return an INTEGER.
 * The function accepts INTEGER_ARRAY posts as parameter.
 */

export function hanoi(posts: number[]): number {
      
    // ================= Types =================
    type Disks = Array<number>;
    type Split = Array<number>;

    type CostTable = Array<Array<number>>;

    type MoveDiskParams = {
        disk: number;
        toDisk?: number;
        fromRod?: number;
        toRod: number;
    };

    type MoveOptParams = {
        disk: number;
        toRod: number;
        childNode: MoveNode | null;
    };

    type MovingPlan = Array<MoveDiskParams>;

    type MoveRec = { 
        movePar?: MoveDiskParams, 
        gState: number[] 
    };

    // ================= Classes =================
    // --- **class GameBoard** --- represents the state of the rods and disks in the Tower of Hanoi problem.
    // It maintains the state in two structures:
    // 1. rods: An array where each index represents a rod and contains an array of disks on that rod.
    // 2. gState: An array where each index represents a disk by it's size(radius) and contains the rod number it is currently on.
    class GameBoard {
        gState: number[] = [];
        // nDisks: number; --- GETTER
        nRods: number;
        rods: Array<Disks>;
        moveTree: MoveTree;
        // the Table of MIN costs for disk group moves (see method description of fillCostDistrTables())
        // costTable: CostTable; --- GETTER
        private _costTable: CostTable;
        // Proxy for _costTable
        private _costTableProxy: CostTable; 
        // splitsTable
        private _splitsTable: Array<Array<Split>>;

        constructor(gState: number[], nRods: number) {
            if (!gState.length)
                throw new Error(
                `Cannot create GameBoard with given gState (posts) array. gState.length=${gState.length}`,
                );
            this.gState = [...gState];

            // Disks are numbered from 1 to nDisks
            // Add dummy value 'NaN' at index 0, so we can use the disk number as the index. (if it's not already there)
            if (!Number.isNaN(this.gState[0])) this.gState.unshift(NaN);

            this.nRods = nRods;
            // initialize rods array
            this.rods = Array.from({ length: nRods }, () => [0] as Disks); // add dummy disk to start from Ind 1
            // The rods are numbered from 1 to nRods,
            // With a dummy rod '[]' at index 0, we can use the rod number as the index
            this.rods.unshift([]); // add a dummy rod at index 0

            this.moveTree = new MoveTree(this);

            // populate rods array from gState
            for (let disk = this.nDisks!; disk > 0; disk--) {
                const rod: number = this.gState[disk];
                this.rods[rod]!.push(disk);
            }

            //initialize splitsTable
            this._splitsTable = Array.from( { length: nRods }, () => [] as number[][] );
            //initialize costTable
            this._costTable = Array.from({ length: nRods }, () => [] as number[]);
            this.fillCostDistrTables(nRods, this.nDisks);
            this._costTableProxy = this.initCostTableProxy();
        }

        // GETTER: nDisks - number of disks on GameBoard
        get nDisks() {
            return this.gState.length - 1; // minus dummy disk
        }
        
        // GETTER: costTable
        get costTable(): CostTable {
            return this._costTableProxy
        }

        initCostTableProxy(): number[][] {
            return new Proxy( this._costTable, {
                get: (costTable: number[][], rodNProp: string | symbol) => {
                    if (
                        typeof rodNProp !== "string" ||
                        ! Number.isInteger(Number(rodNProp)) 
                    ) 
                        return Reflect.get(costTable, rodNProp);

                    const rodN = Number(rodNProp);

                    return new Proxy( this._costTable[rodN], { 
                        get: (costTableRod: number[], diskNProp: string | symbol) => {
                            if (
                                typeof diskNProp !== "string" ||
                                ! Number.isInteger(Number(diskNProp)) ||
                                costTableRod[Number(diskNProp)]
                            ) 
                                return Reflect.get(costTableRod, diskNProp);

                            const diskN: number = Number(diskNProp);
                            if ( 
                                rodN < 1 ||
                                rodN >= this.nRods ||
                                rodN === 1 && diskN > 1 ||
                                diskN > this.nDisks ||
                                diskN <= rodN
                            ) 
                                return Reflect.get(costTableRod, diskNProp);

                            if ( rodN === 2) {
                                const prevCost: number = costTableRod[diskN - 1];
                                costTableRod[diskN] = (prevCost) ? prevCost*2 + 1 : Math.pow(2, diskN) - 1;
                            } else {
                                this.getDiskDistr(rodN, diskN);
                            };

                            return Reflect.get(costTableRod, diskNProp)
                        } 
                    }) // end of INNER (diskN) proxy
                }
            }) // end of OUTER (rodN) proxy
        }
        
        // Populate `Base Distribution` elements of _costTable & _splitsTable
        //   `Base Distribution` === costTable[rodN][diskN], where `rodN` is in [1..nRods-1], `diskN` is in [1..rodN]
        // Structure of _costTable & _splitsTable
        // first index:  `[1 .. nRods-1 ]` is the number of rods available for a group move.
        //        `nRods-1` is the max. quantity of possible available rods
        //        indexes `0` & `1` - dummy rods
        // second index: is the number of disks in group move.
        //        index `0` - dummy disk
        // Value ( of _costTable element):
        //   is the number of moves (cost) of moving that number of disks with that number of available rods
        // Value ( of _splitsTable element): 
        //   is the disk distribution split (vector) for the number of disks (second index)
        fillCostDistrTables(nRods: number, nDisks: number) {
            for ( let rodN = 1; rodN <= nRods - 1; rodN++) {
                // `split` array's got a dummy rod 0 to access rod by it's number, that's why length = rodN + 1
                const split: number[] = Array.from( { length: rodN + 1}, () => 0);
                for ( let diskN = 1; diskN <= rodN; diskN++) {
                    this._costTable[rodN][diskN] = diskN*2 - 1;
                    split[split.length - diskN] = 1;
                    this._splitsTable[rodN][diskN] = [ ...split];
                }
            }
        };

        calculateCost(splitPtr: Split): number {
            let cost: number = 0;
            for ( let ind = 1 ; ind < splitPtr.length; ind++) {
                if ( this.costTable[ind][splitPtr[ind]] ) {
                    cost += this.costTable[ind][splitPtr[ind]] * (cost ? 2 : 1); // multiply by 2 for all but the first part
                }
            };

            return cost;
        }

        // Provides disk dist. over available rods in a form of minSplit array, where:
        //   ind. - rod number (as in the costTable) among available rods (it's not a rod number as in rods array!)
        //   value - number of disks on
        // Also updates _costTable[avRods][nDisks] with minCost for minSplit
        getDiskDistr(avRods: number, nDisks: number): number[] {
            if (nDisks < 1 || avRods < 2) 
                throw new Error(`getDiskDistr: incorrect parameters! (avRods=${avRods}, nDisks=${nDisks}`);

            if ( 
                this._splitsTable[avRods][nDisks] &&
                this._splitsTable[avRods][nDisks].length 
            )
                return [ ...this._splitsTable[avRods][nDisks] ];

            let minCost: number = Number.MAX_SAFE_INTEGER;
            let minSplit: Split = Array.from( {length: avRods + 1}, () => 0);

            if ( avRods === 2 ) {
                minSplit[2] = nDisks - 1;
                minSplit[1] = 1;
            } else {
                // find the distribution based on prev element beyond the Primitive one
                // generate costs for disks avRods+1 .. nDisks (formula: min of all possible splits)
                let split: Split = this.getDiskDistr(avRods, nDisks - 1);
                
                // try possible splits of diskCnt into avRods parts, and find the minimum cost
                let ind = 0;
                for (ind = avRods; ind > 1; ind--) {
                if ( ! split[ind] ) break;
                split[ind]++;
                const cost: number = this.calculateCost(split);
                if (cost < minCost) {
                    minCost = cost;
                    minSplit = [...split];
                }
                split[ind]--;
                };

                // save minimal cost 
                this._costTable[avRods][nDisks] = minCost;
            }

            // save minimal split for diskCnt
            this._splitsTable[avRods][nDisks] = minSplit;

            return [ ...minSplit];
        }

        isUpperDisk(disk: number): boolean {
            const rod: number = this.gState[disk];
            return this.rods[rod]!.at(-1) === disk;
        }

        isRodEmpty(rod: number): boolean {
            return this.rods[rod].length === 1;
        }

        // Get `disk's` index on a specified `rod`
        // returns: index of a disk in rods[rod][], -1 - if not found, 0 - if arguments are incorrect
        getDiskSlot(disk: number) {
            if (disk < 1 || disk > this.nDisks || !this.rods[this.gState[disk]]) return 0;

            return this.rods[this.gState[disk]].indexOf(disk);
        }

        // Is `movePar` represent a valid move, NOT checking if `disk` is the upper disk
        // `exclMovingPlan` is optional
        // returns: boolean
        isValidMove(movePar: MoveDiskParams, exclMovingPlan: MovingPlan = []): boolean {
            let { disk, fromRod, toRod } = movePar;
            if (!fromRod) fromRod = this.gState[disk];
            // do Checks
            if (toRod === fromRod) return false; // no point to move to the same rod
            for (const el of exclMovingPlan) {
                // check it's not in the movingPlan
                if (el.toRod === toRod) return false;
            }

            if (this.isRodEmpty(toRod) || this.rods[toRod].at(-1)! > disk) return true;
            return false;
        }

        // Build array of valid moves, NOT checking if `disk` is the upper disk
        // using `this.isValidMove();
        // returns: array of valid moves
        getValidMoves( disk: number = this.nDisks, exclMovingPlan: MovingPlan = [] ): Array<MoveDiskParams> {
            const validMoves: Array<MoveDiskParams> = [];
            for (let toRod = 1; toRod < this.rods.length; toRod++) {
                if (this.isValidMove({ disk, toRod }, exclMovingPlan)) validMoves.push({ disk, toRod });
            }
            return validMoves;
        }

        // Move SINGLE `disk` to `toRod`
        // returns: 1 - if success, 0 - failure
        moveDisk(movePar: MoveDiskParams): number {
            if (!movePar.fromRod) movePar.fromRod = this.gState[movePar.disk];
            // do checks
            if (!(this.isValidMove(movePar) && this.isUpperDisk(movePar.disk))) return 0;

            // move the disk
            this.rods[movePar.toRod]!.push(this.rods[movePar.fromRod]!.pop()!);
            this.gState[movePar.disk] = movePar.toRod;

            return this.moveTree.logMove(movePar) ? 1 : 0;
        }

        // Move specified `disk` and ALL disks above it to a `toRod`
        // returns: number of moves, 0 - move isn't possible
        moveDiskAll(movePar: MoveDiskParams): number {
            if (!this.isValidMove(movePar)) return 0;
            let { disk, toDisk, fromRod, toRod } = movePar;
            if (!fromRod) fromRod = this.gState[disk];
            if (!toDisk) toDisk = this.rods[fromRod].at(-1);
            if (this.isUpperDisk(disk)) return this.moveDisk(movePar); // when disk to move is the Upper Disk

            const movesStart: number = this.moveTree.currNode.level;
            const movingPlan: MovingPlan = [];
            let validMoves: Array<MoveDiskParams> = this.getValidMoves(disk);
            const avRods: number = validMoves.length;

            if (avRods < 2) throw new Error("Number of available rods is below 2 - can't proceed!");

            let diskSlot = this.getDiskSlot(disk);
            let nDisks2Move: number = this.rods[fromRod].length - diskSlot;

            //Get the disk distribution for movingPlan
            const diskDistr: number[] = this.getDiskDistr(avRods, nDisks2Move);

            // build movingPlan
            for (let i = 1; i < diskDistr.length; i++) {
                if (diskDistr[i] === 0) continue;
                toDisk = this.rods[fromRod][diskSlot + diskDistr[i] - 1];
                
                if ( movingPlan.length === 0) {
                // if first move in movingPlan
                movingPlan.unshift({
                    disk,
                    toDisk,
                    fromRod,
                    toRod,
                });
                validMoves = this.getValidMoves(disk, movingPlan);
                } else {
                    // rest of moves
                    const tmpToRod: number = validMoves.shift()!.toRod;
                    // move part of disks to one of available rods
                    movingPlan.unshift({
                        disk,
                        toDisk,
                        fromRod,
                        toRod: tmpToRod,
                    });

                    // move that same part of disks to destination rod after single disk move
                    movingPlan.push({
                        disk,
                        toDisk,
                        fromRod: tmpToRod,
                        toRod,
                    });
                }

                // update disk parameters after the move
                diskSlot += diskDistr[i];
                nDisks2Move -= diskDistr[i];
                if (nDisks2Move) disk = this.rods[fromRod][diskSlot];
            }

            // Execute the movingPlan
            for (const movePlanEl of movingPlan) {
                if (!this.moveDiskAll(movePlanEl))
                    throw new Error("Invalid move in the movingPlan - PANIC !!!");
            }

            return this.moveTree.currNode.level - movesStart;
        }

    } // --- class GameBoard ---

    // --- **class MoveTree** --- define the structure of every node in a the tree/sequence of moves (in the Tower of Hanoi).
    // Each MoveTree object represents a State of move of a disk from one rod to another.
    // It keeps track of its parent move, the disk being moved, the rod it's moving from, and the level in the move tree.
    // It also maintains a list of possible next moves (moveOpts) and tracks which option is currently being considered (currOptInd).
    class MoveTree {
        gBoard: GameBoard;
        topNode: MoveNode;
        currNode: MoveNode;
        solution: Array<MoveNode> = [];

        constructor(gBoard: GameBoard) {
            this.gBoard = gBoard;

            this.topNode = new MoveNode(null, this.gBoard.gState);
            this.currNode = this.topNode;
        };

        logMove(moveDiskPar: MoveDiskParams): boolean {
            const newMoveNode: MoveNode | null = this.currNode.logMove(moveDiskPar, this.gBoard.gState);
            if (!newMoveNode) throw new Error("MoveNode can't be created. Abort!");
            this.currNode = newMoveNode;
            return true;
        }

        getMoveRecords(): Array<MoveRec> {
            const moveRecords: Array<MoveRec> = [{ gState: this.topNode.gState }];

            let node: MoveNode = this.topNode;
            let firstKey = Object.keys(node.moveOpts).shift();
            while (firstKey !== undefined) {
                const moveOpt: MoveOptParams = node.moveOpts[Number(firstKey)];
                if (!moveOpt.childNode) throw new Error("moveOpt has no childNode. Abort!");

                moveRecords.push({
                    movePar: {
                        disk: moveOpt.disk,
                        toRod: moveOpt.toRod,
                        fromRod: node.gState[moveOpt.disk],
                    },
                    gState: moveOpt.childNode.gState,
                });

                node = moveOpt.childNode;
                firstKey = Object.keys(node.moveOpts).shift();
            }

            return moveRecords;
        }
    }; // --- class MoveTree ---


    // --- **class MoveNode** ---
    // Obects of this class constitute the moveTree
    class MoveNode {
        level: number = 0;
        gState: number[] = [];
        parentNode: MoveNode | null = null;
        moveOpts: Array<MoveOptParams> = [];

        constructor(parentNode: MoveNode | null, gState: number[]) {
            this.gState = [...gState];
            this.parentNode = parentNode;
            if (parentNode) this.level = parentNode.level + 1;
        }

        // Makes a new move by adding element to moveOpts array and creating a new node
        // MUST be ran after actual disk move on gBoard (after changing rods and gState)
        // returns: boolean status
        logMove(moveDiskPar: MoveDiskParams, gState: number[]): MoveNode | null {
            const { disk, toRod } = moveDiskPar;
            // check: toRod !== `current rod`
            if (toRod === this.gState[disk]) return null; // no point when toRod === fromRod
            // check move doesn't exist in moveOpts
            for (const moveOpt of this.moveOpts) {
                if (moveOpt.disk === disk && moveOpt.toRod === toRod) return null;
            }

            this.moveOpts.push({
                disk: disk,
                toRod: toRod,
                childNode: new MoveNode(this, gState),
            });

            return this.moveOpts.at(-1)!.childNode;
        }

        //Get params of rollBack move
        getRollBackParams(): MoveDiskParams | undefined {
            // check: it's NOT a topNode
            if (this.parentNode === null) return undefined;

            // find moveOpt element of parent node that points to this node
            const pMoveOpts: Array<MoveOptParams> = this.parentNode.moveOpts;
            for (const moveInd in pMoveOpts) {
                if (pMoveOpts[moveInd].childNode === this) {
                    const pDisk = pMoveOpts[moveInd].disk;
                    return {
                        disk: pDisk,
                        toRod: this.parentNode.gState[pDisk],
                    };
                }
            }
        };

        // Deletes current node and corresp. moveOpt element(s)
        // returns parentNode
        rollBack(): MoveNode | null {
            // check for children - can't be deleted if moveOpts array has element(s)
            // check: it's NOT a topNode
            if (Object.keys(this.moveOpts).length || this.parentNode === null) 
                return null;

            // find and delete moveOpt element of parent node that points to this node
            const pMoveOpts: Array<MoveOptParams> = this.parentNode.moveOpts;
            for (const moveInd in pMoveOpts) {
                if (pMoveOpts[moveInd].childNode === this) {
                    delete pMoveOpts[moveInd];
                    break;
                }
            };

            if (Object.keys(pMoveOpts).length === 0) pMoveOpts.length = 0;

            // delete this node
            this.level = NaN;
            this.gState = [];
            const tmpParentNode = this.parentNode;
            this.parentNode = null;
            return tmpParentNode;
        }
    }; // --- class MoveNode ---


    // ================ function hanoi() body  ======================
    const nRods: number = 4;
    const gBoard: GameBoard = new GameBoard(posts, nRods);
    // gBoard.moveDiskAll({ disk: nDisks, toDisk: 1, fromRod: 1, toRod: 2 });

    return gBoard.moveTree.currNode.level;
}


function main() {
    const ws: WriteStream = createWriteStream(process.env['OUTPUT_PATH']!);
    const n: number = parseInt(readLine().trim(), 10);
    const loc: number[] = readLine().replace(/\s+$/g, '').split(' ').map(locTemp => parseInt(locTemp, 10));
    const res: number = hanoi(loc);

    ws.write(res + '\n');
    ws.end();
}
