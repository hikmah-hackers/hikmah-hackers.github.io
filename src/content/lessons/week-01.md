---
week: 1
title: Hello, Python!
date: 2026-10-30
unit: Python basics
summary: Open the Python editor on your Chromebook, write your first program, and learn how to save your work.
objectives:
  - Explain what programming is in one sentence
  - Open the online Python editor and press Run
  - Use print() to show text on the screen
  - Fix the three most common beginner mistakes
slides: https://claude.ai/artifact/Py2V1EndQzkNv2etybzBA2
assignment:
  title: All About Me
  due: 2026-11-06
  summary: Write a program that introduces you to the class.
  required:
    - At least 5 print lines
    - Your name and grade
    - A hobby or sport you like
    - Your favourite food
    - Something you want to build with code
  bonus: Draw a picture out of symbols using print (a house, a rocket, your initials…).
---

## The big idea

Programming means giving a computer **exact instructions, in the right order**. Computers are very fast, but they do exactly what you say, not what you mean.

> Remember the sandwich question from the pretest? If you put the top slice on first, the computer won't stop you. Order matters.

## Your first program

Open the editor (see the [Guide](/guide#setup)), delete any code that's already there, type this, and press **Run**:

```python
print("Assalamu alaikum, world!")
```

You should see:

```
Assalamu alaikum, world!
```

## Three parts of a print line

| Part | What it does |
| --- | --- |
| `print` | The command. It means "show this on the screen." |
| `( )` | Brackets hold what you want to print. |
| `" "` | Quotes mean "this is text." Python prints it exactly. |

## Your turn

Make Python print three lines about you:

```python
print("My name is Amina")
print("I am in grade 8")
print("I love biryani")
```

**Finished early?** Add a fourth line. Then swap two lines and press Run. What changed?

## Bug hunt

| Broken | What's wrong | Fixed |
| --- | --- | --- |
| `print("Hi)` | Missing the closing quote | `print("Hi")` |
| `print("Hi"` | Missing the closing bracket | `print("Hi")` |
| `Print("Hi")` | Capital P. Python cares about capitals! | `print("Hi")` |

## Don't lose your work

The editor doesn't save for you. Press <kbd>Ctrl</kbd> + <kbd>A</kbd>, <kbd>Ctrl</kbd> + <kbd>C</kbd>, then paste into your Google Doc called **Hikmah Hackers – My Code**.
