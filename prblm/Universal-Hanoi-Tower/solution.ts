('use strict');

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// The solution (exported for testing purposes)
export function hanoi(nDisks: number, nRods: number = 3): number {
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
      if (!this.gState.length)
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

    // is `moveParams` represent a valid move
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

      // move the disk
      this.rods[movePar.fromRod]!.pop();
      this.rods[movePar.toRod]!.push(movePar.disk);
      this.gState[movePar.disk] = movePar.toRod;

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

      // add the first item to the movePlan (SINGLE disk)
      movingPlan.unshift({ disk, toDisk: disk, fromRod, toRod });

      // plan the moves of upper disks
      diskSlot++;
      nDisks2Move--;
      disk = this.rods[fromRod][diskSlot];
      const validMoves = this.getValidMoves(disk, movingPlan);

      //Get the disk distribution for multiple-disk move & add plan records
      const diskDistr: number[] = this.getDiskDistr(nDisks2Move, avRods);
      for (let i = 2; i < diskDistr.length - 1; i++) {
        const tmpToRod: number = validMoves[i - 2].toRod;
        // move part of disks to one of available rods
        movingPlan.unshift({
          disk,
          toDisk: this.rods[fromRod][diskSlot + diskDistr[i] - 1],
          fromRod,
          toRod: tmpToRod,
        });

        // move that same part of disks to destination rod after single disk move
        movingPlan.push({
          disk,
          toDisk: this.rods[fromRod][diskSlot + diskDistr[i] - 1],
          fromRod: tmpToRod,
          toRod,
        });
      }

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
          for (
            let rodCol = avRods;
            rodCol >= 2 && rodCol >= diskRow && diskCnt < nDisks;
            rodCol--
          ) {
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
      return true;
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
      for (let moveInd = 0; moveInd < Object.keys(this.moveOpts).length; moveInd++) {
        if (this.moveOpts[moveInd].disk === disk && this.moveOpts[moveInd].toRod === toRod)
          return null;
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
  const posts: number[] = Array.from({ length: nDisks }, () => 1);
  const gBoard: GameBoard = new GameBoard(posts, nRods);

  return gBoard.moveDiskAll({ disk: nDisks, toDisk: 1, fromRod: 1, toRod: 2 });
}
