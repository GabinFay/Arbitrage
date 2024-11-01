import json
import matplotlib.pyplot as plt
import numpy as np

# Load the liquidity data
with open('liquidity_data.json', 'r') as f:
    liquidity_data = json.load(f)

# Extract ticks and liquidity
ticks = [item['tick'] for item in liquidity_data]
liquidity = [int(item['liquidityNet']) for item in liquidity_data]

# Calculate cumulative liquidity
cumulative_liquidity = np.cumsum(liquidity)

# Create the plot
plt.figure(figsize=(12, 6))
plt.plot(ticks, cumulative_liquidity)
plt.title('Liquidity Distribution')
plt.xlabel('Tick')
plt.ylabel('Cumulative Liquidity')
plt.grid(True)

# Add price labels
def tick_to_price(tick):
    return 1.0001 ** tick

price_ticks = [-6000, -3000, 0, 3000, 6000]
price_labels = [f'{tick_to_price(tick):.4f}' for tick in price_ticks]
plt.xticks(price_ticks, price_labels)

plt.tight_layout()
plt.show()
# plt.savefig('liquidity_distribution.png')
# plt.close()

print("Liquidity distribution plot saved as liquidity_distribution.png")