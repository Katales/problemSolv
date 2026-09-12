export {};
// ====================== Harness - Part 1  =============================

// ====================== End of Harness - Part 1  =============================

// ================= Types & Classes =================
type Disks = Array<number>;

type CostTable = Array<Array<number>>;

type MoveDiskParams = {
  disk: number;
  toDisk?: number;
  fromRod?: number;
  toRod: number;
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
  // the Table of MIN costs for disk group moves (see method description, genCostTable)
  _costTable: number[][]; // --- DEBUG return PRIVATE !!!!!!!!!!!
  // Proxy for _costTable
  private _costTableProxy: number[][]; 
  // splitsTable
  private _splitsTable: number[][][];

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
  get costTable() {
    return this._costTableProxy
  }

  
  initCostTableProxy(): number[][] {
    return new Proxy( this._costTable, {
      get: (costTable: number[][], rodNProp: string | symbol) => {
        if (
          typeof rodNProp !== "string" ||
          ! Number.isInteger(Number(rodNProp)) 
        ) return Reflect.get(costTable, rodNProp);

        const rodN = Number(rodNProp);

        return new Proxy( this._costTable[rodN], { 
          get: (costTableRod: number[], diskNProp: string | symbol) => {
            if (
              typeof diskNProp !== "string" ||
              ! Number.isInteger(Number(diskNProp)) ||
              costTableRod[Number(diskNProp)]
            ) return Reflect.get(costTableRod, diskNProp);

            const diskN: number = Number(diskNProp);
            if ( 
              rodN < 1 ||
              rodN >= this.nRods ||
              rodN === 1 && diskN > 1 ||
              diskN > this.nDisks ||
              diskN <= rodN
            ) {
              return Reflect.get(costTableRod, diskNProp);
            };

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
  }


  calculateCost(splitPtr: number[]): number {
    let cost: number = 0;
    for ( let ind = 1 ; ind < splitPtr.length; ind++) {
      if ( this.costTable[ind][splitPtr[ind]] ) {
        cost += this.costTable[ind][splitPtr[ind]] * (cost ? 2 : 1); // multiply by 2 for all but the first part
      }
    }
    // --- DEBUG 
    // console.log(`>> CalculateCost: splitPtr=`, splitPtr, `cost=`, cost);
    return cost;
  }


  // Provides disk dist. over available rods in a form of minSplit array, where:
  //   ind. - rod number (as in the costTable) among available rods (it's not a rod number as in rods array!)
  //   value - number of disks on
  // Also updates _costTable[avRods][nDisks] with minCost for minSplit
  getDiskDistr(avRods: number, nDisks: number): number[] {
    if (nDisks < 1 || avRods < 2) 
      throw new Error(`getDiskDistr: incorrect parameters! (avRods=${avRods}, nDisks=${nDisks}`);

    // --- DEBUG
    // console.log(`> getDiskDistr(avRods:${avRods}, nDisks: ${nDisks})`);
    if ( 
      this._splitsTable[avRods][nDisks] &&
      this._splitsTable[avRods][nDisks].length 
    )
      return [ ...this._splitsTable[avRods][nDisks] ];

    let minCost: number = Number.MAX_SAFE_INTEGER;
    let minSplit: number[] = Array.from( {length: avRods + 1}, () => 0);

    if ( avRods === 2 ) {
      minSplit[2] = nDisks - 1;
      minSplit[1] = 1;
    } else {
      // find the distribution based on prev element beyond the Primitive one
      // generate costs for disks avRods+1 .. nDisks (formula: min of all possible splits)
      let split: number[] = this.getDiskDistr(avRods, nDisks - 1);
      
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

} // --- class GameBoard ---



// ================= End of Types & Classes =================

// ====================== Harness - Part 2  =============================

// ---------------------- Input Data ------------------------------
const nRods: number = 6;
const nDisks: number = 20;

// --- create posts array for GameBoard instantiation
const posts: number[] = Array(nDisks).fill(1);

const gBoard = new GameBoard(posts, nRods); // Example initialization with 4 disks on rod 1

console.log(`Initial state of rods: ${gBoard.gState}`);
print_costTable(gBoard);

// printCostTable(gBoard);
// console.log('gBoard.getDiskDistr(2, 6)=', gBoard.getDiskDistr(2, 6));

print_costTable(gBoard);

console.log('gBoard.getDiskDistr(2, 20)=', gBoard.getDiskDistr(2, 20));
console.log('gBoard.getDiskDistr(4, 20)=', gBoard.getDiskDistr(4, 20));

print_costTable(gBoard);

// Prints _costTable
function print_costTable(gBoard: GameBoard): void {
  const firstColumn = 1;

  for (let row = 0; row <= gBoard.nDisks; row++) {
    const values: number[] = [];

    for (let column = firstColumn; column < gBoard._costTable.length; column++) {
      values.push(gBoard._costTable[column][row]);
    }

    console.log(values.join('\t'));
  }
};

// Prints Cost Table
function printCostTable(gBoard: GameBoard): void {
  const firstColumn = 1;

  for (let row = 0; row <= gBoard.nDisks; row++) {
    const values: number[] = [];

    for (let column = firstColumn; column < gBoard.costTable.length; column++) {
      values.push(gBoard.costTable[column][row]);
    }

    console.log(values.join('\t'));
  }
}


