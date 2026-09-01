import type { Clock } from "../domain/clock";

export class SystemClock implements Clock {
  public now(): Date {
    return new Date();
  }
}
