# Echo the contents of a file
# f = open('file.txt', 'r') # use w = write, a = append
# for line in f:   ## iterates over the lines of the file
#   print(line,  end='')    ## end='' prevents extra newlines
#                           ## since 'line' already includes the end-of-line.
# f.close()

# Alternative (Recommended) Approach:
# with open('file.txt', 'r') as f:
#   for line in f:
#     print(line, end='')  # end='' prevents extra newlines

# File write - options of syntax:
- print >> f, string
- In python 3000: print(string, file=f)
- f.write()

# Example:
f_in = open('file.txt', 'r')
f_out = open('file_out.txt', 'w')
for line in f_in:   ## iterates over the lines of the file
  print('copied: ' + line, file=f_out, end='')
f_in.close()
f_out.close()

# Files unicode
import codecs

f = codecs.open('foo.txt', 'r', 'utf-8')
for line in f:
  # here line is a *unicode* string