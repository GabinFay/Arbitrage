import requests
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Get API key from environment variables
API_KEY = os.getenv('THEGRAPH_API_KEY')

# Updated URLs with API key
UNISWAP_SUBGRAPH_URL = f"https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/FUbEPQw1oMghy39fwWBFY5fE6MXPXZQtjncQy2cXdrNS"
SUSHISWAP_SUBGRAPH_URL = f"https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/9KSiDKQ3KnwyxU5yA1KkGbqF4uREHVfmUcrLyjS4itSY"

def fetch_uniswap_pools():
    query = """
    {
      liquidityPools(first: 10, orderBy: createdTimestamp, orderDirection: desc) {
        id
        inputTokens {
          id
          symbol
        }
        totalValueLockedUSD
      }
    }
    """
    response = requests.post(UNISWAP_SUBGRAPH_URL, json={'query': query})
    
    # Debug the response
    print("Status Code:", response.status_code)
    
    if response.status_code != 200:
        raise Exception(f"API request failed with status code {response.status_code}")
        
    data = response.json()
    if 'data' not in data:
        raise Exception(f"Unexpected API response format: {data}")
    
    # Save the response to a file
    with open('uniswap_pools.json', 'w') as f:
        json.dump(data['data']['liquidityPools'], f, indent=2)
    
    print("Data saved to uniswap_pools.json")
    return data['data']['liquidityPools']

def check_sushiswap_pair(token_address):
    query = f"""
    {{
      pairs(where: {{ token0: "{token_address}" }}) {{
        id
      }}
    }}
    """
    response = requests.post(SUSHISWAP_SUBGRAPH_URL, json={'query': query})
    return response.json()['data']['pairs']

def main():
    # Just fetch and save Uniswap data
    fetch_uniswap_pools()

if __name__ == "__main__":
    main()
