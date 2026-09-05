// ====================== Harness - Part 1  =============================

// ====================== End of Harness - Part 1  =============================

// ================= Types & Classes =================
type Disks = Array<number>;

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
  // the Table of MIN costs for disk group moves (see method description, genCostTable)
  costTable: Array<Array<number>>;

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

    //generate costTable
    this.costTable = this.genCostTable(this.nDisks, this.nRods);
  }

  // GETTER: nDisks - number of disks on GameBoard
  get nDisks() {
    return this.gState.length - 1; // minus dummy disk
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
    if (disk < 1 || disk > nDisks || !this.rods[this.gState[disk]]) return 0;
    return this.rods[this.gState[disk]].indexOf(disk);
  }

  // is `movePar` represent a valid move
  // `exclMovingPlan` is optional
  // returns
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

  getValidMoves(
    disk: number = this.nDisks,
    exclMovingPlan: MovingPlan = [],
  ): Array<MoveDiskParams> {
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

    const oldGState: number[] = [ ...this.gState]; // --- DEBUG TRACING

    // move the disk
    this.rods[movePar.toRod]!.push(this.rods[movePar.fromRod]!.pop()!);
    this.gState[movePar.disk] = movePar.toRod;

    console.log( // --- DEBUG TRACING
      `[`,this.moveTree.currNode.level + 1,`] move SINGLE disk: ${movePar.disk}  fromRod:${movePar.fromRod} toRod:${movePar.toRod} | gState: ${oldGState} => ${this.gState}`
    ); 

    return this.moveTree.logMove(movePar) ? 1 : 0;
  }

  // Move specified `disk` and ALL disks above it to a `toRod`
  //returns: number of moves, 0 - move isn't possible
  moveDiskAll(movePar: MoveDiskParams): number {
    if (!this.isValidMove(movePar)) return 0;
    let { disk, toDisk, fromRod, toRod } = movePar;
    if (!fromRod) fromRod = this.gState[disk];
    if (!toDisk) toDisk = this.rods[fromRod].at(-1);
    if (this.isUpperDisk(disk)) return this.moveDisk(movePar); // when disk to move is the Upper Disk

    const movesStart: number = this.moveTree.currNode.level;
    const movingPlan: MovingPlan = [];
    const avRods: number = this.getValidMoves(disk).length;

    if (avRods < 2) throw new Error("Number of available rods is below 2 - can't proceed!");

    let diskSlot = this.getDiskSlot(disk);
    let nDisks2Move: number = this.rods[fromRod].length - diskSlot;

    // --- DEBUG TRACING
    console.log(`>>> moveDiskAll | movePar: ${JSON.stringify(movePar)} | gState: ${this.gState}`); 
    console.log(`    (Status) disk=${disk} , diskSlot=${diskSlot}, nDisks2Move=${nDisks2Move}, avRods=${avRods}`);

    // add the first item to the movePlan (SINGLE disk)
    movingPlan.unshift({ disk, toDisk: disk, fromRod, toRod });
    
    // --- DEBUG TRACING
    console.log(`    First move: ${JSON.stringify(movingPlan[0])}`);

    // update disk parameters after the first move
    diskSlot++;
    nDisks2Move--;
    disk = this.rods[fromRod][diskSlot];

    const validMoves = this.getValidMoves(disk, movingPlan);
    // --- DEBUG TRACING
    this.prnArrMoveDiskParams(validMoves, '    Array of Valid Moves:');

    //Get the disk distribution for multiple-disk move & add plan records
    const diskDistr: number[] = this.getDiskDistr(nDisks2Move, avRods);
    console.log('    Disk distribution:', diskDistr); // --- DEBUG TRACING

    for (let i = 2; i < diskDistr.length; i++) {
      if (diskDistr[i] === 0) continue;
      toDisk = this.rods[fromRod][diskSlot + diskDistr[i] - 1];
      const tmpToRod: number = validMoves[i - 2].toRod;
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
      // update disk parameters after the move
      diskSlot += diskDistr[i];
      nDisks2Move -= diskDistr[i];
      if (nDisks2Move) disk = this.rods[fromRod][diskSlot];
    }

    // --- DEBUG TRACING
    this.prnArrMoveDiskParams(movingPlan, '    WHOLE Moving Plan:');

    // Execute the Plan !
    for (const movePlanEl of movingPlan) {
      if (!this.moveDiskAll(movePlanEl))
        throw new Error("Invalid move in the movingPlan - Panic mode's ON!!!");
    }

    return this.moveTree.currNode.level - movesStart;
  }

  // Provides disk dist. over available rods in a form of SplitPtr array, where:
  // ind. - rod number (as in the costTable) among available rods (it's not a rod number as in rods array!)
  // value - number of disks on
  getDiskDistr(nDisks: number, avRods: number): number[] {
    let diskCnt: number = 0;
    //prepare splitPtr array for generating costs for disks avRods+1 .. nDisks
    let splitPtr: number[] = Array.from({ length: avRods + 1 }, () => 0);

    // check if nDisks is less than the `number of disks in Base distribution`
    const nDisksInBaseDistr: number = ((avRods - 1) * (avRods + 2)) / 2;
    if (nDisks < nDisksInBaseDistr) {
      // Yes - fill in splitPtr according to the `Base distribution`
      for (let diskRow = 1; diskRow <= avRods && diskCnt < nDisks; diskRow++) {
        for (let rodCol = avRods; rodCol >= 2 && rodCol >= diskRow && diskCnt < nDisks; rodCol--) {
          splitPtr[rodCol]++;
          diskCnt++;
        }
      }
      return splitPtr;
    }

    // fill in splitPtr as a `Base distribution`
    for (let ind = 2; ind <= avRods; ind++) splitPtr[ind] = ind;
    if (nDisks === nDisksInBaseDistr) return splitPtr;

    // find the distribution beyond the Base one
    // generate costs for disks avRods+1 .. nDisks (formula: min of all possible splits)
    for (diskCnt = nDisksInBaseDistr + 1; diskCnt <= nDisks; diskCnt++) {
      let minInc: number = Number.MAX_SAFE_INTEGER;
      let minSplitPtr: number[] = [];
      // try possible splits of diskCnt into avRods parts, and find the minimum cost
      for (let ind = 2; ind <= avRods; ind++) {
        splitPtr[ind]++;
        const inc = this.costTable[ind][splitPtr[ind]];
        if (inc < minInc) {
          minInc = inc;
          minSplitPtr = [...splitPtr];
        }
        splitPtr[ind]--;
      }
      // save minimal cost and split pointer for diskCnt
      splitPtr = [...minSplitPtr];
    }

    return splitPtr;
  }

  // Generate the Table of MIN Costs for disk group moves
  // first index:  `[2 .. nRods-1 ]` is the number of rods available for a group move.
  //        `nRods-1` is the max. quantity of possible available rods
  //        indexes `0` & `1` - dummy rods
  // second index: is the number of disks in group move.
  //        index `0` - dummy disk
  // Value is the number of moves (cost) of moving that number of disks with that number of available rods
  genCostTable(nDisks: number, nRods: number): Array<Array<number>> {
    const costTable: Array<Array<number>> = Array.from({ length: nRods }, () => [] as number[]);

    // generate costs for 2 rods (the classic Tower of Hanoi problem)
    costTable[2][1] = 1;
    for (let diskCnt = 2; diskCnt <= nDisks; diskCnt++)
      costTable[2][diskCnt] = costTable[2][diskCnt - 1] * 2 + 1;

    // generate costs for (3 .. nRods-1) rods
    for (let avRods = 3; avRods <= nRods - 1; avRods++) {
      // generate costs for disks 1 .. avRods (formula: diskCnt * 2 - 1)
      for (let diskCnt = 1; diskCnt <= avRods; diskCnt++) {
        costTable[avRods][diskCnt] = diskCnt * 2 - 1;
      }

      //prepare splitPtr array for generating costs for disks avRods+1 .. nDisks
      let splitPtr: number[] = Array.from({ length: avRods + 1 }, () => 0);
      for (let i = 0; i <= avRods - 1; i++) {
        const ind = (i % (avRods - 1)) + 2; //add 2 to convert to avRods index in costTable
        splitPtr[ind]++;
      }
      // generate costs for disks avRods+1 .. nDisks (formula: min of all possible splits)
      for (let diskCnt = avRods + 1; diskCnt <= nDisks; diskCnt++) {
        let minCost: number = Number.MAX_SAFE_INTEGER;
        let minSplitPtr: number[] = [];
        // try possible splits of diskCnt into avRods parts, and find the minimum cost
        for (let ind = 2; ind <= avRods; ind++) {
          const tmpSplitPtr = [...splitPtr];
          tmpSplitPtr[ind]++;
          const tmpMinCost = calculateCost(tmpSplitPtr);
          if (tmpMinCost < minCost) {
            minCost = tmpMinCost;
            minSplitPtr = [...tmpSplitPtr];
          }
        }
        // save minimal cost and split pointer for diskCnt
        costTable[avRods][diskCnt] = minCost;
        splitPtr = [...minSplitPtr];
      }
    }

    function calculateCost(splitPtr: number[]): number {
      let cost: number = 0;
      for (let ind = 2; ind <= splitPtr.length - 1; ind++) {
        cost += costTable[ind][splitPtr[ind]] * (ind === 2 ? 1 : 2); // multiply by 2 for all but the first part
      }
      return cost;
    }

    return costTable;
  }

  // --- DEBUG TRACING
  prnArrMoveDiskParams(arrMoveDiskParams: MoveDiskParams[], msg: string = '') {
    console.log(msg);
    for (const moveInd in arrMoveDiskParams) {
      // console.log(`\t[${moveInd}] ${JSON.stringify(arrMoveDiskParams[moveInd])}`);
      console.log(`\t[${moveInd}] `, arrMoveDiskParams[moveInd] );
    }
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
  }

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
}
// --- class MoveTree ---

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
  }

  // Deletes current node and corresp. moveOpt element(s)
  // returns parentNode
  rollBack(): MoveNode | null {
    // check for children - can't be deleted if moveOpts array has element(s)
    // check: it's NOT a topNode
    if (Object.keys(this.moveOpts).length || this.parentNode === null) return null;

    // find and delete moveOpt element of parent node that points to this node
    const pMoveOpts: Array<MoveOptParams> = this.parentNode.moveOpts;
    for (const moveInd in pMoveOpts) {
      if (pMoveOpts[moveInd].childNode === this) {
        delete pMoveOpts[moveInd];
        break;
      }
    }
    if (Object.keys(pMoveOpts).length === 0) pMoveOpts.length = 0;

    // delete this node
    this.level = NaN;
    this.gState = [];
    const tmpParentNode = this.parentNode;
    this.parentNode = null;
    return tmpParentNode;
  }
} // --- class MoveNode ---

// ================= End of Types & Classes =================

// ====================== Harness - Part 2  =============================

// ---------------------- Input Data ------------------------------
const nRods: number = 4;
const nDisks: number = 8;

// --- create posts array for GameBoard instantiation
const posts: number[] = Array(nDisks).fill(1);

const gBoard = new GameBoard(posts, nRods); // Example initialization with 4 disks on rod 1

console.log(`Initial state of rods: ${gBoard.gState}`);
printCostTable(gBoard);

console.log(
  // --- DEBUG TRACING
  `Number of moves: ${gBoard.moveDiskAll({ disk: nDisks, toDisk: 1, fromRod: 1, toRod: 2 })} `,
);

printMoveRecords(gBoard.moveTree);

// Prints Cost Table
function printCostTable(gBoard: GameBoard): void {
  const firstColumn = 2;

  for (let row = 0; row <= gBoard.nDisks; row++) {
    const values: number[] = [];

    for (let column = firstColumn; column < gBoard.costTable.length; column++) {
      values.push(gBoard.costTable[column][row]);
    }

    console.log(values.join('\t'));
  }
}

// Prints the move tree's records: initial state, then each move with its resulting gState
function printMoveRecords(moveTree: MoveTree): void {
  const moveRecords: Array<MoveRec> = moveTree.getMoveRecords();

  console.log(`Initial GameBoard state: ${moveRecords[0].gState}`);

  for (let i = 1; i < moveRecords.length; i++) {
    const { movePar, gState } = moveRecords[i];
    console.log(
      `[${i}] move disk ${movePar!.disk}  fromRod:${movePar!.fromRod} toRod:${movePar!.toRod} | gState: ${gState}`,
    );
  }
}

// Prints Rods array
function printRods(gBoard: GameBoard): void {
  const firstColumn = 2;

  for (let row = 0; row <= gBoard.rods.length - 1; row++) {
    console.log(`Rod[${row}]`, gBoard.rods[row]);
  }
}

function printRodsPretty(gBoard: GameBoard): void {
  const { rods, nRods, nDisks } = gBoard;
  const colWidth = String(nDisks).length + 2; // enough space for the widest disk number

  // build each rod's stack bottom-to-top, skipping the dummy disk `0` at index 0
  const stacks: number[][] = [];
  for (let r = 1; r <= nRods; r++) stacks.push(rods[r].slice(1));

  const maxHeight = Math.max(...stacks.map((s) => s.length), 0);

  const lines: string[] = [];
  for (let level = maxHeight; level >= 1; level--) {
    const row = stacks
      .map((stack) => {
        const disk = stack[level - 1];
        return centerText(disk !== undefined ? String(disk) : '|', colWidth);
      })
      .join('');
    lines.push(row);
  }

  lines.push('-'.repeat(colWidth * nRods)); // ground line
  lines.push(
    Array.from({ length: nRods }, (_, i) => centerText(String(i + 1), colWidth)).join(''),
  ); // rod numbers

  console.log(lines.join('\n'));
}

function centerText(text: string, width: number): string {
  const totalPad = width - text.length;
  const left = Math.floor(totalPad / 2);
  const right = totalPad - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}