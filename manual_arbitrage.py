import requests
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Get API key from environment variables
API_KEY = os.getenv('THEGRAPH_API_KEY')

# Updated URLs with API key
UNIV3_SUBGRAPH_URL = f"https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/FUbEPQw1oMghy39fwWBFY5fE6MXPXZQtjncQy2cXdrNS"
UNIV2_SUBGRAPH_URL = f"https://gateway.thegraph.com/api/{API_KEY}/subgraphs/id/4jGhpKjW4prWoyt5Bwk1ZHUwdEmNWveJcjEyjoTZWCY9"

def fetch_univ3_pools():
    all_pools = []
    skip = 0
    max_pools = 50000  # Set maximum number of pools to fetch
    
    while len(all_pools) < max_pools:
        query = """
        {
          liquidityPools(first: 1000, skip: %d, orderBy: createdTimestamp, orderDirection: desc) {
            id
            inputTokens {
              id
              symbol
            }
            totalValueLockedUSD
          }
        }
        """ % skip
        
        response = requests.post(UNIV3_SUBGRAPH_URL, json={'query': query})
        print(f"V3 Status Code: {response.status_code} | Fetched: {len(all_pools)}/{max_pools} pools")
        
        data = response.json()
        pools = data['data']['liquidityPools']
        
        if not pools:  # No more pools to fetch
            break
            
        all_pools.extend(pools)
        skip += 1000
        
        if len(all_pools) >= max_pools:
            all_pools = all_pools[:max_pools]  # Trim to exactly max_pools
            break
    
    print(f"Total pools fetched: {len(all_pools)}")
    return all_pools

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
    print(f"V2 Status Code for {token_address}:", response.status_code)
    return response.json()['data']['pairs']

def check_univ3_pair(token0_address, token1_address):
    query = """
    {
      liquidityPools(
        where: {
          and: [
            {inputTokens_contains: ["%s"]},
            {inputTokens_contains: ["%s"]}
          ]
        }
      ) {
        id
        inputTokens {
          id
          symbol
        }
        totalValueLockedUSD
      }
    }
    """ % (token0_address, token1_address)
    
    response = requests.post(UNIV3_SUBGRAPH_URL, json={'query': query})
    print(f"V3 Status Code for pair check:", response.status_code)
    return response.json()['data']['liquidityPools']

def main():
    # Fetch V3 pools
    print("Fetching Uniswap V3 pools...")
    v3_pools = fetch_univ3_pools()
    
    # Check each token for V2 liquidity
    for pool in v3_pools:
        if float(pool['totalValueLockedUSD']) > 100000:
            tokens = pool['inputTokens']
            non_weth_token = next((token for token in tokens if token['symbol'] != 'WETH'), tokens[0])
            print(f"\nChecking V2 pairs for token: {non_weth_token['symbol']} ({non_weth_token['id']})")
            print(f"V3 Pool TVL: ${pool['totalValueLockedUSD']}")
        
            try:
                v2_pairs = check_univ2_pair(non_weth_token['id'])
                for pair in v2_pairs:
                    if float(pair['reserveUSD']) > 10000:
                        print(f"  Found V2 Pair {pair['id']}: {pair['token0']['symbol']}-{pair['token1']['symbol']} (${pair['reserveUSD']})")
                        
                        # Check if this V2 pair exists on V3
                        v3_matching_pools = check_univ3_pair(pair['token0']['id'], pair['token1']['id'])
                        if v3_matching_pools:
                            print("    Matching V3 pools found:")
                            for v3_pool in v3_matching_pools:
                                print(f"    V3 Pool {v3_pool['id']}: TVL ${v3_pool['totalValueLockedUSD']}")
                        else:
                            print("    No matching V3 pools found")
            except Exception as e:
                print(f"Error checking pairs: {str(e)}")

if __name__ == "__main__":
    main()
