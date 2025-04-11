dict = {'a': 1, 'b': 2}
# print(dict.get('z'))

# for k, v in dict.items(): print(k, '>', v)

# Dict Formatting
# The % operator works conveniently to substitute values from a dict
hash = {}
hash['word'] = 'garfield'
hash['count'] = 42
s = 'I want %(count)d copies of %(word)s' # %d for int, %s for string #
print(s % hash) # 'I want 42 copies of garfield'

