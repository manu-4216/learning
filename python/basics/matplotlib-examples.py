# Read about venv
# https://packaging.python.org/en/latest/tutorials/installing-packages/

# python3 -m venv .venv
# source .venv/bin/activate

import matplotlib.pyplot as plt

x=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y=[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
plt.plot(x,y)
plt.xlabel('X')
plt.ylabel('Y')
plt.title('Test Plot')
plt.show()
plt.savefig('plot1.png')