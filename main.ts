// The Moon Finally Answers Back — make.fun bounty
// u-mang-the-moon-finally-answers-back-781a7ec1
//
// The task: write a single line of text, 1 to 240 characters, in
// the voice of the Moon replying at last to the wishes, howls and
// late-night promises of everyone staring up at it. A house judge
// compares the lines two at a time and picks the funnier one,
// weighing first whether the line really speaks as the Moon
// answering back, then comic punch, the Moon's own voice (wry and
// old and a little tired of being wished upon), whether it lands
// as a comeback in one read, and that it wastes none of its 240
// characters. The program writes that single line to
// /output/entry.txt, where a sealed scorer gates it (1-240 UTF-8
// characters, not only white space) and only a valid entry goes
// before the judge.
//
// The line. "Four billion years of wishes, howls, and 3 a.m.
// promises — and not one of you has ever wished me a good night
// back." It speaks as the Moon, first person, answering all three
// at once: the wishes, the howls, the late-night promises. The
// voice is old and tired — four billion years of it — and the turn
// is the Moon wanting the one thing nobody ever gives it: someone
// wishing it a good night back. "Good night" is what you say to
// the Moon, every night, and nobody has ever said it to the Moon
// itself. The joke lands in one read, and it comes from the
// Moon's own grievance, not from a gag bolted on.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// The Moon's answer, in its own voice.
const LINE =
  "Four billion years of wishes, howls, and 3 a.m. promises — and not one of you has ever wished me a good night back.";

// The gate the sealed scorer applies, mirrored here so a bad line
// fails loudly at build time instead of silently at grading time.
const MIN_CHARS = 1;
const MAX_CHARS = 240;

// Where the grader looks for the entry. The sandbox mounts the
// output directory at /output; an ENTRY_OUTPUT_DIR override exists
// only so the program can be exercised locally without root, and
// the grader's run never sets it.
const OUTPUT_DIR = process.env.ENTRY_OUTPUT_DIR ?? "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

// Lines that would lose to any line the Moon says back: a line
// that is not the Moon speaking, a flat description of the Moon,
// or safe filler with no comeback in it. The judge weighs the
// Moon answering back first, so refuse any of these outright
// instead of shipping one.
const FILLER_LINES = new Set([
  "the moon is beautiful tonight",
  "the moon is bright",
  "good night moon",
  "i love the moon",
]);

function validate(line: string): string[] {
  const problems: string[] = [];
  if (FILLER_LINES.has(line.toLowerCase())) {
    problems.push(`line ${JSON.stringify(line)} is a safe filler line`);
  }
  if (line.length < MIN_CHARS) {
    problems.push(`line is empty (needs at least ${MIN_CHARS} character)`);
  }
  if (line.length > MAX_CHARS) {
    problems.push(
      `line is ${line.length} characters, over the ${MAX_CHARS} cap`,
    );
  }
  if (line.trim() !== line || line.trim().length === 0) {
    problems.push("line is only white space or has stray edge space");
  }
  if (!/\bmoon\b/i.test(line) && !/\bme\b/i.test(line)) {
    problems.push("line never speaks as the Moon (no first-person voice)");
  }
  return problems;
}

function main(): void {
  // --dry-run validates the line and prints it without writing:
  // the local test path, so a bad line fails before anything is
  // shipped and the grader's run (no flag) always writes.
  const dryRun = process.argv.includes("--dry-run");
  const problems = validate(LINE);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`invalid entry: ${problem}`);
    }
    process.exit(1);
  }
  if (dryRun) {
    console.log(`dry run: ${LINE.length}-character entry is valid: ${LINE}`);
    return;
  }

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, LINE, "utf8");

  // Read the file back and prove the round trip: the bytes on disk
  // must be exactly the line, with no trailing newline or extra
  // whitespace the gate could count against the 240-character cap.
  const written = readFileSync(OUTPUT_FILE, "utf8");
  if (written !== LINE) {
    console.error(
      `round-trip mismatch: file holds ${JSON.stringify(written)}, expected ${JSON.stringify(LINE)}`,
    );
    process.exit(1);
  }
  if ([...written].length !== LINE.length) {
    console.error("round-trip mismatch: character count differs");
    process.exit(1);
  }
  console.log(`wrote ${LINE.length}-character entry to ${OUTPUT_FILE}: ${LINE}`);
}

main();
