## Problem Name  
_Hacker Rank_  
***[Gena Playing Hanoi](https://www.hackerrank.com/challenges/gena/problem)***

Difficulty: Medium  
Tags:  
**To run test:**
```bash
npm test -- prblms/HR_Gena-playing-Hanoi/
```  
### Description  
Gena has a modified version of the Tower of Hanoi. This game of Hanoi has `4` rods and `n` disks ordered by ascending size. Gena has already made a few moves following the rules above. Given the state of Gena's Hanoi, determine the minimum number of moves needed to restore the tower to its original state with all disks on rod `1`.

**Note:**  

* Gena's rods are numbered from `1` to `4`. The radius of a disk is its index in the input array, so disk 1 is the smallest disk with a radius of 1, and disk `n` is the largest with a radius of `n`.
* Only one disk can be moved at a time.  
* In one move, remove the topmost disk from one rod and move it to another rod.  
* No disk may be placed on top of a smaller disk.

**Function Description**  
`hanoi` function has the following parameters:
* `int posts[n]`: *post[i]* is the location (index of the rod) of the disk with radius *i*  

Returns:  
* `int`: the minimum moves to reset the game to its initial state  
<br>

**Input Format:**  
The first line contains a single integer, `n` , the number of disks.
The second line contains `n` space-separated integers, where the `i`<sup>th</sup> integer is the index of the rod where the disk with diameter `i` is located.

**Constraints:**  1 <= `n` <= 10  
