# option 2 - import the whole module
import math

a=math.exp(1)
b=math.pi

# option 1 - import only specific functions
from math import exp, pi

a=exp(1)
b=pi

# Random numbers
import random as rn

#set the seed to system clock time
rn.seed()

#test some methods in the random module
a=rn.random()		#uniform random number between 0 and 1
print(a)
b=rn.uniform(7,20)	#uniform random number between 7 and 20
print(b)
c=rn.randint(100,200) #random integer between 100 and 200
print(c)

print("hello", end="") # prints without a new line at the end

numbers = [1,2,3]
for number in numbers:
  print(number, end='')
  print(" ", end='')
# result: 1 2 3


# To reassign a global variable inside a function you have to declare the global variable before you use it:

been_called = False

def example2():
    global been_called 
    been_called = True

# The global statement tells the interpreter something like, "In this function, when I say been_called, 
# I mean the global variable; don’t create a local one".