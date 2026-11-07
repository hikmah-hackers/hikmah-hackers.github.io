---
week: 3
title: Asking Questions
date: 2026-11-13
unit: Python basics
summary: Use input() to ask the user a question, store the answer in a variable, and turn typed numbers into real numbers with int().
objectives:
  - Use input() to ask a question and store the answer in a variable
  - Explain why the program pauses and waits for you
  - Know that input() always gives back text, even when you type a number
  - Use int() to turn a typed number into a number you can do math with
  - Fix the most common input() mistakes
assignment:
  title: My Chat Bot
  due: 2026-11-20
  summary: Write a program that asks the user questions and replies using their answers.
  required:
    - Ask at least 3 questions with input()
    - At least one question asks for a number, turned into a number with int()
    - Do some math with that number (for example, their age next year)
    - Print a friendly reply that uses every answer
  bonus: Make a Salah Counter that asks how many days, then prints how many prayers that is (5 a day) and how many rakat in total.
---

## Warm-up: last week

Who finished **My Profile Card**? Last week, *we* filled every box ourselves:

```python
name = "Mohammad"
```

That works, but the program says the same thing every time. Today, the **person using the program** fills the box.

## The big idea: input() asks a question

Think of a waiter at a restaurant. They **ask** what you want, **wait** for you to answer, then **write it down**. `input()` does the same three things:

1. **Ask:** it shows your question on the screen.
2. **Wait:** the program stops until the user types and presses **Enter**.
3. **Store:** the answer goes into a variable (a box).

```python
name = input("Your name? ")
print("Salaam,", name)
```

You should see (you type the part after the question):

```
Your name? Mohammad
Salaam, Mohammad
```

> If the program seems "stuck", it isn't. It's waiting for you to type in the output area and press **Enter**.

## The space matters

Put a space at the end of your question, inside the quotes. Otherwise the answer is squashed against it:

| Code | What the user sees |
| --- | --- |
| `input("Name?")` | `Name?Mohammad` |
| `input("Name? ")` | `Name? Mohammad` |

## input() always gives you text

Even if you type a number, `input()` puts **text** in the box. Remember `"8" + "1"` from last week?

```python
age = input("Age? ")
print(age + 1)
```

```
Age? 13
TypeError: can only concatenate str (not "int") to str
```

Python is saying: "You asked me to add text and a number. I can't do that."

## The fix: int()

`int()` turns text like `"13"` into the number `13`. Wrap it around `input()`:

```python
age = int(input("Age? "))
print("Next year:", age + 1)
```

```
Age? 13
Next year: 14
```

| Code | You type | What's in the box |
| --- | --- | --- |
| `x = input("? ")` | 13 | `"13"` (text) |
| `x = int(input("? "))` | 13 | `13` (a number) |
| `x = int(input("? "))` | thirteen | `ValueError`: needs digits |

## Let's build: Salah counter

```python
days = int(input("Days? "))
prayers = days * 5
print("Prayers:", prayers)
```

```
Days? 7
Prayers: 35
```

## Your turn

Plan the dates for iftar. Each guest gets 3 dates:

```python
guests = int(input("Guests? "))
dates = guests * 3
print("Buy", dates, "dates")
```

**Finished early?** Ask one more question (like the host's name) and use it in the last line.

## Bug hunt

| Broken | What happens | Fix |
| --- | --- | --- |
| `input(What is your name?)` | `SyntaxError` | Put quotes around the question |
| `print(age + 1)` with no `int()` | `TypeError`: text + number | Use `int(input(...))` |
| Typing `ten` into `int(input())` | `ValueError` | Type digits: `10` |
| `input("Name?")` | Answer squashed: `Name?Mohammad` | Add a space before the last quote |

## Sneak peek: next week

More math! Python can tell you how many full boxes you can fill, and how many are left over:

```python
print(17 // 5)   # 3 full boxes
print(17 % 5)    # 2 left over
```
