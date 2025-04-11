# Strings are immutable objects
a='asdf'
a[1]='3' ## error !!

## Methods

#explore changing to uppercase and lowercase
a='gOOd'
c=a.upper() ## GOOD
d=c.lower() ## good

e=' '.join(['Hello','John']) ## Hello John
print(e)

#find method returns the first index where string was found
x='a picture is worth a thousand words'
x1=x.find('picture')
print(x1) # 1
x2=x.find('abc')
print(x2) # -1

y="Hello John".split(' ') # ["Hello", "John"]

"Hello John".replace('Hello', 'Hi') # returns a new string: "Hi John"

ord("a") # gets the asci of a character
chr(45) # gets the letter from asci number