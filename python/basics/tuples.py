# Tuples are like lists, but immutable

t = 'a', 'b', 'c', 'd', 'e'
# Not necessary, but usually with parentheses:
t = ('a', 'b', 'c', 'd', 'e')

# To create a tuple with a single element, you have to include a final comma:
t1 = 'a',
type(t1) # <class 'tuple'>

# A value in parentheses is not a tuple, but a string:
t1 = 'a' # !!!
type(t1) # <class 'string'>

# Another way: constructor tuple():
t = tuple([1,2]) # (1,2)
t = tuple('hi') # ('h', 'i')

# Most list operators also work on tuples. The bracket operator indexes an element:
t = ('a', 'b', 'c', 'd', 'e')
t[0] # 'a'

# Slice operator:
t[1:3] # ('b', 'c')

# Mutation won't work
t[0] = 'A' # TypeError: object doesn't support item assignment.

# But you can replace one tuple with another:
t = ('A',) + t[1:]
t # ('A', 'b', 'c', 'd', 'e')
# This statement makes a new tuple and then makes t refer to it..

# tuple assignment
a, b = b, a # this swaps the values of 2 variables in one go

a, b = 1, 2, 3
# ValueError: too many values to unpack

# With lists:
addr = 'monty@python.org'
uname, domain = addr.split('@')

t = divmod(7, 3)
t # (2, 1)

# Separate variables:
quot, rem = divmod(7, 3)

# Return multiple values with a atuple
def min_max(t):
    return min(t), max(t)

# Variable-length argument tuples, with *gather parameter
def printall(*args):
    print(args)

printall(1, 2.0, '3') # (1, 2.0, '3')

# The complement of gather is scatter. Example: pass multiple arguments to a function:
t = (7, 3)
divmod(t) # TypeError: divmod expected 2 arguments, got 1

# But if you scatter the tuple, it works:
divmod(*t) # (2, 1)

# Many of the built-in functions use variable-length argument tuples. 
# For example, max and mincan take any number of arguments:

max(1, 2, 3) # 3

# But sum does not.
sum(1, 2, 3) # TypeError: sum expected at most 2 arguments, got 3

# write a function called sum_all that takes any number of arguments and returns their sum.
def sum_all(*args):
  sum = 0
  for arg in args:
    sum += arg
  return sum

# zip utility
def has_match(t1, t2):
    for x, y in zip(t1, t2):
        if x == y:
            return True
    return False

# If you need to traverse the elements of a sequence and their indices, you can use the built-in function enumerate:
for index, element in enumerate('abc'):
    print(index, element)

# Dict and tuple iteration
for key, value in d.items():
  print(key, value)

# Create a dict
t = [('a', 0), ('c', 2), ('b', 1)]
d = dict(t)

# Combining dict with zip yields a concise way to create a dictionary
d = dict(zip('abc', range(3)))
d # {'a': 0, 'c': 2, 'b': 1}

# It is common to use tuples as keys in dictionaries (primarily because you can’t use lists). 
# For example, a telephone directory might map from last-name, first-name pairs to telephone numbers. 
# Assuming that we have defined last, first and number, we could write:

directory[last, first] = number

#  tuple assignment to traverse this dictionary.
for last, first in directory: # travers the keys tuples
    print(first, last, directory[last,first])

# Because tuples are immutable, they don’t provide methods like sort and reverse.
# But Python provides the built-in function sorted, which takes any sequence and
# returns a new list with the same elements in sorted order, and reversed, 
# which takes a sequence and returns an iterator that traverses the list in reverse order

# Revise
# https://learn.saylor.org/mod/book/view.php?id=29377&chapterid=4913