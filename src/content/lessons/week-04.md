---
week: 4
title: Sharing Fairly
date: 2026-11-20
unit: Python basics
summary: Use // to find how many each person gets and % to find what's left over. Then use them to share food, split money and turn minutes into hours.
objectives:
  - Know the difference between /, // and %
  - Use // to find how many full groups you can make
  - Use % to find what's left over
  - Use % 2 to tell if a number is even or odd
  - Turn minutes into hours and minutes
  - Fix the most common division mistakes
assignment:
  title: Fair Share Calculator
  due: 2026-11-27
  summary: Write a program that shares things out fairly and tells you what's left over.
  required:
    - Ask how many things there are (cups of baat, dates, dollars...) with int(input())
    - Ask how many people are sharing, also with int(input())
    - Use // to print how many each person gets
    - Use % to print how many are left over
  bonus: Make a Time Converter. Ask for a number of minutes, then print it as hours and minutes (for example, 135 minutes is 2 hours and 15 minutes).
---

## Warm-up: last week

Who finished **My Chat Bot**? 1–2 people show theirs. Remember the trick from last week:

```python
age = int(input("Age? "))
```

`int()` turns the answer into a number, so we can do math with it. Today we do **more math**.

## The big idea: sharing baat

Your mom made **17 cups of baat** (rice) for **5 people**. How do you share it fairly, in full cups?

- Each person gets **3** cups (5 × 3 = 15).
- There are **2** left over (17 − 15 = 2).

Python has two signs for this:

| Sign | Name | Question it answers | `17 ? 5` |
| --- | --- | --- | --- |
| `//` | floor division | How many does each person get? | `3` |
| `%` | remainder (mod) | How many are left over? | `2` |

> `%` does **not** mean percent in Python. It means "what's left over".

## Three ways to divide

```python
print(17 / 5)
print(17 // 5)
print(17 % 5)
```

You should see:

```
3.4
3
2
```

| Code | Result | What it means |
| --- | --- | --- |
| `17 / 5` | `3.4` | Normal division, with a decimal |
| `17 // 5` | `3` | Whole groups only, throw away the decimal |
| `17 % 5` | `2` | The leftovers |

## Let's build: baat sharer

```python
cups = int(input("Cups? "))
people = int(input("People? "))
each = cups // people
left = cups % people
print("Each gets", each)
print("Left over:", left)
```

```
Cups? 17
People? 5
Each gets 3
Left over: 2
```

Try it with different numbers. What happens with 20 cups and 5 people?

## Even or odd?

Divide a number by 2. If nothing is left over, it's **even**. If 1 is left over, it's **odd**.

```python
print(10 % 2)
print(7 % 2)
```

```
0
1
```

So `% 2` gives `0` for even numbers and `1` for odd numbers. We'll use this trick a lot once we learn `if`.

## Minutes into hours

Taraweeh took **135 minutes**. How many hours and minutes is that? There are 60 minutes in an hour:

```python
mins = int(input("Minutes? "))
hours = mins // 60
left = mins % 60
print(hours, "hr", left, "min")
```

```
Minutes? 135
2 hr 15 min
```

## Your turn

Grandma gives **$50** of Eid money to share between **3** siblings:

```python
money = int(input("Eid money? "))
kids = int(input("Kids? "))
each = money // kids
left = money % kids
print("Each kid gets", each)
print("Left over:", left)
```

```
Eid money? 50
Kids? 3
Each kid gets 16
Left over: 2
```

**Finished early?** Ramadan has 30 days. Write a program that turns days into **weeks and days** (30 days = 4 weeks and 2 days).

## Bug hunt

| Broken | What happens | Fix |
| --- | --- | --- |
| `17 / 5` when you wanted whole groups | Gives `3.4`, not `3` | Use `//` |
| `n = input("? ")` then `n // 5` | `TypeError`: unsupported operand type(s) for //: 'str' and 'int' | Use `int(input(...))` |
| `cups // 0` | `ZeroDivisionError`: division by zero | You can't share with 0 people! Type a number bigger than 0 |
| Using `%` to mean percent | `50 % 10` gives `0`, not 5 | `%` means leftovers. For 10% of 50, use `50 * 10 / 100` |

## Sneak peek: next week

Programs that make **decisions**:

```python
score = int(input("Score? "))
if score >= 10:
    print("You win!")
```
