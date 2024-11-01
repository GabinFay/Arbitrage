 import json
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variables
API_KEY = os.getenv('THEGRAPH_API_KEY')

SUSHISWAP_SUBGRAPH_URL = f"https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/9KSiDKQ3KnwyxU5yA1KkGbqF4uREHVfmUcrLyjS4itSY"

def check_sushiswap_pair(token_address):
    query = f"""
    {{
      pairs(where: {{ token0: "{token_address}" }}) {{
        id
      }}
    }}
    """
    response = requests.post(SUSHISWAP_SUBGRAPH_URL, json={'query': query})
    print("Status Code:", response.status_code)
    print("Response:", response.text)
    return response.json()['data']['pairs']

def main():
    # Load saved Uniswap data
    with open('uniswap_pools.json', 'r') as f:
        pools = json.load(f)
    
    # Test with first non-WETH token from each pool
    for pool in pools:
        tokens = pool['inputTokens']
        non_weth_token = next((token for token in tokens if token['symbol'] != 'WETH'), tokens[0])
        print(f"\nChecking SushiSwap for token: {non_weth_token['symbol']} ({non_weth_token['id']})")
        try:
            sushiswap_pairs = check_sushiswap_pair(non_weth_token['id'])
            print("SushiSwap pairs found:", sushiswap_pairs)
        except Exception as e:
            print("Error:", str(e))

if __name__ == "__main__":
    main()