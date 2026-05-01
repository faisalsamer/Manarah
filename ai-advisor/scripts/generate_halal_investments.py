import json
import os

def generate_halal_investments():
    """Generate halal investment options"""
    
    investments = {
        "etfs": [
            {
                "id": "inv_001",
                "name": "Wahed Dow Jones Islamic Market ETF",
                "ticker": "HLAL",
                "type": "etf",
                "min_investment": 500,
                "current_price": 42.50,
                "expected_return": "8-12%",
                "risk_level": "medium",
                "shariah_certified": True,
                "certifier": "AAOIFI",
                "region": "Global",
                "description": "Tracks Dow Jones Islamic Market Index of Shariah-compliant companies"
            },
            {
                "id": "inv_002",
                "name": "SP Funds S&P 500 Sharia Industry Exclusions ETF",
                "ticker": "SPUS",
                "type": "etf",
                "min_investment": 300,
                "current_price": 28.75,
                "expected_return": "9-13%",
                "risk_level": "medium",
                "shariah_certified": True,
                "certifier": "AAOIFI",
                "region": "USA",
                "description": "S&P 500 companies filtered for Shariah compliance"
            },
            {
                "id": "inv_003",
                "name": "iShares MSCI World Islamic UCITS ETF",
                "ticker": "ISWD",
                "type": "etf",
                "min_investment": 400,
                "current_price": 35.20,
                "expected_return": "7-11%",
                "risk_level": "medium",
                "shariah_certified": True,
                "certifier": "MSCI Islamic Index",
                "region": "Global",
                "description": "Global Shariah-compliant equity exposure"
            },
            {
                "id": "inv_004",
                "name": "Falcom Saudi Equity ETF",
                "ticker": "FALCOM",
                "type": "etf",
                "min_investment": 200,
                "current_price": 18.60,
                "expected_return": "6-10%",
                "risk_level": "low",
                "shariah_certified": True,
                "certifier": "Tadawul",
                "region": "Saudi Arabia",
                "description": "Saudi stock market Shariah-compliant companies"
            }
        ],
        
        "sukuk": [
            {
                "id": "inv_005",
                "name": "Saudi Government Sukuk 2027",
                "type": "sukuk",
                "issuer": "Saudi Government",
                "min_investment": 1000,
                "current_price": 1000,
                "expected_return": "5-7%",
                "risk_level": "low",
                "shariah_certified": True,
                "certifier": "AAOIFI",
                "maturity_date": "2027-12-31",
                "region": "Saudi Arabia",
                "description": "Saudi government-backed Islamic bond"
            },
            {
                "id": "inv_006",
                "name": "Dubai Islamic Bank Sukuk 2028",
                "type": "sukuk",
                "issuer": "Dubai Islamic Bank",
                "min_investment": 5000,
                "current_price": 5000,
                "expected_return": "6-8%",
                "risk_level": "low",
                "shariah_certified": True,
                "certifier": "AAOIFI",
                "maturity_date": "2028-06-30",
                "region": "UAE",
                "description": "Corporate Islamic bond from leading Islamic bank"
            },
            {
                "id": "inv_007",
                "name": "Malaysia Sovereign Sukuk 2029",
                "type": "sukuk",
                "issuer": "Malaysian Government",
                "min_investment": 2000,
                "current_price": 2000,
                "expected_return": "5.5-7.5%",
                "risk_level": "low",
                "shariah_certified": True,
                "certifier": "Securities Commission Malaysia",
                "maturity_date": "2029-03-15",
                "region": "Malaysia",
                "description": "Malaysian government Islamic bond in MYR"
            },
            {
                "id": "inv_008",
                "name": "Saudi Aramco Sukuk 2030",
                "type": "sukuk",
                "issuer": "Saudi Aramco",
                "min_investment": 10000,
                "current_price": 10000,
                "expected_return": "6.5-8.5%",
                "risk_level": "low",
                "shariah_certified": True,
                "certifier": "AAOIFI",
                "maturity_date": "2030-11-20",
                "region": "Saudi Arabia",
                "description": "Corporate sukuk from world's largest oil company"
            }
        ],
        
        "stocks": [
            {
                "id": "inv_009",
                "name": "Microsoft Corporation",
                "ticker": "MSFT",
                "type": "stock",
                "min_investment": 400,
                "current_price": 420.00,
                "expected_return": "10-15%",
                "risk_level": "medium",
                "shariah_certified": True,
                "certifier": "Zoya",
                "compliance_score": 85,
                "sector": "Technology",
                "region": "USA",
                "description": "Leading technology company - Shariah compliant"
            },
            {
                "id": "inv_010",
                "name": "Apple Inc.",
                "ticker": "AAPL",
                "type": "stock",
                "min_investment": 180,
                "current_price": 180.00,
                "expected_return": "8-14%",
                "risk_level": "medium",
                "shariah_certified": True,
                "certifier": "Zoya",
                "compliance_score": 82,
                "sector": "Technology",
                "region": "USA",
                "description": "Consumer electronics leader - Shariah compliant"
            },
            {
                "id": "inv_011",
                "name": "Saudi Aramco",
                "ticker": "2222.SR",
                "type": "stock",
                "min_investment": 30,
                "current_price": 28.50,
                "expected_return": "6-11%",
                "risk_level": "low",
                "shariah_certified": True,
                "certifier": "Tadawul",
                "compliance_score": 95,
                "sector": "Energy",
                "region": "Saudi Arabia",
                "description": "World's largest oil company - listed on Tadawul"
            },
            {
                "id": "inv_012",
                "name": "Al Rajhi Bank",
                "ticker": "1120.SR",
                "type": "stock",
                "min_investment": 85,
                "current_price": 85.00,
                "expected_return": "7-12%",
                "risk_level": "low",
                "shariah_certified": True,
                "certifier": "Tadawul",
                "compliance_score": 100,
                "sector": "Islamic Banking",
                "region": "Saudi Arabia",
                "description": "Largest Islamic bank in the world"
            },
            {
                "id": "inv_013",
                "name": "Amazon.com Inc.",
                "ticker": "AMZN",
                "type": "stock",
                "min_investment": 170,
                "current_price": 170.00,
                "expected_return": "9-16%",
                "risk_level": "high",
                "shariah_certified": True,
                "certifier": "Zoya",
                "compliance_score": 78,
                "sector": "E-commerce",
                "region": "USA",
                "description": "E-commerce and cloud computing - Shariah compliant"
            },
            {
                "id": "inv_014",
                "name": "STC (Saudi Telecom)",
                "ticker": "7010.SR",
                "type": "stock",
                "min_investment": 120,
                "current_price": 120.00,
                "expected_return": "5-9%",
                "risk_level": "low",
                "shariah_certified": True,
                "certifier": "Tadawul",
                "compliance_score": 92,
                "sector": "Telecommunications",
                "region": "Saudi Arabia",
                "description": "Leading telecom provider in Saudi Arabia"
            }
        ],
        
        "real_estate": [
            {
                "id": "inv_015",
                "name": "Al Ahli REIT Fund",
                "ticker": "REIT1",
                "type": "reit",
                "min_investment": 1000,
                "current_price": 12.50,
                "expected_return": "7-10%",
                "risk_level": "medium",
                "shariah_certified": True,
                "certifier": "CMA",
                "sector": "Commercial Real Estate",
                "region": "Saudi Arabia",
                "description": "Shariah-compliant real estate investment trust"
            },
            {
                "id": "inv_016",
                "name": "Riyad REIT Fund",
                "ticker": "REIT2",
                "type": "reit",
                "min_investment": 800,
                "current_price": 10.80,
                "expected_return": "6-9%",
                "risk_level": "low",
                "shariah_certified": True,
                "certifier": "CMA",
                "sector": "Mixed Use Properties",
                "region": "Saudi Arabia",
                "description": "Diversified Shariah-compliant real estate portfolio"
            }
        ],
        
        "metadata": {
            "total_investments": 16,
            "last_updated": "2026-04-28",
            "currency": "SAR (converted from USD where applicable)",
            "disclaimer": "Investment values and returns are illustrative. Always consult a licensed financial advisor.",
            "shariah_certifiers": [
                "AAOIFI - Accounting and Auditing Organization for Islamic Financial Institutions",
                "Zoya - Halal stock screening service",
                "Tadawul - Saudi Stock Exchange",
                "CMA - Capital Market Authority (Saudi Arabia)"
            ]
        }
    }
    
    return investments

def main():
    """Generate and save halal investments data"""
    
    print("💰 Generating Halal Investments Data...\n")
    
    # Create data directory
    os.makedirs('data', exist_ok=True)
    
    # Generate investments
    investments = generate_halal_investments()
    
    # Save to file
    output_file = 'data/halal_investments.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(investments, f, indent=2, ensure_ascii=False)
    
    # Summary
    print(f"✅ Generated halal investments data")
    print(f"\n📊 Summary:")
    print(f"   ETFs: {len(investments['etfs'])}")
    print(f"   Sukuk: {len(investments['sukuk'])}")
    print(f"   Stocks: {len(investments['stocks'])}")
    print(f"   REITs: {len(investments['real_estate'])}")
    print(f"   Total: {investments['metadata']['total_investments']} investment options")
    
    print(f"\n💵 Investment Range:")
    all_investments = (
        investments['etfs'] + 
        investments['sukuk'] + 
        investments['stocks'] + 
        investments['real_estate']
    )
    min_inv = min(inv['min_investment'] for inv in all_investments)
    max_inv = max(inv['min_investment'] for inv in all_investments)
    print(f"   Minimum: SAR {min_inv:,.2f}")
    print(f"   Maximum: SAR {max_inv:,.2f}")
    
    print(f"\n📁 Saved to: {output_file}")

if __name__ == '__main__':
    main()