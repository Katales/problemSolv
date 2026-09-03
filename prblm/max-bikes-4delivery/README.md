## Problem Name  
*interview problem 2026-Jul*  
***Max Bikes for Delivery Orders***

Difficulty: Medium  
Tags: intervals, sweep-line, scheduling, greedy  

**To run test:**
```bash
npm test -- prblms/max-bikes-4delivery/
```  

### Description  
A bike rental service wants to fulfill a list of delivery orders. Each order
has a `begin` time and an `end` time, representing when the bike is picked up
and when it's returned.

Determine the minimum number of bikes the service needs to have on hand to
fulfill every order, given that a bike can be reused for a new order as soon
as it's returned — but not before.

**Notes:** 
* if one order's `end` time is exactly equal to another order's
`begin` time, they are *not* considered overlapping — the bike is free to be
reassigned immediately. Only strictly overlapping intervals (where
`begin < previous end`) require a separate bike.  
* The order list is pre-sorted by `begin` time ascending.  
