class Bikes {
  constructor() {
    this.max = 0;
    this.available = 0;
    this.busy = {
      list: [],
      ptr: 0,
    };
  }

  clearBusyPtr() {
    this.busy.ptr = 0;
  }

  // release bikes from the beginning to the ptr (exclusive)
  releaseBike() {
    if (!this.busy.list.length) this.clearBusyPtr();
    if (!this.busy.ptr) return;
    this.busy.list.splice(0, this.busy.ptr);
    this.available += this.busy.ptr;
    this.clearBusyPtr();
  }

  // allocate new bike
  getNewBikeFor(order) {
    if (this.available) this.available--;
    else this.max++;

    // add order (end time) to busy.list before the ptr
    while (this.busy.ptr < this.busy.list.length && order.end >= this.busy.list[this.busy.ptr])
      this.busy.ptr++;
    this.busy.list.splice(this.busy.ptr, 0, order.end);
  }
}
//

export function solve(orders) {
  const bikes = new Bikes();

  orders.forEach((order) => {
    bikes.clearBusyPtr();
    while (order.begin >= bikes.busy.list[bikes.busy.ptr]) bikes.busy.ptr++;
    bikes.releaseBike();
    bikes.getNewBikeFor(order);
  });
  return bikes.max;
}
