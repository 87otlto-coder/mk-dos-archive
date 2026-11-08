/**
 * P68: monotonic guard for asynchronously prepared original DOS game sessions.
 * A picker cancellation, invalid candidate or later choice must not allow an
 * older asynchronous inventory result to replace the currently active game.
 */
export class DirectorySwitchGateP68 {
  private revision = 0;

  begin(): number {
    return ++this.revision;
  }

  cancel(): void {
    this.revision++;
  }

  isCurrent(revision: number): boolean {
    return Number.isSafeInteger(revision) && revision > 0 && revision === this.revision;
  }
}
