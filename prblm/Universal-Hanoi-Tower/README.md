## Problem Name  
***Universal Hanoi Tower***

Difficulty: Hard  
Tags:  
**To run test:**
```bash
npm test -- prblm/Universal-Hanoi-Tower/
```  
### Description

This is a generalized version of the Tower of Hanoi problem with `m` rods and `n` disks, ordered by ascending size.

Initially, all `n` disks are placed on rod `1`, with the largest disk at the bottom and the smallest disk at the top.

Given the number of disks `n` and the number of rods `m`, determine the minimum number of moves required to relocate the entire tower from rod `1` to rod `2`.

The solution must support an arbitrary number of disks and rods.

**Note:**

* The rods are numbered from `1` to `m`.
* The disks are numbered from `1` to `n`, where disk `1` is the smallest and disk `n` is the largest.
* Initially, all disks are located on rod `1`.
* The goal is to move all disks to rod `2`.
* Only one disk can be moved at a time.
* In one move, the topmost disk from one rod may be moved to another rod.
* A disk may never be placed on top of a smaller disk.

### Function Description

The `hanoi` function has the following parameters:

* `int nDisks`: the number of disks.
* `int nRods`: the number of rods.

Returns:

* `int`: the minimum number of moves required to relocate all disks from rod `1` to rod `2`.

<br>

### Input Format

The first line contains two space-separated integers:

`n m`

where:

* `n` is the number of disks.
* `m` is the number of rods.
