import sympy as sp
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import minimize_scalar
import sys

# Define the symbols
# x, a, b, c, d = sp.symbols('x a b c d')
x = sp.symbols('x')
xt_2 = 500 # xt,2
yt_2 = 1000 # yt,2
yt_1 = 1000 # yt,1
xt_1 = 100 # xt,1 and we want yt,1 / xt,1 > yt,2 / xt,2

print(yt_1/xt_1)
print(yt_2/xt_2)



# Define the function
f = xt_2 * (1 - yt_2 / (yt_2 + yt_1 * (1 - xt_1 / (xt_1 + x)))) - x

def f(x):
    return xt_2 * (1 - yt_2 / (yt_2 + yt_1 * (1 - xt_1 / (xt_1 + x)))) - x

# Find the numerical maximum
def negative_f(x):
    return -f(x)

result = minimize_scalar(negative_f, bounds=(0, 2000), method='bounded')
max_x = result.x
max_value = -result.fun

print(f"The maximum point (x > 0) is: {max_x}")
print(f"The maximum value is: {max_value}")

# Create a numpy function for faster evaluation
f_np = np.vectorize(f)

# Generate x values
x_vals = np.linspace(0, 2000, 1000)

# Calculate y values
y_vals = f_np(x_vals)

# Create the plot
plt.figure(figsize=(10, 6))
plt.plot(x_vals, y_vals, label='f(x)')
plt.axhline(y=0, color='r', linestyle='--', label='y=0')
plt.axvline(x=max_x, color='g', linestyle='--', label='Maximum x')

plt.title('Plot of f(x)')
plt.xlabel('x')
plt.ylabel('f(x)')
plt.legend()
plt.grid(True)

# Add a point for the maximum
plt.plot(max_x, max_value, 'ro', label='Maximum point')

# Add text annotation for the maximum point
plt.annotate(f'Max: ({max_x:.2f}, {max_value:.2f})',
             xy=(max_x, max_value),
             xytext=(10, 10),
             textcoords='offset points',
             ha='left',
             va='bottom',
             bbox=dict(boxstyle='round,pad=0.5', fc='yellow', alpha=0.5),
             arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0'))

plt.show()

sys.exit()
