import json
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variables
API_KEY = os.getenv('THEGRAPH_API_KEY')

UNIV2_SUBGRAPH_URL = f"https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/4jGhpKjW4prWoyt5Bwk1ZHUwdEmNWveJcjEyjoTZWCY9"

def check_univ2_pair(token_address):
    query = f"""
    {{
      pairs(where: {{ token0: "{token_address}" }}) {{
        id
        token0 {{
          id
          symbol
        }}
        token1 {{
          id
          symbol
        }}
        reserveUSD
      }}
    }}
    """
    response = requests.post(UNIV2_SUBGRAPH_URL, json={'query': query})
    print("Status Code:", response.status_code)
    print("Response:", response.text)
    return response.json()['data']['pairs']

def main():
    # Load saved Uniswap v3 data
    with open('uniswap_pools.json', 'r') as f:
        pools = json.load(f)
    
    # Test with first non-WETH token from each pool
    for pool in pools:
        tokens = pool['inputTokens']
        non_weth_token = next((token for token in tokens if token['symbol'] != 'WETH'), tokens[0])
        print(f"\nChecking Uniswap V2 for token: {non_weth_token['symbol']} ({non_weth_token['id']})")
        try:
            univ2_pairs = check_univ2_pair(non_weth_token['id'])
            if univ2_pairs:
                print(f"Found {len(univ2_pairs)} Uniswap V2 pairs:")
                for pair in univ2_pairs:
                    print(f"  Pair {pair['id']}: {pair['token0']['symbol']}-{pair['token1']['symbol']} (${pair['reserveUSD']})")
            else:
                print("No Uniswap V2 pairs found")
        except Exception as e:
            print("Error:", str(e))

if __name__ == "__main__":
    main() 