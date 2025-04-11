# Reminder:
Lists are mutable, strings are immutable. 

# TUPLES

tuples and sets = immutable

# The syntax for forming a tuple uses parentheses (instead of square brackets for forming a list):
a=[1, 2, 3] # list
b=(1, 2, 3) # tuple
print(type(b)) # <class 'tuple'>

Usages for tuples:
- holding data that must be write-protected

# SETS

- Immutable data type that holds a unique collection of objects. 
- Used to perform typical set operations: union, intersection, set differences, and so on. 
- Duplicates values are not possible within a set. 
- Left and right squirrely brackets are used to assign sets

a={3,4,5,6,7,9} # set
print(type(a)) # <class 'set'>


# Operations on sets:

a={3,4,5}
b={4,5,6,7,8,9}
c=a.intersection(b)
print(c) # {4, 5}
d=a.union(b)
print(d) # {3, 4, 5, 6, 7, 8, 9}
e=8
print(e in b) # True
print(e in a) # False
f=b.difference(a)
print(f) # {8, 9, 6, 7}

# Dictionary

- mutable. Values can be referenced and modified by using the key
- key value pair. Aka item. A value in a dictionary is referenced by its key.
- In general, the order of items in a dictionary is unpredictable.
- If the key isn't in the dictionary a['x'], you get an exception.
- Python dictionaries use a data structure called a 'hashtable' that has a remarkable property: 
the in operator takes about the same amount of time no matter how many items are in the dictionary.

a={'a':'1', 'b': '2'}
print(a) # {'a': 1, 'b': 2}
print(type(a)) # <class 'dict'>

# Mutations:
a['b'] = 22 # mutation of an existing value
a['c'] = 3 # mutation of one new value
a.update({'d': 4, 'e': 5})	#add several new entries
del a['b'] # delete an entry

The len function works on dictionaries; it returns the number of key-value pairs:

>>> len(eng2sp)
3

To see whether something appears as a value in a dictionary, you can use the method 'values', 
which returns a collection of values, and then use the in operator:
>>> vals = eng2sp.values()
>>> 'uno' in vals
True

Dictionaries have a method called get that takes a key and a default value. 
If the key appears in the dictionary, get returns the corresponding value.
Otherwise, it returns the default value.
For example:
>>> h = histogram('a')
>>> h
{'a': 1}
>>> h.get('a', 0)
1
>>> h.get('c', 0)
0

Exercice:
def histogram(s):
    d = dict()
    for c in s:
        d[c] = d.get(c, 0) + 1
    return d

print(histogram('aaabbcg')) # {'a': 3, 'b': 2, 'c': 1, 'g': 1}

# Looping
for key in d:
    print(key, d[key]) # the keys are in  no particular order

# To traverse the keys in sorted order, you can use the built-in function sorted:
for key in sorted(d):
  print(key, d[key])
a 1
o 1
p 1
r 2
t 1

## print dict['z']                  ## Throws KeyError
if 'z' in dict: print dict['z']     ## Avoid KeyError
print(dict.get('z')) # None

dict.values() # list of values
dict.keys() # list of keys
dict.items() # tuple key value pair

# Iterating = random order of keys
for key in dict: print key
## prints a g o

## Exactly the same as above
for key in dict.keys(): print key

## Common case -- loop over the keys in sorted order,
## accessing each key/value
for key in sorted(dict.keys()):
  print key, dict[key]

  ## .items() is the dict expressed as (key, value) tuples
print dict.items()  ##  [('a', 'alpha'), ('o', 'omega'), ('g', 'gamma')]

## This loop syntax accesses the whole dict by looping
## over the .items() tuple list, accessing one (key, value)
## pair on each iteration.
for k, v in dict.items(): print k, '>', v
## a > alpha    o > omega     g > gamma