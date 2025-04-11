# Methods of lists
t = [1,2,3]
t.append('4') ## updates t to [1,2,3,4]
t.extend([5,6]) ## updates t to [1,2,3,4,5,6]

t + [7, 8] ## creates a new list  

## Slices
t = [1,2,3,4,5]
t[:] # clones the entire list
t[0:1] # [1,2]
t[1:] # [2,3,4,5]

## Delete elements
t.pop() ## updates the list, and removed the last element [1,2,3,4]
t.pop(1) ## updates the list, and removed the element with the given index

del t[1]
t.remove(1) ## [1,3,4,5]

# Exercises

def nested_sum(t):
  r = []
  for i in t:
    r.extend(i)
  print(r)
# nested_sum([[1, 2], [3], [4, 5, 6]]) # [1, 2, 3, 4, 5, 6]

def cumsum(t):
  r = t[:]
  for i in range(len(r)):
    if i>0:
      r[i] += r[i-1]
  print(r)
# cumsum([1,2,3]) # [1, 3, 6]

def middle(t):
  return t[1:-1]
# print(middle([1,2,3,4])) # [2, 3]

def chop(t):
  t.pop(0)
  t.pop(-1)
  return
# t = [1,2,3,4]
# print(chop(t))
# print('new t', t)

# check if ascending order
def is_sorted(t):
  r = True
  
  for i in range(1,len(t)):
    print('i=', i)

    if t[i-1] > t[i]:
      print('prev', t[i-1], 'is NOT smaller than', t[i])
      r = False
      break
  return r

# print(is_sorted([1, 2, 2])) # True
# print(is_sorted(['e', 'c'])) # False

def is_anagram(str1, str2):
  """""
  Check if two strings are anagrams of each other.

  :param str1: First string
  :param str2: Second string
  :return True if the strings are anagrams, False otherwise
  """""
  # Normalize the string: remove spaces, convert to lowercase
  str1 = str1.replace(" ", "").lower()
  str2 = str2.replace(" ", "").lower()

  return sorted(str1) == sorted(str2)
# print(is_anagram('abc', 'bac')) # True

def has_duplicates(t):
  dict = {}
  for i in t:
    if i in dict:
      return True
    else:
      dict[i] = 1
  return False

# print(has_duplicates([1,3,2,2]))

def is_reverse(w1, w2):
  len1 = len(w1)
  len2 = len(w2)

  if len1 != len2:
    return False
  
  for i in range(len1):
    if w1[i] != w2[len1-1-i]:
      return False
  
  return True

# print(is_reverse('abc', 'cba'))

# sorting
strs = ['ccc', 'aaaa', 'd', 'bb']
# print(sorted(strs))  ## ['BB', 'CC', 'aa', 'zz'] (case sensitive)
# print(sorted(strs, reverse=True))   ## ['zz', 'aa', 'CC', 'BB']
# print(sorted(strs, key=len))  ## ['d', 'bb', 'ccc', 'aaaa']

# def MyFn(s):
#     return s[-1]
# print(sorted(strs, key=MyFn))  ## ['d', 'bb', 'ccc', 'aaaa']


# tuples
tuple = (1, 2, 'hi')
# tuple[2] = 'bye'  ## NO, tuples cannot be changed
tuple = (1, 2, 'bye')  ## this works
tuple = ('hi',)   ## size-1 tuple
## required for ordinary case of putting an expression in parentheses.

# List Comprehensions (optional)
nums = [1, 2, 3, 4]
squares = [ n * n for n in nums ]   ## [1, 4, 9, 16]
# Syntax: [ expr for var in list ]

# You can add an if test to the right of the for-loop to narrow the result
## Select values <= 2
nums = [2, 8, 1, 6]
small = [ n for n in nums if n <= 2 ]  ## [2, 1]
