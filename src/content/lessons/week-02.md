---
week: 2
title: Variables
date: 2026-11-06
unit: Python basics
summary: Boxes that remember things. Store names, numbers, and messages, and use them again and again.
objectives:
  - Explain what a variable is using the "labelled box" idea
  - Create a variable and change its value
  - Print variables together with text
  - Tell the difference between "5" (text) and 5 (a number)
  - Pick good variable names and avoid the rules that cause errors
assignment:
  title: My Profile Card
  due: 2026-11-13
  summary: Store facts about yourself in variables, then print them as a profile card.
  required:
    - At least 5 variables (for example name, grade, favourite food, hobby, dream project)
    - Print a card that uses every variable at least once
    - Add a border or title line to make it look like a card
    - Change one variable, press Run again, and check the card updates
  bonus: Add a number variable and do math with it, like how many years until you finish grade 12.
---

## Warm-up: last week

Who finished **All About Me**? Last week, every line of text was typed straight into `print()`. If you wanted to change your favourite food, you had to find every line that mentioned it. Today we fix that.

## The big idea: a labelled box

A **variable** is like a box with a label on it. You put something inside, and later you ask for it by its label.

```python
name = "Amina"
print(name)
```

You should see:

```
Amina
```

Read `=` as **"put into"**, not "equals": *put `"Amina"` into the box called `name`*.

> Notice there are **no quotes** around `name` inside `print()`. Quotes mean "print these exact letters". No quotes means "look inside the box with this label".

## Text vs numbers

| Code | What's in the box | Type |
| --- | --- | --- |
| `food = "biryani"` | the letters b-i-r-y-a-n-i | text (a *string*) |
| `grade = 8` | the number 8 | number (an *integer*) |
| `age = "13"` | the characters 1 and 3 | text! The quotes make it text |

Numbers can do math. Text can't:

```python
grade = 8
print(grade + 1)    # 9
print("8" + "1")    # 81  (it just sticks the text together!)
```

## Printing variables with text

Use commas inside `print()`. Python puts a space between each part for you:

```python
name = "Yusuf"
grade = 9
print("My name is", name, "and I am in grade", grade)
```

You should see:

```
My name is Yusuf and I am in grade 9
```

## Boxes can change

Put something new in the box, and the old value is replaced. Python runs top to bottom, so **order matters**:

```python
prayer = "Fajr"
print("Next prayer:", prayer)

prayer = "Dhuhr"
print("Next prayer:", prayer)
```

```
Next prayer: Fajr
Next prayer: Dhuhr
```

## Naming rules

| Works | Breaks | Why |
| --- | --- | --- |
| `favourite_food` | `favourite food` | No spaces. Use `_` instead |
| `player2` | `2player` | Can't start with a number |
| `name` | `print` | Don't reuse Python's own words |

Python cares about capitals: `Name` and `name` are **two different boxes**.

## Your turn

Make three variables about your family's favourite meal, then print a sentence that uses all three:

```python
meal = "kabsa"
cook = "my mom"
day = "Friday"
print("On", day, cook, "makes", meal)
```

**Finished early?** Change just one variable and press Run. Only one line changed, but the sentence updated. That's the superpower.

## Bug hunt

| Broken | What happens | Fix |
| --- | --- | --- |
| `print(nmae)` | `NameError`: there's no box called `nmae` | Check the spelling |
| `print("name")` | Prints the word *name*, not Amina | Remove the quotes |
| `print(score)` before `score = 10` | `NameError`: the box doesn't exist yet | Create it first. Order matters |
| `print("Grade " + 8)` | `TypeError`: can't join text and a number with `+` | Use a comma: `print("Grade", 8)` |

## Sneak peek: next week

What if the *user* filled the box instead of you?

```python
name = input("What is your name? ")
print("Salaam,", name)
```
