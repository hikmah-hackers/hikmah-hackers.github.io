export interface CheatItem {
  title: string;
  code: string;
  note: string;
}

export const CHEATSHEET: CheatItem[] = [
  {
    title: 'Print something',
    code: 'print("Assalamu alaikum!")\nprint("Line two")',
    note: 'Text goes inside quotes. Each print starts a new line.',
  },
  {
    title: 'Comments',
    code: '# This line is a note for humans.\nprint("Python ignores the # line")',
    note: 'Anything after # is ignored by Python.',
  },
  {
    title: 'Variables',
    code: 'name = "Mohammad"\nage = 13\nprint(name, age)',
    note: 'A variable is a labelled box that remembers a value.',
  },
  {
    title: 'Ask the user',
    code: 'name = input("What is your name? ")\nprint("Salaam, " + name)',
    note: 'input() always gives you text.',
  },
  {
    title: 'Math',
    code: 'print(7 + 3)   # 10\nprint(7 * 3)   # 21\nprint(7 / 2)   # 3.5\nprint(7 // 2)  # 3 (whole part)\nprint(7 % 2)   # 1 (remainder)',
    note: 'Turn text into a number with int("5").',
  },
  {
    title: 'f-strings',
    code: 'food = "biryani"\nprint(f"My favourite food is {food}!")',
    note: 'Put f before the quotes, then variables in { }.',
  },
  {
    title: 'If / elif / else',
    code: 'score = 85\nif score >= 90:\n    print("Amazing!")\nelif score >= 70:\n    print("Great job")\nelse:\n    print("Keep practising")',
    note: 'The colon : and the 4-space indent matter.',
  },
  {
    title: 'Comparisons',
    code: '==  equal to        !=  not equal\n>   greater than    <   less than\n>=  at least        <=  at most\nand   or   not',
    note: '= stores a value. == checks if two things are equal.',
  },
  {
    title: 'For loop',
    code: 'for i in range(3):\n    print("SubhanAllah", i)',
    note: 'range(3) gives 0, 1, 2.',
  },
  {
    title: 'While loop',
    code: 'count = 3\nwhile count > 0:\n    print(count)\n    count = count - 1\nprint("Go!")',
    note: 'Repeats while the condition is true. Make sure it can stop!',
  },
  {
    title: 'Lists',
    code: 'prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]\nprint(prayers[0])      # Fajr\nprayers.append("Witr")\nprint(len(prayers))    # 6',
    note: 'Counting starts at 0.',
  },
  {
    title: 'Functions',
    code: 'def greet(name):\n    return f"Salaam, {name}!"\n\nprint(greet("Mohammad"))',
    note: 'def makes a reusable block of code.',
  },
];

export const COMMON_ERRORS: { error: string; meaning: string; fix: string }[] = [
  { error: 'SyntaxError', meaning: 'Python can’t read the line.', fix: 'Look for a missing quote, bracket, or colon.' },
  { error: 'NameError', meaning: 'Python doesn’t know that word.', fix: 'Check spelling and capitals: print, not Print.' },
  { error: 'IndentationError', meaning: 'The spaces at the start are wrong.', fix: 'Indent with 4 spaces after a line ending in :.' },
  { error: 'TypeError', meaning: 'Mixing types that don’t fit.', fix: 'Use int() for numbers from input(), or str() to join text.' },
];
